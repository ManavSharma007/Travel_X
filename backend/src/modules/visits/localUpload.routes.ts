import { Router } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import express from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { badRequest } from "../../lib/http.js";

// Receiver for the LOCAL storage adapter's "presigned" upload URL.
// In production (R2/S3) the client PUTs straight to the bucket and this route
// is never used. In dev it lets us mirror the exact same client flow locally.

export const localUploadRouter = Router();

// Accept raw binary bodies for common image types.
const rawImage = express.raw({
  type: ["image/*"],
  limit: "15mb",
});

// PUT /photos/local-upload/:key   (key is URL-encoded storageKey)
localUploadRouter.put(
  "/local-upload/:key",
  rawImage,
  asyncHandler(async (req, res) => {
    const key = decodeURIComponent(req.params.key);

    // guard against path traversal
    if (key.includes("..")) throw badRequest("Invalid key");
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw badRequest("Empty body");
    }

    const dest = join(process.cwd(), env.LOCAL_UPLOAD_DIR, key);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, req.body);

    res.status(200).json({ ok: true, key });
  })
);
