import { Router, Request, Response } from "express";
import {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  resolveByDate,
} from "../services/ordersService";
import { ORDER_ROLES } from "../config/orders";

const router = Router();

// List available roles (for UI dropdowns)
router.get("/roles", (_req, res) => {
  res.json(ORDER_ROLES.map((r) => ({ key: r.key, label: r.label })));
});

// List all orders
router.get("/", (_req, res) => {
  try {
    res.json(listOrders());
  } catch (err) {
    res.status(500).json({ error: "Ошибка чтения реестра", detail: String(err) });
  }
});

// Resolve responsible persons for a completion date
router.post("/resolve", (req: Request, res: Response) => {
  const { date, roles } = req.body ?? {};
  if (!date || typeof date !== "string") {
    res.status(400).json({ error: "Не указана дата окончания работ" });
    return;
  }
  try {
    res.json(resolveByDate(date, Array.isArray(roles) ? roles : undefined));
  } catch (err) {
    res.status(500).json({ error: "Ошибка подбора ответственных лиц", detail: String(err) });
  }
});

// Create
router.post("/", (req: Request, res: Response) => {
  const { order, errors } = createOrder(req.body ?? {});
  if (errors.length) {
    res.status(400).json({ errors });
    return;
  }
  res.status(201).json(order);
});

// Update
router.put("/:id", (req: Request, res: Response) => {
  const { order, errors, notFound } = updateOrder(req.params.id, req.body ?? {});
  if (notFound) {
    res.status(404).json({ errors });
    return;
  }
  if (errors.length) {
    res.status(400).json({ errors });
    return;
  }
  res.json(order);
});

// Delete
router.delete("/:id", (req: Request, res: Response) => {
  const ok = deleteOrder(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "Документ не найден" });
    return;
  }
  res.status(204).end();
});

export default router;
