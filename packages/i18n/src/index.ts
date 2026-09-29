export const locales = ['hy', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'hy';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Font family per locale (Armenian needs Noto Sans Armenian; ru/en use Inter). */
export const localeFont: Record<Locale, 'armenian' | 'latin'> = {
  hy: 'armenian',
  ru: 'latin',
  en: 'latin',
};

export type Messages = typeof import('../messages/en.json');
