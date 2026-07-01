import { Request, Response, NextFunction } from "express";

/**
 * Shared-secret gate for the API.
 *
 * Reads API_KEY from the environment. When it is unset (local dev by
 * default), the middleware is a no-op — nothing to configure to run
 * `npm run dev` locally. When set (e.g. on Railway), every request must
 * send the same value in the `x-api-key` header or get a 401.
 *
 * This is a shared-secret, not real per-user auth — anyone who reads the
 * frontend bundle's VITE_API_KEY can call the API directly. Its purpose is
 * to keep the publicly-deployed backend from being casually scraped/abused
 * by bots and search crawlers, not to protect against a targeted attacker.
 */
export function apiKeyGate(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_KEY;
  if (!expected) {
    next();
    return;
  }

  const provided = req.header("x-api-key");
  if (provided !== expected) {
    res.status(401).json({ error: "Неверный или отсутствующий API-ключ" });
    return;
  }

  next();
}
