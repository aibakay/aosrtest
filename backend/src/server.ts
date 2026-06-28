import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import templatesRouter from "./routes/templates";
import documentsRouter from "./routes/documents";
import ordersRouter from "./routes/orders";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/orders", ordersRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
