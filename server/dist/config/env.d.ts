export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    MONGODB_URI: string;
    REDIS_URL: string;
    REDIS_FAMILY?: number | undefined;
    JWT_SECRET: string;
    SESSION_ENCRYPTION_KEY: string;
    TELEGRAM_API_ID: number;
    TELEGRAM_API_HASH: string;
    WEB_ORIGIN: string;
    OPENAI_MODEL: string;
    BATCH_SIZE_MIN: number;
    BATCH_SIZE_MAX: number;
    MAX_ADDS_PER_HOUR: number;
    MAX_DMS_PER_HOUR: number;
    DM_PROBABILITY: number;
    ACTIONS_BEFORE_LONG_PAUSE_MIN: number;
    ACTIONS_BEFORE_LONG_PAUSE_MAX: number;
    CAMPAIGN_MAX_PARALLEL: number;
    OPENAI_API_KEY?: string | undefined;
};
/** Comma-separated in WEB_ORIGIN; always includes localhost + 127.0.0.1 for dev */
export declare const webOrigins: string[];
/** Merged with dashboard "extra Web origins" after settings load */
export declare function setExtraWebOrigins(origins: string[]): void;
export declare function getAllWebOrigins(): string[];
//# sourceMappingURL=env.d.ts.map