import { getRuntimeSettings } from "./runtimeSettings.js";
function currentUtcHour() {
    return Math.floor(Date.now() / 3600000);
}
export function refreshAccountWindow(account) {
    const h = currentUtcHour();
    if (account.rateWindowHour !== h) {
        account.rateWindowHour = h;
        account.addsInWindow = 0;
        account.dmsInWindow = 0;
    }
}
export async function canAdd(account) {
    const cfg = await getRuntimeSettings();
    refreshAccountWindow(account);
    const cap = account.warmUpMode ? Math.min(8, cfg.maxAddsPerHour) : cfg.maxAddsPerHour;
    return account.addsInWindow < cap;
}
export async function canDm(account) {
    const cfg = await getRuntimeSettings();
    refreshAccountWindow(account);
    const cap = account.warmUpMode ? Math.min(4, cfg.maxDmsPerHour) : cfg.maxDmsPerHour;
    return account.dmsInWindow < cap;
}
export function recordAdd(account) {
    refreshAccountWindow(account);
    account.addsInWindow += 1;
}
export function recordDm(account) {
    refreshAccountWindow(account);
    account.dmsInWindow += 1;
}
//# sourceMappingURL=rateLimit.js.map