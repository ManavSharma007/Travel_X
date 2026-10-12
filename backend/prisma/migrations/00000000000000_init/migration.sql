-- Travel_X initial migration (hand-authored to include PostGIS)

-- 1. Enable PostGIS (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tables
CREATE TABLE "users" (
  "id"            TEXT PRIMARY KEY,
  "email"         TEXT NOT NULL,
  "username"      TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "display_name"  TEXT,
  "bio"           TEXT,
  "avatar_url"    TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "places" (
  "id"         TEXT PRIMARY KEY,
  "osm_id"     TEXT,
  "name"       TEXT NOT NULL,
  "locality"   TEXT,
  "country"    TEXT,
  "latitude"   DOUBLE PRECISION NOT NULL,
  "longitude"  DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "places_osm_id_key" ON "places"("osm_id");

CREATE TABLE "visits" (
  "id"           TEXT PRIMARY KEY,
  "user_id"      TEXT NOT NULL,
  "place_id"     TEXT NOT NULL,
  "note"         TEXT,
  "rating"       INTEGER,
  "visited_from" DATE,
  "visited_to"   DATE,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visits_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "visits_place_id_fkey" FOREIGN KEY ("place_id")
    REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "visits_user_id_created_at_idx" ON "visits"("user_id", "created_at");

CREATE TABLE "visit_photos" (
  "id"          TEXT PRIMARY KEY,
  "visit_id"    TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "width"       INTEGER,
  "height"      INTEGER,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visit_photos_visit_id_fkey" FOREIGN KEY ("visit_id")
    REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "visit_photos_visit_id_idx" ON "visit_photos"("visit_id");

-- 3. PostGIS geography column + spatial index (not managed by Prisma)
ALTER TABLE "places" ADD COLUMN "geom" geometry(Point, 4326);
CREATE INDEX "places_geom_gix" ON "places" USING GIST ("geom");
