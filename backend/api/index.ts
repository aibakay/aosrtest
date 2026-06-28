// Vercel serverless entry point for the backend project (root = /backend).
// Re-exports the Express app so @vercel/node invokes it per request.
// Routes are mounted under /api inside the app; vercel.json rewrites
// /api/* to this function.
import app from "../src/server";

export default app;
