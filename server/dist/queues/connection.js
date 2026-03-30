import { createRequire } from "node:module";
import { env } from "../config/env.js";
const require = createRequire(import.meta.url);
const Redis = require("ioredis");
const url = env.REDIS_URL.trim();
const useTls = url.startsWith("rediss:");
/**
 * BullMQ requires maxRetriesPerRequest: null.
 * Cloud Redis (Upstash, etc.) often resets idle TCP sockets; enableReadyCheck: false + retryStrategy
 * avoids spurious ECONNRESET noise and reconnects cleanly. family: 4 matches mongo.ts (Windows/IPv6).
 */
export function createRedis() {
    const client = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectTimeout: 20_000,
        family: 4,
        retryStrategy: (retries) => {
            if (retries > 30)
                return null;
            return Math.min(retries * 150, 5_000);
        },
        reconnectOnError: (err) => {
            const t = err.message || "";
            return t.includes("READONLY") || t.includes("ECONNRESET") || t.includes("ETIMEDOUT");
        },
        ...(useTls ? { tls: {} } : {}),
    });
    client.on("error", (err) => {
        console.error("[redis]", err.message);
    });
    return client;
}
export const connection = createRedis();
//# sourceMappingURL=connection.js.map