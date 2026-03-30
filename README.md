# Telegram Growth Console

Production-oriented **monorepo** for human-paced Telegram outreach: scrape or import users, queue invites and DMs through **BullMQ**, persist state in **MongoDB**, and drive **GramJS** (MTProto) from **Node.js + TypeScript**. The **Next.js** dashboard handles campaigns, multi-account OTP linking, CSV merge, logs, and blacklist management.

> **Legal & policy:** Mass inviting and messaging may violate Telegram’s Terms of Service and local law. This project is intended for legitimate operator-owned accounts and explicit opt-in audiences. You are responsible for compliance, consent, and data protection.

## Architecture

| Component | Role |
|-----------|------|
| `server` | Express API, Mongoose models, queue producers |
| `server` worker entry | BullMQ consumers (`scrape_users`, `add_user`, `send_message`, `campaign_tick`) |
| `web` | Next.js 15 + Tailwind 4 UI |
| Redis | BullMQ backing store |
| MongoDB | Campaigns, users, accounts, logs, blacklist |

**Anti-ban measures** (defaults in `.env`, overridable in **Settings** in the dashboard — stored in MongoDB):

- Per-account hourly caps for adds and DMs (`MAX_ADDS_PER_HOUR`, `MAX_DMS_PER_HOUR`)
- Random inter-action delay (5–25s) and long pauses after bursts
- Optional **warm-up** mode per account (lower caps)
- `CAMPAIGN_MAX_PARALLEL` limits how many users are claimed per orchestration tick (default `2`; set `1` for maximum caution)
- Message synonym / structure variation + optional OpenAI rewrite (`OPENAI_API_KEY`)
- Typing delay before DMs; probabilistic skip (`DM_PROBABILITY`) and privacy / flood handling
- Sessions encrypted at rest (`SESSION_ENCRYPTION_KEY`)

## Prerequisites

- Node.js 22+ (recommended)
- MongoDB 7+
- Redis 7+
- [Telegram API ID & hash](https://my.telegram.org)

## Local setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and fill values (see table below).

3. **Start MongoDB & Redis** (or use Docker Compose services only for those).

4. **Run API + worker + web**

   ```bash
   npm run dev
   ```

   - API: `http://localhost:4000` (also try `http://127.0.0.1:4000/health` in a browser)
   - Web: `http://localhost:3000`
   - Worker runs as a second Node process (`tsx watch src/worker.ts`)

   **Signup shows “Failed to fetch”?**

   - Ensure the **API process is running**: from the repo root run `npm run api` or `npm run dev` (starts API + worker + web). You should see `[config] Using env file: ...\\.env` and `API http://127.0.0.1:4000`.
   - **Redis** must be running locally (`REDIS_URL`, default `redis://127.0.0.1:6379`). The API connects to Mongo on startup; the worker needs Redis for queues.
   - Prefer **no** `NEXT_PUBLIC_API_URL`: the browser calls `/api/...` on port 3000 and the Next **proxy route** (`web/app/api/[[...path]]/route.ts`) forwards requests (including `Authorization`) to Express. If the API is not on `127.0.0.1:4000`, set `API_INTERNAL_URL` in **`web/.env.local`** (Next does not load the repo-root `.env` for that route). If you set `NEXT_PUBLIC_API_URL`, the browser calls the API directly and must satisfy CORS (`WEB_ORIGIN`).
   - Mongo whitelist does **not** fix browser → API errors; that only affects the server → Atlas connection.

5. **First-time dashboard**

   - Open **Settings**: set **Telegram api_id / api_hash** ([my.telegram.org](https://my.telegram.org)) or keep them in `.env` only.
   - Open `/login`, **register**, then **link a Telegram account** under Accounts (phone + OTP).
   - Create a campaign (source group optional, target group required for invites).
   - Upload CSV on the campaign page if needed (`username`, `user_id` / `telegram_id`).
   - **Start** the campaign; jobs flow through queues (never tight loops).

### Environment vs dashboard

| Where | What |
|-------|------|
| **`.env` only** | `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `SESSION_ENCRYPTION_KEY`, `WEB_ORIGIN`, `PORT` — the server must read these before Mongo is usable for UI settings. |
| **Dashboard → Settings** (or `.env` fallback) | Telegram `api_id` / `api_hash`, OpenAI key & model, adds/DMs per hour, DM probability, batch/parallel workers, extra CORS origins. |

### Important `.env` vars (minimum)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | [MongoDB Atlas](https://www.mongodb.com/atlas) (or local) connection string |
| `REDIS_URL` | Local or hosted Redis (e.g. `redis://127.0.0.1:6379`) |
| `JWT_SECRET` | Long random string for login tokens |
| `SESSION_ENCRYPTION_KEY` | 32+ chars — encrypts Telegram session strings in the DB |
| `WEB_ORIGIN` | Your web app URL for CORS (e.g. `http://localhost:3000`) |
| `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` | Optional if configured in **Settings** |
| `MAX_*`, `DM_PROBABILITY`, etc. | Optional defaults if not set in **Settings** |

## Docker (optional)

```bash
cp .env.example .env
# edit .env — point MONGODB_URI and REDIS_URL at host.docker.internal if services run on host,
# or use the mongo + redis services in docker-compose.yml

docker compose up --build
```

- `NEXT_PUBLIC_API_URL` for the **browser** should remain reachable from the user’s machine (e.g. `http://localhost:4000` when ports are published).
- GramJS proxies: set `socks5://user:pass@host:port` per account in the UI; MTProxy is also supported by the library.

## Queues & job flow

1. **Start campaign** with `sourceGroupUsername` → `scrape_users` hydrates `CampaignUser` rows (deduped).
2. **CSV** merges additional rows (`UN:username` synthetic ids until resolved server-side).
3. **`campaign_tick`** atomically moves users `pending` → `queued` and enqueues staggered **`add_user`** jobs.
4. **`add_user`** respects caps and errors; on success enqueues delayed **`send_message`**.
5. Workers run with **concurrency 1** per queue to avoid burst sends.

## Python / Telethon

This repo uses **GramJS** only. If you need Telethon, the usual pattern is a small Python sidecar with a shared Redis queue—out of scope here but straightforward to add.

## Project layout

```
server/src/
  config/          env (zod)
  crypto/          session encryption
  models/          Mongoose schemas
  queues/          BullMQ queues
  routes/          REST API
  services/        rate limits, messaging, logging, telegram actions
  telegram/        GramJS helpers
  workers/         job handlers
```

## License

MIT — use at your own risk regarding Telegram policies and applicable law.
