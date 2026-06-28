import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import templatesRouter from "./routes/templates";
import documentsRouter from "./routes/documents";

const app = express();

app.use(cors());

// On Vercel the platform may already parse and consume the request body.
// Mark it as parsed so express.json() skips reading the (already drained)
// stream; locally req.body is undefined and json() parses normally.
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    (req as unknown as { _body: boolean })._body = true;
  }
  next();
});
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/documents", documentsRouter);

// Only start a long-running listener when run directly (local dev).
// On Vercel the app is imported and invoked per-request as a handler.
if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
