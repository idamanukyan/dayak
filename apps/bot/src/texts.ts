import type { Locale } from '@dayak/db';

export const CHOOSE_LANGUAGE =
  'Բարև! Ընտրեք լեզուն / Здравствуйте! Выберите язык / Hello! Choose your language:';

export const chooseRole: Record<Locale, string> = {
  hy: 'Դուք ծնո՞ղ եք, թե՞ դայակ:',
  ru: 'Вы родитель или няня?',
  en: 'Are you a parent or a nanny?',
};

export const roleParent: Record<Locale, string> = { hy: 'Ծնող', ru: 'Родитель', en: 'Parent' };
export const roleNanny: Record<Locale, string> = { hy: 'Դայակ', ru: 'Няня', en: 'Nanny' };

export function parentDone(locale: Locale, link: string): string {
  const map: Record<Locale, string> = {
    hy: `Շնորհակալություն։ Ձեր հարցումն ընդունված է — մեր համակարգողը կկապվի ձեզ հետ։ Շարունակեք կայքում՝ ${link}`,
    ru: `Спасибо! Ваш запрос принят — координатор свяжется с вами. Продолжите на сайте: ${link}`,
    en: `Thanks! Your request is in — our coordinator will be in touch. Continue on the web: ${link}`,
  };
  return map[locale];
}

export function nannyDone(locale: Locale, link: string): string {
  const map: Record<Locale, string> = {
    hy: `Հիանալի է։ Հաջորդ քայլը՝ կարճ հարցազրույցն է կայքում (հարմար է երկար պատասխանների համար)՝ ${link}`,
    ru: `Отлично! Следующий шаг — короткое собеседование на сайте (удобно для длинных ответов): ${link}`,
    en: `Great! Next step is a short interview on the web (better for long answers): ${link}`,
  };
  return map[locale];
}
