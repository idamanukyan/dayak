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

## Security hardening (Phase 6)

- **Rate limits** (`apps/web/src/lib/rate-limit.ts`): login 5 / 15 min per IP+email;
  interview turns 60 / hr per nanny; presign 20 / hr per nanny. In-memory per instance
  (swap for Redis to scale horizontally).
- **Security headers** (`next.config.mjs` → `headers()`): CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. Caddy adds
  HSTS at the edge.
- **CSRF**: Server Actions restricted to `SERVER_ACTION_ORIGINS` in production.
- **File uploads**: server-side MIME sniff (`file-type`) + 10 MB cap + allowlist; ID
  images are private, accessed only via 60 s presigned URLs, every admin view audited.

## Deploy (Hetzner VPS + Docker + Caddy)

Prereqs: a VPS with Docker + Docker Compose, a DNS A record pointing your domain at it.

```bash
# On the VPS, in the repo:
cp .env.example .env      # fill EVERY value — AUTH_SECRET, POSTGRES_PASSWORD,
                          # DAYAK_DOMAIN, SERVER_ACTION_ORIGINS, ANTHROPIC_API_KEY, etc.
export DAYAK_DOMAIN=app.dayak.am

# 1. Build + start db/redis/web/caddy
docker compose -f compose.prod.yml up -d --build

# 2. Apply migrations (the one-shot `migrate` service)
docker compose -f compose.prod.yml run --rm migrate

# 3. Seed once (first deploy only), or create an admin (below)
#    docker compose -f compose.prod.yml exec web node ... (see "Add an admin")
```

Caddy fetches a Let's Encrypt cert for `$DAYAK_DOMAIN` automatically. Visit
`https://$DAYAK_DOMAIN` → it should redirect to `/hy`. Health: `https://$DAYAK_DOMAIN/api/health`.

The **Telegram bot** runs as a separate long-polling process (not in the web image):
```bash
pnpm --filter @dayak/bot start   # on the VPS or a small worker box, with TELEGRAM_BOT_TOKEN set
```

## Rollback

Images are tagged by the compose build. To roll back to a previous commit:
```bash
git checkout <previous-good-sha>
docker compose -f compose.prod.yml up -d --build web
# If a migration must be reverted, restore from the latest pre-deploy backup (below).
```
Migrations are forward-only (`prisma migrate deploy`); for a schema rollback, restore a
backup taken immediately before the deploy.

## Secret rotation

1. Generate the new value (e.g. `openssl rand -base64 32` for `AUTH_SECRET`).
2. Update `.env` on the VPS (and your secrets manager).
3. `docker compose -f compose.prod.yml up -d web` to restart with the new env.
   - Rotating `AUTH_SECRET` invalidates all sessions (users re-log in) — expected.
   - Rotating `S3_*` / `ANTHROPIC_API_KEY` / `RESEND_API_KEY` / `TELEGRAM_BOT_TOKEN`
     takes effect on restart.

## Backups & restore

Nightly `pg_dump` → gzip → R2 via `scripts/backup.sh` (cron: `30 2 * * *`). Retains 30 days.

Restore a backup:
```bash
# Download the dump from R2, then:
gunzip -c dayak-YYYYMMDDT......Z.sql.gz | \
  docker compose -f compose.prod.yml exec -T postgres psql -U dayak -d dayak
```
Test restores periodically into a scratch DB — an untested backup is not a backup.

## Add an admin

```bash
# From the repo (dev or a box with source + deps):
pnpm tsx scripts/add-admin.ts admin@dayak.am 'strong-password' "Coordinator"
```
Creates the user if absent, or promotes an existing user to ADMIN and resets the password.

## Security scan (OWASP ZAP baseline)

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://$DAYAK_DOMAIN -m 5
```
Target: **no High-risk findings**. The security headers + CSP above address the common
baseline alerts (missing CSP, X-Frame-Options, clickjacking). Re-run after each deploy.
