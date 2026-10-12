// Storage adapter interface — the portability seam.
//
// The rest of the app depends ONLY on this interface, never on a specific
// vendor. Switching from local disk (dev) to Cloudflare R2 or AWS S3 (prod)
// is a change of STORAGE_PROVIDER in .env — no feature code changes.

export interface PresignedUpload {
  // Where the client PUTs the raw bytes.
  uploadUrl: string;
  // The key we store in the DB to identify the object later.
  storageKey: string;
  // How the client should send it (some providers require a method/headers).
  method: "PUT" | "POST";
  headers?: Record<string, string>;
}

export interface StorageAdapter {
  // Create a URL the client can upload directly to (keeps big files off our server).
  createUploadUrl(params: {
    keyPrefix: string;
    contentType: string;
  }): Promise<PresignedUpload>;

  // Public URL to read an object back (for <Image> in the app).
  getPublicUrl(storageKey: string): string;

  // Remove an object (when a photo/visit is deleted).
  deleteObject(storageKey: string): Promise<void>;
}
