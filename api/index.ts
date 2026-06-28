// Vercel serverless entry point.
// Re-exports the Express app so @vercel/node invokes it per request.
// All routes are mounted under /api inside the app, and vercel.json
// rewrites /api/* to this function.
import app from "../backend/src/server";

export default app;
