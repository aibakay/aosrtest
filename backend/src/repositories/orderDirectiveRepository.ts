import fs from "fs";
import path from "path";
import { OrderDirective } from "../types";

/**
 * Storage abstraction for order/directive records.
 *
 * The rest of the app depends only on this interface, so the JSON-backed
 * implementation below can later be swapped for a PostgreSQL/SQLite one
 * without touching the service or route layers — just provide another
 * class implementing OrderDirectiveRepository and export it from here.
 */
export interface OrderDirectiveRepository {
  getAll(): OrderDirective[];
  getById(id: string): OrderDirective | undefined;
  create(record: OrderDirective): OrderDirective;
  update(id: string, patch: Partial<OrderDirective>): OrderDirective | undefined;
  remove(id: string): boolean;
}

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "order-directives.json");

export class JsonOrderDirectiveRepository implements OrderDirectiveRepository {
  private readonly file: string;

  constructor(file: string = DATA_FILE) {
    this.file = file;
    this.ensureFile();
  }

  private ensureFile(): void {
    const dir = path.dirname(this.file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, "[]", "utf-8");
  }

  private read(): OrderDirective[] {
    try {
      const raw = fs.readFileSync(this.file, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderDirective[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: OrderDirective[]): void {
    fs.writeFileSync(this.file, JSON.stringify(records, null, 2), "utf-8");
  }

  getAll(): OrderDirective[] {
    return this.read();
  }

  getById(id: string): OrderDirective | undefined {
    return this.read().find((r) => r.id === id);
  }

  create(record: OrderDirective): OrderDirective {
    const records = this.read();
    records.push(record);
    this.write(records);
    return record;
  }

  update(id: string, patch: Partial<OrderDirective>): OrderDirective | undefined {
    const records = this.read();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...records[idx], ...patch, id };
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

// Single shared instance used across the app.
export const orderDirectiveRepository: OrderDirectiveRepository =
  new JsonOrderDirectiveRepository();
