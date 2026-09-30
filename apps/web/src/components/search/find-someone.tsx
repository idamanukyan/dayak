'use client';

import { useTranslations } from 'next-intl';
import { RequestModal } from '@/components/search/request-modal';

/** "Find me someone" — a match request with no specific nanny (spec 5.5). */
export function FindSomeone() {
  const t = useTranslations('parent');
  return <RequestModal triggerLabel={t('findSomeoneCta')} triggerVariant="secondary" />;
}
