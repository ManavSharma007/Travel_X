import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { unauthorized } from "../lib/http.js";

// Attaches the authenticated user's id to the request, or rejects.
// Any route wrapped with this middleware requires a valid Bearer token.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized("Missing or malformed Authorization header"));
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
