import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import PizZip from "pizzip";
import { registryRepository } from "../repositories/registryRepository";
import type { Registry, ActEntry, RegistryInput, ActEntryInput } from "../types";
import { generateDocument } from "../services/generatorService";
import { createRegistryDocx } from "../services/registryDocxService";

const router = Router();

// ── Registries CRUD ──────────────────────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  const all = registryRepository.getAll().map((r) => ({
    ...r,
    items: r.items, // include items so client can show act count
  }));
  res.json(all);
});

router.get("/:id", (req: Request, res: Response) => {
  const reg = registryRepository.getById(req.params.id);
  if (!reg) return res.status(404).json({ error: "Реестр не найден" });
  res.json(reg);
});

router.post("/", (req: Request, res: Response) => {
  const body = req.body as Partial<RegistryInput>;
  if (!body.name?.trim()) {
    return res.status(400).json({ error: "Поле name обязательно" });
  }
  const record: Registry = {
    id: randomUUID(),
    name: body.name.trim(),
    objectName: body.objectName?.trim() ?? "",
    createdAt: new Date().toISOString(),
    items: [],
  };
  registryRepository.create(record);
  res.status(201).json(record);
});

router.put("/:id", (req: Request, res: Response) => {
  const body = req.body as Partial<RegistryInput>;
  const updated = registryRepository.update(req.params.id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.objectName !== undefined && { objectName: body.objectName }),
  });
  if (!updated) return res.status(404).json({ error: "Реестр не найден" });
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const ok = registryRepository.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Реестр не найден" });
  res.status(204).send();
});

// ── Acts (items) ─────────────────────────────────────────────────────────

router.post("/:id/acts", (req: Request, res: Response) => {
  const reg = registryRepository.getById(req.params.id);
  if (!reg) return res.status(404).json({ error: "Реестр не найден" });

  const body = req.body as Partial<ActEntryInput>;
  if (!body.templateCode?.trim()) {
    return res.status(400).json({ error: "Поле templateCode обязательно" });
  }

  const act: ActEntry = {
    id: randomUUID(),
    templateCode: body.templateCode.trim(),
    data: body.data ?? {},
    orderDirectives: body.orderDirectives ?? [],
    createdAt: new Date().toISOString(),
  };

  const updated = registryRepository.update(req.params.id, {
    items: [...reg.items, act],
  });
  res.status(201).json(updated);
});

router.put("/:id/acts/:actId", (req: Request, res: Response) => {
  const reg = registryRepository.getById(req.params.id);
  if (!reg) return res.status(404).json({ error: "Реестр не найден" });

  const body = req.body as Partial<ActEntryInput>;
  const idx = reg.items.findIndex((a) => a.id === req.params.actId);
  if (idx === -1) return res.status(404).json({ error: "Акт не найден" });

  const updatedAct: ActEntry = {
    ...reg.items[idx],
    ...(body.templateCode !== undefined && { templateCode: body.templateCode }),
    ...(body.data !== undefined && { data: body.data }),
    ...(body.orderDirectives !== undefined && { orderDirectives: body.orderDirectives }),
  };

  const newItems = [...reg.items];
  newItems[idx] = updatedAct;

  const updated = registryRepository.update(req.params.id, { items: newItems });
  res.json(updated);
});

// ── Batch generate: all acts + registry table → ZIP ──────────────────────

router.post("/:id/generate", (req: Request, res: Response) => {
  const reg = registryRepository.getById(req.params.id);
  if (!reg) return res.status(404).json({ error: "Реестр не найден" });
  if (reg.items.length === 0) {
    return res.status(400).json({ error: "В реестре нет актов для генерации" });
  }

  try {
    const zip = new PizZip();

    // Generate each act
    for (let i = 0; i < reg.items.length; i++) {
      const act = reg.items[i];
      const { buffer, fileName } = generateDocument({
        templateCode: act.templateCode,
        data: act.data,
        orderDirectives: act.orderDirectives ?? [],
      });
      // Prefix with index so files stay ordered and names are unique
      const safeName = `${String(i + 1).padStart(3, "0")}_${fileName}`;
      zip.file(`акты/${safeName}`, buffer);
    }

    // Generate registry summary docx
    const registryBuffer = createRegistryDocx(reg);
    const safeRegName = reg.name.replace(/[^\wЀ-ӿ\s-]/g, "_").trim() || "реестр";
    zip.file(`${safeRegName}.docx`, registryBuffer);

    const zipBuffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
    const zipName = `${safeRegName}_${new Date().toISOString().slice(0, 10)}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`);
    res.send(zipBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка генерации реестра", detail: String(err) });
  }
});

router.delete("/:id/acts/:actId", (req: Request, res: Response) => {
  const reg = registryRepository.getById(req.params.id);
  if (!reg) return res.status(404).json({ error: "Реестр не найден" });

  const newItems = reg.items.filter((a) => a.id !== req.params.actId);
  if (newItems.length === reg.items.length) {
    return res.status(404).json({ error: "Акт не найден" });
  }

  const updated = registryRepository.update(req.params.id, { items: newItems });
  res.json(updated);
});

export default router;
