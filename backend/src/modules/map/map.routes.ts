import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { badRequest, notFound } from "../../lib/http.js";

export const mapRouter = Router();

// GET /users/:username/map?bbox=minLon,minLat,maxLon,maxLat
//
// Returns only the visited places whose point falls inside the current map
// viewport. The `&&` operator is a bounding-box overlap test that uses the
// GIST index on places.geom, so we never scan the user's whole history —
// this is the core geospatial performance win for the map screen.

interface PinRow {
  place_id: string;
  name: string;
  locality: string | null;
  country: string | null;
  lon: number;
  lat: number;
  visit_count: bigint;
  last_visit_id: string;
}

mapRouter.get(
  "/:username/map",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: { id: true },
    });
    if (!user) throw notFound("User not found");

    const bbox = String(req.query.bbox ?? "");
    const parts = bbox.split(",").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      throw badRequest("bbox must be 'minLon,minLat,maxLon,maxLat'");
    }
    const [minLon, minLat, maxLon, maxLat] = parts;

    const rows = await prisma.$queryRawUnsafe<PinRow[]>(
      `SELECT p.id            AS place_id,
              p.name          AS name,
              p.locality      AS locality,
              p.country       AS country,
              p.longitude     AS lon,
              p.latitude      AS lat,
              COUNT(v.id)     AS visit_count,
              (ARRAY_AGG(v.id ORDER BY v.created_at DESC))[1] AS last_visit_id
         FROM visits v
         JOIN places p ON p.id = v.place_id
        WHERE v.user_id = $1
          AND p.geom && ST_MakeEnvelope($2, $3, $4, $5, 4326)
        GROUP BY p.id`,
      user.id,
      minLon,
      minLat,
      maxLon,
      maxLat
    );

    res.json({
      pins: rows.map((r) => ({
        placeId: r.place_id,
        name: r.name,
        locality: r.locality,
        country: r.country,
        latitude: r.lat,
        longitude: r.lon,
        visitCount: Number(r.visit_count),
        lastVisitId: r.last_visit_id,
      })),
    });
  })
);
