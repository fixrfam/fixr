import { vi } from "vitest";
import { redisMock } from "./helpers/redis-mock";

/**
 * Unit tests never touch the network. `config/redis` connects eagerly on
 * import, so it is replaced by an in-memory stub for every unit spec.
 */
vi.mock("@/src/config/redis", () => ({ redis: redisMock }));
