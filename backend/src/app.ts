import express from "express";
import cors from "cors";
import { join } from "node:path";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { placesRouter } from "./modules/places/places.routes.js";
import { visitsRouter } from "./modules/visits/visits.routes.js";
import { localUploadRouter } from "./modules/visits/localUpload.routes.js";
import { mapRouter } from "./modules/map/map.routes.js";
import { wishlistRouter } from "./modules/wishlist/wishlist.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Serve locally-stored uploads (dev only; in prod the CDN/bucket serves these)
  if (env.STORAGE_PROVIDER === "local") {
    app.use(
      "/uploads",
      express.static(join(process.cwd(), env.LOCAL_UPLOAD_DIR))
    );
    // receiver for local "presigned" uploads
    app.use("/photos", localUploadRouter);
  }

  // Feature routes
  app.use("/auth", authRouter);
  app.use("/places", placesRouter);
  app.use("/visits", visitsRouter);
  // users + map share the /users/:username namespace
  app.use("/users", usersRouter);
  app.use("/users", mapRouter);
  app.use("/wishlist", wishlistRouter);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
