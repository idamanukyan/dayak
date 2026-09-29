# Dayak Web — Design & Build Approach

> Companion to `docs/dayak-web-spec.md` (the authoritative build spec). This file
> records the **visual design system** and the **decisions/pace** that the spec
> leaves open. Where this file and the spec disagree, the spec wins on
> architecture; this file wins on look-and-feel.

Date: 2026-09-28

## Approach

- **Pace:** phase-by-phase (spec Section 9). Each phase ends at its acceptance
  gate; the user reviews the running app before the next phase starts.
- **Design direction:** "Warm & trustworthy" — this is a trust-first product
  (parents handing over their children), so the UI must feel calm, human, and
  reassuring rather than clinical or flashy.

## Visual design system

Wired as CSS variables in `apps/web` and consumed by Tailwind + shadcn/ui.

| Token | Value | Use |
|---|---|---|
| `--background` | `#FAF7F2` warm cream | page background |
| `--foreground` | `#2B2724` warm charcoal | body text |
| `--primary` | `#4F7355` sage green | CTAs, links, primary accents |
| `--secondary` | `#D08A6A` soft terracotta | highlights, secondary actions |
| `--verified` | `#3E7C4F` | the "Verified" badge (the core promise) |
| `--muted` | `#EFE9E0` | card fills, filter chips |
| `--border` | `#E3DCD0` | hairlines |
| `--destructive` | `#B4442E` | reject/cancel actions |

- **Radius:** `1rem` base (`rounded-2xl` cards).
- **Shadows:** soft, low-spread (`0 2px 8px rgba(43,39,36,.06)`).
- **Spacing:** generous; whitespace is a trust signal.

### Typography

- **Armenian (`hy`, the source locale):** Noto Sans Armenian — Inter does not
  cover Armenian glyphs well.
- **Russian / English (`ru`, `en`):** Inter (covers Cyrillic + Latin cleanly).
- Font family is swapped by active locale on `<html>`.
- Headings: large, friendly, comfortable line-height.

### Trust cues (surfaced early)

Landing hero uses the spec's verbatim three-language copy, including the
✅ interviewed · ✅ 2 checked references · ✅ ID verified · ✅ backup within 4h line.
Nanny cards lead with photo → first name → **Verified** badge → district →
languages → experience → `publicSummary`.

## Phase 0 scope (this phase)

Monorepo + Next.js 15 + Prisma (full schema) + Auth.js v5 + next-intl (3 locales)
+ styled landing + docker-compose (postgres/redis/minio) + `/api/health` +
lint/typecheck/test tooling + CI. See spec Section 9, Phase 0 for the acceptance
list.

## Logged deviations (also in `docs/DECISIONS.md`)

1. **Locale-conditional fonts** — Noto Sans Armenian for `hy`, Inter for `ru`/`en`,
   instead of one family for all. Reason: Armenian glyph quality.
2. **Keep `dayak-kit/` in place** — the existing Python aiogram bot stays as
   legacy reference until it is ported to `apps/bot` (grammY) in Phase 5.
