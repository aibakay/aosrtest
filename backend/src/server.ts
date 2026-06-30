import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import templatesRouter from "./routes/templates";
import documentsRouter from "./routes/documents";
import orderDirectivesRouter from "./routes/orderDirectives";
import registriesRouter from "./routes/registries";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/order-directives", orderDirectivesRouter);
app.use("/api/registries", registriesRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
