import hy from '@dayak/i18n/messages/hy.json';
import ru from '@dayak/i18n/messages/ru.json';
import en from '@dayak/i18n/messages/en.json';
import type { Locale } from '@dayak/i18n';

// Static map avoids dynamic-import resolution issues across the workspace package.
export const messagesByLocale = { hy, ru, en } satisfies Record<Locale, unknown>;
