import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { badRequest } from "../lib/http.js";

// Validates req.body against a Zod schema. On success, replaces req.body with
// the parsed (typed, trimmed, defaulted) data. On failure, returns 400 with
// a readable list of what's wrong — no handler ever sees bad input.

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      return next(badRequest(issues));
    }
    req.body = result.data;
    next();
  };
}
