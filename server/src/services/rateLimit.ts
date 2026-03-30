import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
import { getRuntimeSettings } from "./runtimeSettings.js";

function currentUtcHour(): number {
  return Math.floor(Date.now() / 3600000);
}

export function refreshAccountWindow(account: TelegramAccountDoc): void {
  const h = currentUtcHour();
  if (account.rateWindowHour !== h) {
    account.rateWindowHour = h;
    account.addsInWindow = 0;
    account.dmsInWindow = 0;
  }
}

export async function canAdd(account: TelegramAccountDoc): Promise<boolean> {
  const cfg = await getRuntimeSettings();
  refreshAccountWindow(account);
  const cap = account.warmUpMode ? Math.min(8, cfg.maxAddsPerHour) : cfg.maxAddsPerHour;
  return account.addsInWindow < cap;
}

export async function canDm(account: TelegramAccountDoc): Promise<boolean> {
  const cfg = await getRuntimeSettings();
  refreshAccountWindow(account);
  const cap = account.warmUpMode ? Math.min(4, cfg.maxDmsPerHour) : cfg.maxDmsPerHour;
  return account.dmsInWindow < cap;
}

export function recordAdd(account: TelegramAccountDoc): void {
  refreshAccountWindow(account);
  account.addsInWindow += 1;
}

export function recordDm(account: TelegramAccountDoc): void {
  refreshAccountWindow(account);
  account.dmsInWindow += 1;
}
