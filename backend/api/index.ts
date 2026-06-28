// Serverless entry point for Vercel (@vercel/node).
// Exports the Express app as the request handler (no app.listen()).
import { createApp } from "../src/app";

export default createApp();
