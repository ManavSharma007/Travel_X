import type { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps an async route handler so any thrown error (including rejected
// promises) is forwarded to the central error handler instead of crashing.

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
