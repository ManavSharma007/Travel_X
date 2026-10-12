import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { notFound } from "../../lib/http.js";
import { storage } from "../../adapters/index.js";

export const usersRouter = Router();

// GET /users/:username — public profile + visit count
usersRouter.get(
  "/:username",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { visits: true } },
      },
    });
    if (!user) throw notFound("User not found");
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        visitCount: user._count.visits,
      },
    });
  })
);

const updateSchema = z.object({
  displayName: z.string().max(80).nullable().optional(),
  bio: z.string().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// PATCH /users/me — update own profile
usersRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: req.body,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });
    res.json({ user });
  })
);

// ── Diary: a user's visits, paginated (cursor = createdAt of last item) ──

usersRouter.get(
  "/:username/visits",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: { id: true },
    });
    if (!user) throw notFound("User not found");

    const take = Math.min(Number(req.query.limit ?? 20), 50);
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;

    const visits = await prisma.visit.findMany({
      where: {
        userId: user.id,
        ...(cursor ? { createdAt: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      include: { place: true, photos: { orderBy: { position: "asc" }, take: 1 } },
    });

    const hasMore = visits.length > take;
    const page = hasMore ? visits.slice(0, take) : visits;

    res.json({
      visits: page.map((v) => ({
        id: v.id,
        note: v.note,
        rating: v.rating,
        visitedFrom: v.visitedFrom,
        visitedTo: v.visitedTo,
        createdAt: v.createdAt,
        place: {
          id: v.place.id,
          name: v.place.name,
          locality: v.place.locality,
          country: v.place.country,
          latitude: v.place.latitude,
          longitude: v.place.longitude,
        },
        coverPhoto: v.photos[0]
          ? storage.getPublicUrl(v.photos[0].storageKey)
          : null,
      })),
      nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
    });
  })
);
