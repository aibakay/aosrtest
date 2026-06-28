import { Router, Request, Response } from "express";
import { GenerateRequest } from "../types";
import { validate } from "../services/validationService";
import { generateDocument } from "../services/generatorService";

const router = Router();

router.post("/generate", (req: Request, res: Response) => {
  try {
    const body = req.body as GenerateRequest;
    const errors = validate(body);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const { buffer, fileName } = generateDocument(body);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка генерации документа", detail: String(err) });
  }
});

export default router;
