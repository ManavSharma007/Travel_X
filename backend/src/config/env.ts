import "dotenv/config";
import { z } from "zod";

// Single source of truth for all configuration.
// Everything the app needs from the environment is validated here once,
// at startup, so a misconfigured deploy fails immediately and clearly
// instead of crashing deep inside a request handler later.

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  STORAGE_PROVIDER: z.enum(["local", "r2", "s3"]).default("local"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:4000"),
  LOCAL_UPLOAD_DIR: z.string().default("uploads"),

  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("auto"),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  S3_PUBLIC_URL: z.string().optional().default(""),

  NOMINATIM_URL: z.string().default("https://nominatim.openstreetmap.org"),
  NOMINATIM_USER_AGENT: z.string().default("TravelX/0.1 (dev)"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
