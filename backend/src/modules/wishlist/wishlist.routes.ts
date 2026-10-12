import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { notFound, forbidden, conflict } from "../../lib/http.js";
import { upsertPlace } from "../places/place.service.js";

export const wishlistRouter = Router();

const placeInput = z.object({
  osmId: z.string().nullable().optional(),
  name: z.string().min(1),
  locality: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

const addSchema = z.object({
  placeId: z.string().uuid().optional(),
  place: placeInput.optional(),
  note: z.string().max(500).nullable().optional(),
}).refine((d) => d.placeId || d.place, { message: "Provide placeId or place" });

function serialize(w: any) {
  return {
    id: w.id, note: w.note, createdAt: w.createdAt,
    place: { id: w.place.id, name: w.place.name, locality: w.place.locality, country: w.place.country, latitude: w.place.latitude, longitude: w.place.longitude },
  };
}

wishlistRouter.post("/", requireAuth, validateBody(addSchema), asyncHandler(async (req, res) => {
  const { placeId, place, note } = req.body;
  let resolvedPlaceId = placeId as string | undefined;
  if (!resolvedPlaceId && place) resolvedPlaceId = await upsertPlace(place);
  if (!resolvedPlaceId) throw notFound("Could not resolve place");
  const existing = await prisma.wishlistItem.findUnique({ where: { userId_placeId: { userId: req.userId!, placeId: resolvedPlaceId } } });
  if (existing) throw conflict("Already on your wishlist");
  const item = await prisma.wishlistItem.create({ data: { userId: req.userId!, placeId: resolvedPlaceId, note: note ?? null }, include: { place: true } });
  res.status(201).json({ item: serialize(item) });
}));

wishlistRouter.get("/by/:username", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username }, select: { id: true } });
  if (!user) throw notFound("User not found");
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { place: true } });
  res.json({ items: items.map(serialize) });
}));

wishlistRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const item = await prisma.wishlistItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw notFound("Not found");
  if (item.userId !== req.userId) throw forbidden("Not yours");
  await prisma.wishlistItem.delete({ where: { id: item.id } });
  res.status(204).send();
}));
