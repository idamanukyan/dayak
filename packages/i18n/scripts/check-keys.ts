/**
 * CI guard (spec Section 7): every key present in the source locale (hy) must
 * exist in every other locale, and no locale may have extra keys. Exit non-zero
 * on any mismatch.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(here, '..', 'messages');
const locales = ['hy', 'ru', 'en'] as const;
const SOURCE = 'hy';

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

function load(locale: string): Set<string> {
  const raw = readFileSync(join(messagesDir, `${locale}.json`), 'utf8');
  return new Set(flatten(JSON.parse(raw)));
}

const keysByLocale = Object.fromEntries(locales.map((l) => [l, load(l)]));
const source = keysByLocale[SOURCE]!;
let ok = true;

for (const locale of locales) {
  if (locale === SOURCE) continue;
  const keys = keysByLocale[locale]!;
  const missing = [...source].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !source.has(k));
  if (missing.length) {
    ok = false;
    console.error(`[${locale}] missing ${missing.length} key(s):\n  ${missing.join('\n  ')}`);
  }
  if (extra.length) {
    ok = false;
    console.error(`[${locale}] extra ${extra.length} key(s):\n  ${extra.join('\n  ')}`);
  }
}

if (ok) {
  console.log(`i18n: all locales match source (${source.size} keys × ${locales.length} locales).`);
  process.exit(0);
} else {
  console.error('i18n key check FAILED.');
  process.exit(1);
}
