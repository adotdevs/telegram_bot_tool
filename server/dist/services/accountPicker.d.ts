import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
/** Pick an account that can perform `kind`, least recently used first */
export declare function pickAccount(kind: "add" | "dm"): Promise<TelegramAccountDoc | null>;
export declare function markFloodWait(accountId: unknown, seconds: number): Promise<void>;
export declare function markPeerFloodRisky(accountId: unknown): Promise<void>;
export declare function clearFloodWaitIfExpired(account: TelegramAccountDoc): Promise<void>;
//# sourceMappingURL=accountPicker.d.ts.map