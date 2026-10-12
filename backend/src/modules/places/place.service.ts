import { prisma } from "../../lib/prisma.js";

// Upserts a place and keeps the PostGIS `geom` column in sync with lat/lng.
//
// Prisma models the normal columns; the geography column is maintained here
// with a raw UPDATE. We match on osmId when present (so the same real-world
// place is stored once), otherwise create a fresh row.

export interface PlaceInput {
  osmId?: string | null;
  name: string;
  locality?: string | null;
  country?: string | null;
  latitude: number;
  longitude: number;
}

export async function upsertPlace(input: PlaceInput): Promise<string> {
  let placeId: string;

  if (input.osmId) {
    const existing = await prisma.place.findUnique({
      where: { osmId: input.osmId },
      select: { id: true },
    });
    if (existing) {
      placeId = existing.id;
    } else {
      const created = await prisma.place.create({
        data: {
          osmId: input.osmId,
          name: input.name,
          locality: input.locality ?? null,
          country: input.country ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
        },
        select: { id: true },
      });
      placeId = created.id;
    }
  } else {
    const created = await prisma.place.create({
      data: {
        name: input.name,
        locality: input.locality ?? null,
        country: input.country ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      select: { id: true },
    });
    placeId = created.id;
  }

  // Keep geom in sync (ST_MakePoint takes lon, lat order).
  await prisma.$executeRawUnsafe(
    `UPDATE places
       SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
     WHERE id = $3`,
    input.longitude,
    input.latitude,
    placeId
  );

  return placeId;
}
