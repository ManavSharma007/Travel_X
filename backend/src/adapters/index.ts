import { env } from "../config/env.js";
import type { StorageAdapter } from "./storage.js";
import { LocalStorage } from "./storage.local.js";
import { S3Storage } from "./storage.s3.js";

// The ONE place a storage vendor is chosen. Everything else imports `storage`
// and never knows or cares which provider is behind it.

function makeStorage(): StorageAdapter {
  switch (env.STORAGE_PROVIDER) {
    case "s3":
    case "r2":
      return new S3Storage();
    case "local":
    default:
      return new LocalStorage();
  }
}

export const storage = makeStorage();
