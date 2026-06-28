import { Router, Request, Response } from "express";
import {
  listDirectives,
  getActiveOn,
  createDirective,
  updateDirective,
  deactivateDirective,
  deleteDirective,
  validateInput,
} from "../services/orderDirectiveService";

const router = Router();

// GET /api/order-directives — full list
router.get("/", (_req: Request, res: Response) => {
  try {
    res.json(listDirectives());
  } catch (err) {
    res.status(500).json({ error: "Ошибка загрузки списка", detail: String(err) });
  }
});

// GET /api/order-directives/active?date=YYYY-MM-DD — in force on the given date
router.get("/active", (req: Request, res: Response) => {
  const date = String(req.query.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Параметр date обязателен в формате YYYY-MM-DD" });
    return;
  }
  try {
    res.json(getActiveOn(date));
  } catch (err) {
    res.status(500).json({ error: "Ошибка подбора документов", detail: String(err) });
  }
});

// POST /api/order-directives — create
router.post("/", (req: Request, res: Response) => {
  const errors = validateInput(req.body ?? {});
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  try {
    res.status(201).json(createDirective(req.body));
  } catch (err) {
    res.status(500).json({ error: "Ошибка создания записи", detail: String(err) });
  }
});

// PUT /api/order-directives/:id — update
router.put("/:id", (req: Request, res: Response) => {
  const errors = validateInput(req.body ?? {});
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  try {
    const updated = updateDirective(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Запись не найдена" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Ошибка обновления записи", detail: String(err) });
  }
});

// DELETE /api/order-directives/:id — soft-delete (deactivate) by default,
// or hard-delete with ?hard=true
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const hard = String(req.query.hard ?? "") === "true";
    if (hard) {
      const ok = deleteDirective(req.params.id);
      if (!ok) {
        res.status(404).json({ error: "Запись не найдена" });
        return;
      }
      res.json({ deleted: true });
      return;
    }
    const updated = deactivateDirective(req.params.id);
    if (!updated) {
      res.status(404).json({ error: "Запись не найдена" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Ошибка удаления записи", detail: String(err) });
  }
});

export default router;
