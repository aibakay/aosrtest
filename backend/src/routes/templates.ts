import { Router } from "express";
import { loadTemplates } from "../services/templateService";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const templates = loadTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Ошибка загрузки шаблонов", detail: String(err) });
  }
});

export default router;
