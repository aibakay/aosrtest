import { Router, Request, Response } from "express";
import PizZip from "pizzip";
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

    const { buffer, fileName, registryBuffer, registryFileName, unresolvedBookmarks } =
      generateDocument(body);

    if (unresolvedBookmarks.length > 0) {
      res.setHeader("X-Unresolved-Bookmarks", encodeURIComponent(JSON.stringify(unresolvedBookmarks)));
    }

    if (registryBuffer && registryFileName) {
      // Bundle main document + registry into a single ZIP archive
      const outerZip = new PizZip();
      outerZip.file(fileName, buffer);
      outerZip.file(registryFileName, registryBuffer);
      const zipBuffer = outerZip.generate({ type: "nodebuffer", compression: "DEFLATE" });

      const zipName = `Пакет_документов_${Date.now()}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`);
      res.send(zipBuffer);
    } else {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      res.send(buffer);
    }
  } catch (err) {
    // Log the full error server-side; return a generic message to the client
    // so internal paths / stack details are not leaked.
    console.error("Ошибка генерации документа:", err);
    res.status(500).json({ error: "Ошибка генерации документа" });
  }
});

export default router;
