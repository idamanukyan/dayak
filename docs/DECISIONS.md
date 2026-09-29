# Architectural Decisions

Chronological log. Each entry: what was decided and why. See
`docs/dayak-web-spec.md` for the authoritative spec and
`docs/superpowers/specs/2026-09-28-dayak-web-design.md` for the design system.

## 2026-09-28 — Phase 0 kickoff

- **Design direction: "Warm & trustworthy".** Trust-first product; calm, human,
  reassuring palette (warm cream, sage green, soft terracotta) over a clinical or
  premium look. Details in the design doc.
- **Locale-conditional fonts.** Noto Sans Armenian for `hy` (source locale),
  Inter for `ru`/`en`. Reason: Inter does not render Armenian glyphs well; a
  single family would degrade the primary language.
- **Keep `dayak-kit/` in place.** The existing Python aiogram bot is left as
  legacy reference until ported to `apps/bot` (grammY) in Phase 5, per spec
  Section 8. Avoids deleting working code before its replacement exists.
- **Package manager: pnpm 9 via Corepack.** Matches spec's pnpm-workspaces
  layout. Node 20 LTS locally.
- **Postgres/Redis/MinIO run in Docker** (no local psql). Matches spec Section 2.

## 2026-09-28 — Phase 1 (nanny profile + documents)

- **Interview step is a placeholder in Phase 1.** The real streaming AI interview
  is Phase 2. For now `startInterviewAction` / `completeInterviewAction` advance
  REGISTERED → INTERVIEW_IN_PROGRESS → INTERVIEW_DONE → DOCS_PENDING and record a
  minimal `Interview` row (`model: "placeholder-phase1"`), so the status machine
  and Phase 1 acceptance work end-to-end. Phase 2 replaces the action bodies only.
- **Review gate = ID_FRONT + SELFIE_WITH_ID + ≥2 references** (spec 5.1), even
  though the checklist also lists ID_BACK as required for the nanny to upload.
  ID_BACK is encouraged but not part of the auto-transition condition.
- **Client-safe enum values.** `apps/web/src/lib/enum-values.ts` mirrors the Prisma
  enums as plain string arrays so client components never import `@dayak/db`
  (which bundles PrismaClient and must not reach the browser).
- **Argon2 params** standardised at `{ memoryCost: 19456, timeCost: 2, parallelism: 1 }`
  across seed and auth.
- **Local dev runs on port 3100** — port 3000 is taken by another project on this
  machine. `PORT=3100 pnpm start`.
