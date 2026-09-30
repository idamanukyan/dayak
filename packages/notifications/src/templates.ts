import type { Locale } from '@dayak/db';

export interface EmailContent {
  subject: string;
  body: string;
}

/** Nanny verified — sent to the nanny in her locale (spec 5.4 / Phase 5 acceptance). */
export function nannyVerified(locale: Locale, firstName: string): EmailContent {
  const map: Record<Locale, EmailContent> = {
    hy: {
      subject: 'Դուք ստուգված եք Dayak-ում 🎉',
      body: `Բարև ${firstName}, շնորհավորում ենք։ Ձեր պրոֆիլը ստուգվեց և այժմ տեսանելի է ծնողներին։ Մուտք գործեք ձեր էջ՝ հասանելիությունը կարգավորելու և հարցումներ ստանալու համար։`,
    },
    ru: {
      subject: 'Вы проверены в Dayak 🎉',
      body: `Здравствуйте, ${firstName}! Поздравляем — ваш профиль проверен и теперь виден родителям. Войдите в кабинет, чтобы настроить доступность и получать запросы.`,
    },
    en: {
      subject: "You're verified on Dayak 🎉",
      body: `Hi ${firstName}, congratulations — your profile is verified and now visible to parents. Log in to set your availability and receive requests.`,
    },
  };
  return map[locale];
}

/** Nanny asked for changes — her locale. */
export function nannyChangesRequested(locale: Locale, firstName: string): EmailContent {
  const map: Record<Locale, EmailContent> = {
    hy: {
      subject: 'Dayak. անհրաժեշտ են փոփոխություններ',
      body: `Բարև ${firstName}, ձեր դիմումը վերանայելու համար անհրաժեշտ են որոշ փոփոխություններ։ Մուտք գործեք ձեր էջ՝ մանրամասները տեսնելու և կրկին ուղարկելու համար։`,
    },
    ru: {
      subject: 'Dayak: нужны изменения',
      body: `Здравствуйте, ${firstName}. Для проверки вашей заявки нужны небольшие изменения. Войдите в кабинет, чтобы посмотреть детали и отправить снова.`,
    },
    en: {
      subject: 'Dayak: changes requested',
      body: `Hi ${firstName}, we need a few changes before we can approve your application. Log in to see the details and re-submit.`,
    },
  };
  return map[locale];
}

/** Nanny rejected — her locale, category only (never free text). */
export function nannyRejected(locale: Locale, firstName: string): EmailContent {
  const map: Record<Locale, EmailContent> = {
    hy: {
      subject: 'Dayak. դիմումի կարգավիճակ',
      body: `Բարև ${firstName}, ցավոք այս պահին չենք կարող հաստատել ձեր դիմումը։ Շնորհակալություն հետաքրքրության համար։`,
    },
    ru: {
      subject: 'Dayak: статус заявки',
      body: `Здравствуйте, ${firstName}. К сожалению, сейчас мы не можем одобрить вашу заявку. Спасибо за интерес.`,
    },
    en: {
      subject: 'Dayak: application status',
      body: `Hi ${firstName}, unfortunately we can't approve your application at this time. Thank you for your interest.`,
    },
  };
  return map[locale];
}

/** Parent's request status changed — parent's locale. */
export function requestStatusForParent(locale: Locale, statusLabel: string): EmailContent {
  const map: Record<Locale, EmailContent> = {
    hy: { subject: 'Dayak. հարցման թարմացում', body: `Ձեր հարցման կարգավիճակը՝ ${statusLabel}։ Մանրամասները՝ ձեր էջում։` },
    ru: { subject: 'Dayak: обновление запроса', body: `Статус вашего запроса: ${statusLabel}. Подробности в кабинете.` },
    en: { subject: 'Dayak: request update', body: `Your request status is now: ${statusLabel}. See details on your dashboard.` },
  };
  return map[locale];
}

/** Admin-group message for a new match request (English — admin surface). */
export function adminNewRequest(parentName: string, nannyName: string | null, source: string | null): string {
  return (
    `🆕 New match request\n` +
    `Parent: ${parentName}\n` +
    `Nanny: ${nannyName ?? '(find me someone)'}\n` +
    `Source: ${source ?? 'direct'}`
  );
}

/** Admin-group message for a nanny entering review (English). */
export function adminNannyUnderReview(nannyName: string): string {
  return `📋 Nanny ready for review: ${nannyName}`;
}
