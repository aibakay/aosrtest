import path from "path";
import { Registry } from "../types";
import { JsonFileStore } from "./jsonFileStore";

export interface RegistryRepository {
  getAll(): Registry[];
  getById(id: string): Registry | undefined;
  create(record: Registry): Registry;
  update(id: string, patch: Partial<Registry>): Registry | undefined;
  remove(id: string): boolean;
}

const DATA_FILE = path.join(__dirname, "../../data/registries.json");

/**
 * Storage abstraction for act-registry records, backed by an atomic
 * (crash-safe) JSON file — see JsonFileStore for the write/concurrency
 * guarantees. Swappable for a SQL-backed implementation of the same
 * interface without touching routes/services.
 */
export class JsonRegistryRepository
  extends JsonFileStore<Registry>
  implements RegistryRepository
{
  constructor(file: string = DATA_FILE) {
    super(file);
  }
}

export const registryRepository: RegistryRepository =
  new JsonRegistryRepository();
