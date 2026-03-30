/** Human-like timing and lightweight "session activity" helpers */
export function randomBetween(minMs, maxMs) {
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}
/** Default 5–25s between actions */
export function nextActionDelayMs() {
    return randomBetween(5000, 25000);
}
/** Long pause 5–15 minutes after burst */
export function longPauseMs() {
    return randomBetween(5 * 60 * 1000, 15 * 60 * 1000);
}
export function actionsBeforeLongPause(min, max) {
    return randomBetween(min, max);
}
/** Typing delay proportional to message length */
export function typingDelayMsForText(text) {
    const base = randomBetween(800, 2200);
    const perChar = randomBetween(35, 90);
    return Math.min(base + text.length * perChar, 25_000);
}
export async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
}
/** Optional: toggle offline before sensitive burst (GramJS client.setOffline) */
export async function simulatePresenceToggle(setOffline, setOnline) {
    if (Math.random() < 0.35) {
        await setOffline();
        await sleep(randomBetween(2000, 8000));
    }
    if (Math.random() < 0.5) {
        await setOnline();
    }
}
//# sourceMappingURL=antiBan.js.map