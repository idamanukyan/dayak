'use client';

import { useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@dayak/i18n';
import { NANNY_STATUS } from '@/lib/enum-values';
import { startInterviewAction, completeInterviewAction } from '@/app/[locale]/nanny/actions';
import { Button } from '@/components/ui/button';

export function InterviewStep({ status }: { status: string }) {
  const t = useTranslations('nanny.interview');
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  if (status === NANNY_STATUS.REGISTERED) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t('placeholderNote')}</p>
        <Button
          disabled={pending}
          onClick={() => startTransition(() => void startInterviewAction())}
        >
          {t('start')}
        </Button>
      </div>
    );
  }

  if (status === NANNY_STATUS.INTERVIEW_IN_PROGRESS) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t('placeholderNote')}</p>
        <Button
          disabled={pending}
          onClick={() => startTransition(() => void completeInterviewAction(locale))}
        >
          {t('complete')}
        </Button>
      </div>
    );
  }

  return null;
}
