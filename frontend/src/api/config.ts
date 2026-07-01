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

// Shared-secret sent to the backend when it enforces one (API_KEY env var —
// see backend/src/middleware/apiKey.ts). Unset in local dev, where the
// backend has no API_KEY configured and accepts requests without it.
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

/**
 * fetch() wrapper that attaches the API key header when configured. All API
 * calls should go through this instead of calling fetch() directly.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (API_KEY) headers.set("x-api-key", API_KEY);
  return fetch(input, { ...init, headers });
}
