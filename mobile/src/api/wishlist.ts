import { api } from "./client";
import type { WishlistItem, PlaceSearchResult } from "./types";

export async function getWishlist(username: string): Promise<WishlistItem[]> {
  const res = await api.get(`/wishlist/by/${username}`);
  return res.data.items;
}
export async function addToWishlist(place: PlaceSearchResult, note?: string | null): Promise<WishlistItem> {
  const res = await api.post("/wishlist", {
    place: { osmId: place.osmId, name: place.name, locality: place.locality, country: place.country, latitude: place.latitude, longitude: place.longitude },
    note: note ?? null,
  });
  return res.data.item;
}
export async function removeFromWishlist(id: string): Promise<void> {
  await api.delete(`/wishlist/${id}`);
}
