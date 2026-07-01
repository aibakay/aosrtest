import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Generic JSON-array-backed store with crash-safe atomic writes.
 *
 * Atomicity: every write goes to a temp file in the same directory, then
 * `fs.renameSync`s it into place. Rename within the same filesystem is
 * atomic at the OS level, so a crash mid-write can never leave the data
 * file truncated or half-written — readers always see either the previous
 * complete content or the new one, never a corrupt mix.
 *
 * Concurrency: every read-modify-write cycle in this app runs inside a
 * fully synchronous Express route handler (no `await` between the read and
 * the write). Node.js runs JS on a single thread and only yields to the
 * event loop at an `await`/callback boundary, so two requests can never
 * interleave mid-cycle within one process — no in-process lock is needed
 * for that scenario today.
 *
 * This does NOT protect against multiple concurrent backend instances
 * (e.g. horizontally scaled Railway replicas) writing to the same file —
 * this store assumes a single backend process owns the data directory.
 * If a handler here ever becomes genuinely async (an `await` inserted
 * between read and write) or the app is scaled to multiple instances,
 * replace this with a real database rather than adding ad-hoc locking.
 */
export class JsonFileStore<T extends { id: string }> {
  private readonly file: string;

  constructor(file: string) {
    this.file = file;
    this.ensureFile();
  }

  private ensureFile(): void {
    const dir = path.dirname(this.file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, "[]", "utf-8");
  }

  private read(): T[] {
    try {
      const raw = fs.readFileSync(this.file, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: T[]): void {
    const dir = path.dirname(this.file);
    const tmpFile = path.join(
      dir,
      `.${path.basename(this.file)}.${process.pid}-${crypto.randomBytes(4).toString("hex")}.tmp`
    );
    // Write the full content to a scratch file first, then atomically swap
    // it into place — never truncate/overwrite the real file in place.
    fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), "utf-8");
    fs.renameSync(tmpFile, this.file);
  }

  getAll(): T[] {
    return this.read();
  }

  getById(id: string): T | undefined {
    return this.read().find((r) => r.id === id);
  }

  create(record: T): T {
    const records = this.read();
    records.push(record);
    this.write(records);
    return record;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const records = this.read();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...records[idx], ...patch, id } as T;
    records[idx] = updated;
    this.write(records);
    return updated;
  }

  remove(id: string): boolean {
    const records = this.read();
    const next = records.filter((r) => r.id !== id);
    if (next.length === records.length) return false;
    this.write(next);
    return true;
  }
}
