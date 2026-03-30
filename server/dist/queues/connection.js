import { createRequire } from "node:module";
import { env } from "../config/env.js";
const require = createRequire(import.meta.url);
const Redis = require("ioredis");
const url = env.REDIS_URL;
export function createRedis() {
    return new Redis(url, { maxRetriesPerRequest: null });
}
export const connection = createRedis();
//# sourceMappingURL=connection.js.map