import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/http.js";
import { isProd } from "../config/env.js";

// Central error handler. Every thrown/next(err) lands here and becomes a
// consistent JSON shape: { error: "..." }. Known HttpErrors keep their status;
// anything unexpected becomes a 500 (details hidden in production).

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: isProd ? "Internal server error" : String(err),
  });
}

// 404 for anything that didn't match a route.
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}
