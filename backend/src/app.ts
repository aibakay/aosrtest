import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import templatesRouter from "./routes/templates";
import documentsRouter from "./routes/documents";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/documents", documentsRouter);

  // 404 for unknown API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Не найдено" });
  });

  // Centralized error handler — catches sync throws and next(err)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Внутренняя ошибка сервера", detail: String(err) });
  });

  return app;
}
