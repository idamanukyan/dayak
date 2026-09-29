import { describe, it, expect } from 'vitest';
import hy from '../messages/hy.json';
import ru from '../messages/ru.json';
import en from '../messages/en.json';
import { locales } from './index';

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('i18n messages', () => {
  const byLocale = { hy, ru, en };
  const source = flatten(hy).sort();

  it('exposes exactly three locales', () => {
    expect([...locales].sort()).toEqual(['en', 'hy', 'ru']);
  });

  for (const locale of ['ru', 'en'] as const) {
    it(`${locale} has the same keys as the source (hy)`, () => {
      expect(flatten(byLocale[locale]).sort()).toEqual(source);
    });
  }
});
