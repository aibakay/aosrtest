import fs from "fs";
import path from "path";
import { Registry } from "../types";

export interface RegistryRepository {
  getAll(): Registry[];
  getById(id: string): Registry | undefined;
  create(record: Registry): Registry;
  update(id: string, patch: Partial<Registry>): Registry | undefined;
  remove(id: string): boolean;
}

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "registries.json");

export class JsonRegistryRepository implements RegistryRepository {
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

  private read(): Registry[] {
    try {
      const raw = fs.readFileSync(this.file, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Registry[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: Registry[]): void {
    fs.writeFileSync(this.file, JSON.stringify(records, null, 2), "utf-8");
  }

  getAll(): Registry[] {
    return this.read();
  }

  getById(id: string): Registry | undefined {
    return this.read().find((r) => r.id === id);
  }

  create(record: Registry): Registry {
    const records = this.read();
    records.push(record);
    this.write(records);
    return record;
  }

  update(id: string, patch: Partial<Registry>): Registry | undefined {
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

export const registryRepository: RegistryRepository =
  new JsonRegistryRepository();
