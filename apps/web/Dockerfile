# Multi-stage build for the Next.js standalone server. Build context = repo root.
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# openssl is required by Prisma engines on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# ---- deps: install with the full workspace manifest set ----
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/bot/package.json apps/bot/
COPY packages/db/package.json packages/db/
COPY packages/ai/package.json packages/ai/
COPY packages/i18n/package.json packages/i18n/
COPY packages/config/package.json packages/config/
COPY packages/notifications/package.json packages/notifications/
RUN pnpm install --frozen-lockfile

# ---- builder: generate Prisma client + build the app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @dayak/db generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @dayak/web build

# ---- runner: minimal standalone image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# standalone server + static assets (outputFileTracingRoot => paths under apps/web)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Prisma engine + generated client for runtime queries
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
