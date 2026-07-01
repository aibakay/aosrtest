import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import healthRouter from "./routes/health";
import templatesRouter from "./routes/templates";
import documentsRouter from "./routes/documents";
import orderDirectivesRouter from "./routes/orderDirectives";
import registriesRouter from "./routes/registries";
import { apiKeyGate } from "./middleware/apiKey";
import { generalLimiter, generateLimiter } from "./middleware/rateLimiters";

/**
 * CORS origin allowlist. ALLOWED_ORIGINS is a comma-separated list (e.g. the
 * Vercel frontend URL). When unset, all origins are reflected — the
 * permissive default that local dev and a first deploy need with zero
 * configuration.
 */
// Response headers the frontend reads via fetch() that aren't on the browser's
// CORS-safelisted-header list (Content-Type/Length/etc.) — without this,
// res.headers.get(...) silently returns null cross-origin (i.e. in
// production, where frontend and backend are different origins; it "worked"
// in local dev only because the Vite proxy makes requests same-origin).
const EXPOSED_HEADERS = ["Content-Disposition", "X-Unresolved-Bookmarks", "X-Registry-Warnings"];

function buildCorsOptions(): cors.CorsOptions {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return { exposedHeaders: EXPOSED_HEADERS };

  const allowed = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return {
    exposedHeaders: EXPOSED_HEADERS,
    origin(origin, callback) {
      // Same-origin / non-browser requests (curl, health checks) send no Origin header.
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin не разрешён: ${origin}`));
      }
    },
  };
}

// Express app wiring lives here (separate from server.ts) so tests can
// import it with supertest without binding a real port.
export function createApp() {
  const app = express();

  // The frontend (Vercel) and backend (Railway) are on different origins by
  // design — helmet's default same-origin CORP would make browsers block
  // fetch()/blob downloads of generated documents regardless of the CORS
  // headers below, so it's relaxed to cross-origin here.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  // Silence request logs in the test env — vitest runs already print enough.
  if (process.env.NODE_ENV !== "test") {
    app.use(pinoHttp());
  }
  app.use(cors(buildCorsOptions()));
  app.use(express.json());

  // Health check first and unthrottled — platform monitors (Railway) can
  // poll it every few seconds without tripping the general rate limit.
  app.use("/api/health", healthRouter);

  app.use("/api", generalLimiter);
  app.use("/api/templates", apiKeyGate, templatesRouter);
  app.use("/api/documents/generate", generateLimiter);
  app.use("/api/documents", apiKeyGate, documentsRouter);
  app.use("/api/order-directives", apiKeyGate, orderDirectivesRouter);
  app.use("/api/registries/:id/generate", generateLimiter);
  app.use("/api/registries", apiKeyGate, registriesRouter);

  return app;
}
