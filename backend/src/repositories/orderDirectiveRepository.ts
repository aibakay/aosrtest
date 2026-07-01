import path from "path";
import { OrderDirective } from "../types";
import { JsonFileStore } from "./jsonFileStore";

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

const DATA_FILE = path.join(__dirname, "../../data/order-directives.json");

/**
 * Backed by an atomic (crash-safe) JSON file — see JsonFileStore for the
 * write/concurrency guarantees.
 */
export class JsonOrderDirectiveRepository
  extends JsonFileStore<OrderDirective>
  implements OrderDirectiveRepository
{
  constructor(file: string = DATA_FILE) {
    super(file);
  }
}

// Single shared instance used across the app.
export const orderDirectiveRepository: OrderDirectiveRepository =
  new JsonOrderDirectiveRepository();
