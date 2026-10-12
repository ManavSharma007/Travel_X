import { Router } from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { badRequest } from "../../lib/http.js";

export const placesRouter = Router();

// GET /places/search?q=kyoto
// Proxies OpenStreetMap Nominatim (free, no API key). We proxy rather than
// call it from the app directly so that (a) the User-Agent policy is honored
// in one place, and (b) we can later swap the provider without touching the
// mobile app. We normalise the response to a small, stable shape.

interface NominatimResult {
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

placesRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) throw badRequest("Query 'q' must be at least 2 characters");

    const url = new URL("/search", env.NOMINATIM_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");

    const resp = await fetch(url, {
      headers: { "User-Agent": env.NOMINATIM_USER_AGENT },
    });
    if (!resp.ok) throw badRequest("Place search is temporarily unavailable");

    const raw = (await resp.json()) as NominatimResult[];
    const results = raw.map((r) => {
      const addr = r.address ?? {};
      const locality =
        addr.city || addr.town || addr.village || addr.county || null;
      return {
        osmId: r.osm_type && r.osm_id ? `${r.osm_type}/${r.osm_id}` : null,
        name: r.name || r.display_name?.split(",")[0] || "Unknown",
        displayName: r.display_name ?? null,
        locality,
        country: addr.country ?? null,
        latitude: r.lat ? Number(r.lat) : null,
        longitude: r.lon ? Number(r.lon) : null,
      };
    });

    res.json({ results });
  })
);
