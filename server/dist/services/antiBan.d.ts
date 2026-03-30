/** Human-like timing and lightweight "session activity" helpers */
export declare function randomBetween(minMs: number, maxMs: number): number;
/** Default 5–25s between actions */
export declare function nextActionDelayMs(): number;
/** Long pause 5–15 minutes after burst */
export declare function longPauseMs(): number;
export declare function actionsBeforeLongPause(min: number, max: number): number;
/** Typing delay proportional to message length */
export declare function typingDelayMsForText(text: string): number;
export declare function sleep(ms: number): Promise<void>;
/** Optional: toggle offline before sensitive burst (GramJS client.setOffline) */
export declare function simulatePresenceToggle(setOffline: () => Promise<void>, setOnline: () => Promise<void>): Promise<void>;
//# sourceMappingURL=antiBan.d.ts.map