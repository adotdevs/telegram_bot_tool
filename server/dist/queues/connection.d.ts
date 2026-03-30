/**
 * BullMQ requires maxRetriesPerRequest: null.
 * Cloud Redis (Upstash, etc.) often resets idle TCP sockets; enableReadyCheck: false + retryStrategy
 * avoids spurious ECONNRESET noise and reconnects cleanly. family: 4 matches mongo.ts (Windows/IPv6).
 */
export declare function createRedis(): any;
export declare const connection: any;
//# sourceMappingURL=connection.d.ts.map