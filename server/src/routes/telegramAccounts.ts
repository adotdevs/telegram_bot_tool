import { Router } from "express";
import { z } from "zod";
import { TelegramAccount } from "../models/TelegramAccount.js";
import {
  createClientForOtpVerify,
  createEmptyClient,
  sendLoginCode,
  completeLoginWithOtp,
} from "../telegram/gramClient.js";
import { encryptSession } from "../crypto/sessionCrypto.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logAction } from "../services/logger.js";

const r = Router();

const sendCodeBody = z.object({
  phone: z.string().min(8),
  proxyUrl: z.string().optional(),
});

r.post("/send-code", requireAuth, async (req: AuthedRequest, res) => {
  const body = sendCodeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const client = await createEmptyClient({ proxyUrl: body.data.proxyUrl });
  try {
    const out = await sendLoginCode(client, body.data.phone);
    const loginSession = String(client.session.save() ?? "");
    if (!loginSession.trim()) {
      res.status(500).json({ error: "Telegram did not return a pending session; try Send code again." });
      return;
    }
    res.json({
      phoneCodeHash: out.phoneCodeHash,
      phone: out.phone,
      isCodeViaApp: out.isCodeViaApp,
      /** Pass back to /verify with the same phone + hash (paired MTProto session). */
      loginSession,
      requestedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  } finally {
    await client.disconnect();
  }
});

const verifyBody = z.object({
  phone: z.string(),
  phoneCode: z.string(),
  phoneCodeHash: z.string(),
  /** From send-code response; required for reliable SignIn (same MTProto session as sendCode). */
  loginSession: z.string().min(1),
  password: z.string().optional(),
  label: z.string().optional(),
  proxyUrl: z.string().optional(),
});

r.post("/verify", requireAuth, async (req: AuthedRequest, res) => {
  const body = verifyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const client = await createClientForOtpVerify(body.data.loginSession, { proxyUrl: body.data.proxyUrl });
  try {
    const result = await completeLoginWithOtp(
      client,
      body.data.phone,
      body.data.phoneCode,
      body.data.phoneCodeHash,
      body.data.password
    );
    if (!result.ok) {
      if ("needsPassword" in result && result.needsPassword) {
        res.status(403).json({ needsPassword: true });
        return;
      }
      res.status(400).json({ error: "error" in result ? result.error : "Login failed" });
      return;
    }
    const sessionEncrypted = encryptSession(result.sessionString);
    const acc = await TelegramAccount.create({
      phoneNumber: body.data.phone,
      sessionEncrypted,
      label: body.data.label,
      proxyUrl: body.data.proxyUrl,
      status: "active",
    });
    await logAction({ action: "login", message: `Telegram account linked ${acc.phoneNumber}` });
    res.json({
      id: acc._id.toString(),
      phoneNumber: acc.phoneNumber,
      label: acc.label,
      status: acc.status,
      warmUpMode: acc.warmUpMode,
    });
  } finally {
    await client.disconnect();
  }
});

r.get("/", requireAuth, async (_req: AuthedRequest, res) => {
  const list = await TelegramAccount.find().select("-sessionEncrypted").lean();
  res.json(list);
});

r.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const patch = z
    .object({
      warmUpMode: z.boolean().optional(),
      proxyUrl: z.string().nullable().optional(),
      status: z.enum(["active", "paused", "disabled"]).optional(),
    })
    .safeParse(req.body);
  if (!patch.success) {
    res.status(400).json({ error: patch.error.flatten() });
    return;
  }
  const acc = await TelegramAccount.findByIdAndUpdate(req.params.id, patch.data, { new: true }).select(
    "-sessionEncrypted"
  );
  if (!acc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(acc);
});

r.delete("/:id", requireAuth, async (req, res) => {
  await TelegramAccount.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default r;
