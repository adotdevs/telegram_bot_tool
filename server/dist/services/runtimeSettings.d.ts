export type RuntimeSettings = {
    telegramApiId: number;
    telegramApiHash: string;
    openaiApiKey?: string;
    openaiModel: string;
    maxAddsPerHour: number;
    maxDmsPerHour: number;
    dmProbability: number;
    batchSizeMax: number;
    campaignMaxParallel: number;
    actionsBeforeLongPauseMin: number;
    actionsBeforeLongPauseMax: number;
};
export declare function getRuntimeSettings(): Promise<RuntimeSettings>;
export declare function invalidateRuntimeSettingsCache(): void;
export declare function refreshCorsFromSettings(): Promise<void>;
export declare function assertTelegramConfigured(s: RuntimeSettings): void;
export declare function getSettingsResponse(): Promise<{
    effective: {
        telegramApiId: number;
        telegramApiHashConfigured: boolean;
        openaiConfigured: boolean;
        openaiModel: string;
        maxAddsPerHour: number;
        maxDmsPerHour: number;
        dmProbability: number;
        batchSizeMax: number;
        campaignMaxParallel: number;
        actionsBeforeLongPauseMin: number;
        actionsBeforeLongPauseMax: number;
        extraWebOrigins: string;
    };
    fromEnvFallback: {
        telegramApiId: boolean;
        telegramApiHash: boolean;
    };
    savedInDashboard: {
        telegramApiId: boolean;
        telegramApiHash: boolean;
        openaiApiKey: boolean;
        openaiModel: boolean;
        maxAddsPerHour: boolean;
        maxDmsPerHour: boolean;
        dmProbability: boolean;
        batchSizeMax: boolean;
        campaignMaxParallel: boolean;
        actionsBeforeLongPauseMin: boolean;
        actionsBeforeLongPauseMax: boolean;
    } | null;
}>;
//# sourceMappingURL=runtimeSettings.d.ts.map