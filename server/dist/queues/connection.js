import { createRequire } from "node:module";
import { env } from "../config/env.js";
const require = createRequire(import.meta.url);
const Redis = require("ioredis");
// Strip accidental surrounding quotes or trailing slashes
let url = env.REDIS_URL.trim().replace(/^["']|["']$/g, "");
if (url.startsWith("https://") || url.startsWith("http://")) {
    console.error(`[redis] ERROR: REDIS_URL is configured with HTTP(S) protocol: "${url.slice(0, 15)}...". BullMQ requires Redis TCP protocol. Please use the connection string starting with "rediss://" from the Upstash console.`);
}
const useTls = url.startsWith("rediss:");
/**
 * BullMQ requires maxRetriesPerRequest: null.
 * Cloud Redis (Upstash, etc.) often resets idle TCP sockets; enableReadyCheck: false + retryStrategy
 * avoids spurious ECONNRESET noise and reconnects cleanly.
 *
 * For DNS resolution:
 * Only force family: 4 for local connections (127.0.0.1 / localhost on Windows).
 * For cloud hosts (Upstash, AWS, etc.), allow Node.js to use default dual-stack DNS resolution,
 * unless REDIS_FAMILY is explicitly specified via environment variable.
 */
export function createRedis() {
    const family = env.REDIS_FAMILY
        ? env.REDIS_FAMILY
        : (url.includes("127.0.0.1") || url.includes("localhost") ? 4 : undefined);
    const client = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectTimeout: 20_000,
        ...(family ? { family } : {}),
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
        console.error("[redis]", err.message || err);
        if (err?.code === "ENOTFOUND") {
            console.error(`[redis] DNS lookup failed for Redis host.\n` +
                `  -> If using Upstash:\n` +
                `     1. Check https://console.upstash.com to ensure the database is active and not deleted/paused.\n` +
                `     2. If you recreated the database, copy the NEW connection string from Upstash Console.\n` +
                `     3. Ensure the connection string begins with 'rediss://' (ioredis/TCP), not 'https://' (REST API).`);
        }
    });
    return client;
}
export const connection = createRedis();
//# sourceMappingURL=connection.js.map