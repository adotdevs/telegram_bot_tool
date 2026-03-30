import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
export declare function refreshAccountWindow(account: TelegramAccountDoc): void;
export declare function canAdd(account: TelegramAccountDoc): Promise<boolean>;
export declare function canDm(account: TelegramAccountDoc): Promise<boolean>;
export declare function recordAdd(account: TelegramAccountDoc): void;
export declare function recordDm(account: TelegramAccountDoc): void;
//# sourceMappingURL=rateLimit.d.ts.map