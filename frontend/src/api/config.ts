// Single source of truth for the backend API base URL.
//
// Reads VITE_API_URL, which is set per-environment:
//   - production: frontend/.env.production (committed) or the hosting platform
//   - local dev:  falls back to "/api", which the Vite dev server proxies to
//     http://localhost:3001 (see vite.config.ts).
//
// The base URL is intentionally NOT hardcoded here so the backend can move
// without a code change.
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
