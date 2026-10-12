CREATE TABLE "wishlist_items" (
  "id"         TEXT PRIMARY KEY,
  "user_id"    TEXT NOT NULL,
  "place_id"   TEXT NOT NULL,
  "note"       TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "wishlist_items_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "wishlist_items_user_id_place_id_key" ON "wishlist_items"("user_id", "place_id");
CREATE INDEX "wishlist_items_user_id_created_at_idx" ON "wishlist_items"("user_id", "created_at");
