import rateLimit from "express-rate-limit";

/** Generous baseline for all API traffic — mainly a guard against runaway loops/bots. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Document generation is the expensive path (reads a template, rewrites XML,
 * zips it back up) — batch registry generation loops this per act. Tighter
 * limit than the general one.
 */
export const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов на генерацию. Попробуйте позже." },
});
