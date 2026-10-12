// @ts-nocheck
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import type { StorageAdapter, PresignedUpload } from "./storage.js";

// S3 / R2 implementation (production).
//
// Cloudflare R2 is S3-compatible, so ONE implementation covers both — the
// only difference is the endpoint/credentials, which come from env. This is
// deliberately lazy-loaded: the @aws-sdk packages are only imported if you
// actually select this provider, so local dev doesn't need them installed.
//
// To use: set STORAGE_PROVIDER=r2 (or s3) and fill the S3_* vars, then
//   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

export class S3Storage implements StorageAdapter {
  private clientPromise: Promise<any> | null = null;

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import("@aws-sdk/client-s3");
        return new S3Client({
          region: env.S3_REGION,
          endpoint: env.S3_ENDPOINT || undefined,
          credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          },
        });
      })();
    }
    return this.clientPromise;
  }

  async createUploadUrl(params: {
    keyPrefix: string;
    contentType: string;
  }): Promise<PresignedUpload> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const ext = extFromContentType(params.contentType);
    const storageKey = `${params.keyPrefix}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(await this.client(), command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      uploadUrl,
      storageKey,
      method: "PUT",
      headers: { "Content-Type": params.contentType },
    };
  }

  getPublicUrl(storageKey: string): string {
    const base = env.S3_PUBLIC_URL.replace(/\/$/, "");
    return `${base}/${storageKey}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey })
    );
  }
}

function extFromContentType(ct: string): string {
  if (ct.includes("jpeg")) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("heic")) return ".heic";
  return "";
}
