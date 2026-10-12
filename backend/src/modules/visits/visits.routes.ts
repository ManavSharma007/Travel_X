import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../adapters/index.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { notFound, forbidden, badRequest } from "../../lib/http.js";
import { upsertPlace } from "../places/place.service.js";

export const visitsRouter = Router();

// A visit can reference an existing place by id, OR provide a new place
// (typically chosen from /places/search) which we upsert.
const placeInput = z.object({
  osmId: z.string().nullable().optional(),
  name: z.string().min(1),
  locality: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

const createVisitSchema = z
  .object({
    placeId: z.string().uuid().optional(),
    place: placeInput.optional(),
    note: z.string().max(2000).nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    visitedFrom: z.coerce.date().nullable().optional(),
    visitedTo: z.coerce.date().nullable().optional(),
  })
  .refine((d) => d.placeId || d.place, {
    message: "Provide either placeId or place",
  });

function serializeVisit(v: any) {
  return {
    id: v.id,
    note: v.note,
    rating: v.rating,
    visitedFrom: v.visitedFrom,
    visitedTo: v.visitedTo,
    createdAt: v.createdAt,
    place: v.place
      ? {
          id: v.place.id,
          name: v.place.name,
          locality: v.place.locality,
          country: v.place.country,
          latitude: v.place.latitude,
          longitude: v.place.longitude,
        }
      : undefined,
    photos: (v.photos ?? []).map((p: any) => ({
      id: p.id,
      url: storage.getPublicUrl(p.storageKey),
      width: p.width,
      height: p.height,
      position: p.position,
    })),
  };
}

// POST /visits — log a visited place
visitsRouter.post(
  "/",
  requireAuth,
  validateBody(createVisitSchema),
  asyncHandler(async (req, res) => {
    const { placeId, place, note, rating, visitedFrom, visitedTo } = req.body;

    let resolvedPlaceId = placeId as string | undefined;
    if (!resolvedPlaceId && place) {
      resolvedPlaceId = await upsertPlace(place);
    }
    if (!resolvedPlaceId) throw badRequest("Could not resolve place");

    const visit = await prisma.visit.create({
      data: {
        userId: req.userId!,
        placeId: resolvedPlaceId,
        note: note ?? null,
        rating: rating ?? null,
        visitedFrom: visitedFrom ?? null,
        visitedTo: visitedTo ?? null,
      },
      include: { place: true, photos: true },
    });

    res.status(201).json({ visit: serializeVisit(visit) });
  })
);

// GET /visits/:id — single visit
visitsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: { place: true, photos: { orderBy: { position: "asc" } } },
    });
    if (!visit) throw notFound("Visit not found");
    res.json({ visit: serializeVisit(visit) });
  })
);

// DELETE /visits/:id — owner only
visitsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!visit) throw notFound("Visit not found");
    if (visit.userId !== req.userId) throw forbidden("Not your visit");

    // best-effort cleanup of stored files
    await Promise.all(
      visit.photos.map((p) => storage.deleteObject(p.storageKey))
    );
    await prisma.visit.delete({ where: { id: visit.id } });
    res.status(204).send();
  })
);

// PATCH /visits/:id — edit note / rating (owner only)
const updateVisitSchema = z.object({
  note: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

visitsRouter.patch(
  "/:id",
  requireAuth,
  validateBody(updateVisitSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Visit not found");
    if (existing.userId !== req.userId) throw forbidden("Not your visit");
    const visit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        note: req.body.note !== undefined ? req.body.note : existing.note,
        rating: req.body.rating !== undefined ? req.body.rating : existing.rating,
      },
      include: { place: true, photos: { orderBy: { position: "asc" } } },
    });
    res.json({ visit: serializeVisit(visit) });
  })
);

// ── Photo upload flow ──

const presignSchema = z.object({
  visitId: z.string().uuid(),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ]),
});

// POST /visits/photos/presign — get an upload URL (provider-agnostic)
visitsRouter.post(
  "/photos/presign",
  requireAuth,
  validateBody(presignSchema),
  asyncHandler(async (req, res) => {
    const { visitId, contentType } = req.body;
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw notFound("Visit not found");
    if (visit.userId !== req.userId) throw forbidden("Not your visit");

    const presigned = await storage.createUploadUrl({
      keyPrefix: `visits/${visitId}`,
      contentType,
    });
    res.json(presigned);
  })
);

const attachSchema = z.object({
  storageKey: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  position: z.number().int().min(0).optional(),
});

// POST /visits/:id/photos — record an uploaded photo against a visit
visitsRouter.post(
  "/:id/photos",
  requireAuth,
  validateBody(attachSchema),
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!visit) throw notFound("Visit not found");
    if (visit.userId !== req.userId) throw forbidden("Not your visit");

    const photo = await prisma.visitPhoto.create({
      data: {
        visitId: visit.id,
        storageKey: req.body.storageKey,
        width: req.body.width ?? null,
        height: req.body.height ?? null,
        position: req.body.position ?? 0,
      },
    });
    res.status(201).json({
      photo: {
        id: photo.id,
        url: storage.getPublicUrl(photo.storageKey),
        width: photo.width,
        height: photo.height,
        position: photo.position,
      },
    });
  })
);
