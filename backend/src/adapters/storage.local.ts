import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import type { StorageAdapter, PresignedUpload } from "./storage.js";

// LOCAL disk implementation (development).
//
// There is no real "presigning" on local disk, so we return an upload URL
// that points back at our OWN server (POST /photos/local-upload/:key). The
// route in modules/visits handles receiving the bytes and writing them to
// ./uploads. This keeps the SAME client-side upload flow that R2/S3 use,
// so the mobile app code doesn't change when we switch providers.

export class LocalStorage implements StorageAdapter {
  async createUploadUrl(params: {
    keyPrefix: string;
    contentType: string;
  }): Promise<PresignedUpload> {
    const ext = extFromContentType(params.contentType);
    const storageKey = `${params.keyPrefix}/${randomUUID()}${ext}`;
    const encoded = encodeURIComponent(storageKey);
    return {
      uploadUrl: `${env.PUBLIC_BASE_URL}/photos/local-upload/${encoded}`,
      storageKey,
      method: "PUT",
      headers: { "Content-Type": params.contentType },
    };
  }

  getPublicUrl(storageKey: string): string {
    return `${env.PUBLIC_BASE_URL}/uploads/${storageKey}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    const { unlink } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const path = join(process.cwd(), env.LOCAL_UPLOAD_DIR, storageKey);
    await unlink(path).catch(() => {
      /* already gone — ignore */
    });
  }
}

function extFromContentType(ct: string): string {
  if (ct.includes("jpeg")) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("heic")) return ".heic";
  return "";
}
