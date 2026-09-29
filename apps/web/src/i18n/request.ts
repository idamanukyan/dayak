import { getRequestConfig } from 'next-intl/server';
import { isLocale, defaultLocale } from '@dayak/i18n';
import { messagesByLocale } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
