import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { NannyStatus, type Locale } from '@dayak/db';
import type { TranscriptTurn } from '@dayak/ai';
import { requireOrCreateNanny } from '@/lib/session';
import { getOrCreateActiveInterview } from '@/server/onboarding';
import { Link, redirect } from '@/i18n/routing';
import { InterviewChat } from '@/components/nanny/interview-chat';

export const dynamic = 'force-dynamic';

const PRE_INTERVIEW: NannyStatus[] = [NannyStatus.REGISTERED, NannyStatus.INTERVIEW_IN_PROGRESS];

export default async function InterviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nanny.interview');

  const { nanny, actor } = await requireOrCreateNanny();

  // Interview is only for nannies who haven't finished it yet.
  if (!PRE_INTERVIEW.includes(nanny.status)) {
    redirect({ href: '/nanny', locale });
  }

  const interview = await getOrCreateActiveInterview(nanny.id, actor.id, locale as Locale);
  const transcript = (interview.transcript as unknown as TranscriptTurn[]) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/nanny"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <InterviewChat interviewId={interview.id} initialTranscript={transcript} />
    </div>
  );
}
