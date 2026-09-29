import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { auth } from '@/auth';
import { PhasePlaceholder } from '@/components/phase-placeholder';

export const dynamic = 'force-dynamic';

export default async function NannyHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect({ href: '/auth/login', locale });

  return (
    <PhasePlaceholder
      title="Nanny dashboard"
      note="Profile stepper, AI interview and documents arrive in Phases 1–2. You are signed in."
    />
  );
}
