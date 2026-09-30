# Dayak Runbook

Operational guide. Kept current as phases land. See `docs/dayak-web-spec.md` for
the full spec.

## Local development

Prerequisites: Node 20+, Docker, pnpm (via `corepack enable`).

```bash
# 1. Install deps
pnpm install

# 2. Start infra (postgres, redis, minio)
pnpm db:up

# 3. Configure env
cp .env.example .env
cp .env.example apps/web/.env.local
#   generate a secret:
#   openssl rand -base64 32   -> paste into AUTH_SECRET in both files
#   (packages/db reads DATABASE_URL from the root .env)

# 4. Create the schema + seed demo data
pnpm db:push        # or: pnpm db:migrate  (creates a migration)
pnpm db:seed

# 5. Run the app
pnpm dev            # http://localhost:3000  -> redirects to /hy
```

Demo accounts after seeding:

- Admin: `admin@dayak.local` / `admin1234`
- Nanny (verified): `nanny1@dayak.local` / `nanny1234`
- Parent: `parent1@dayak.local` / `parent1234`

## Quality gates

```bash
pnpm lint         # eslint (web)
pnpm typecheck    # tsc across all packages
pnpm test         # vitest unit tests
pnpm i18n:check   # every i18n key present in all locales
pnpm test:e2e     # playwright golden paths (needs app + db running)
```

## Health

- `GET /api/health` returns `{status:"ok", db:"up"}` when Postgres is reachable.

## Ports

| Service | Port |
|---|---|
| web (Next.js) | 3000 |
| postgres | 5432 |
| redis | 6379 |
| minio API / console | 9000 / 9001 |

## Telegram bot (apps/bot)

```bash
# Needs a bot token from @BotFather in .env: TELEGRAM_BOT_TOKEN=...
# Optional admin group notifications: TELEGRAM_ADMIN_CHAT_ID=... (use /id in the bot)
pnpm --filter @dayak/bot start   # long-polling; no-ops with a friendly message if no token
```

Without `TELEGRAM_BOT_TOKEN` / `RESEND_API_KEY`, notifications and the bot fall back to
console logging (dev). Emails send via Resend when `RESEND_API_KEY` is set; Telegram
messages send when `TELEGRAM_BOT_TOKEN` is set and the recipient has a linked
`telegramId` (or for the admin group when `TELEGRAM_ADMIN_CHAT_ID` is set).

## Deploy / rollback / secrets / restore

_To be completed in Phase 6 (Hetzner + Caddy, `compose.prod.yml`, nightly
`pg_dump` to R2, secret rotation, adding an admin)._
