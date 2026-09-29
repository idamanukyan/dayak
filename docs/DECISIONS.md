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
