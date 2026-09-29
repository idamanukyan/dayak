import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { auth } from '@/auth';
import { PhasePlaceholder } from '@/components/phase-placeholder';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect({ href: '/auth/login', locale });

  return (
    <PhasePlaceholder
      title="Parent dashboard"
      note="Requests, favourites and profile arrive in Phase 4. You are signed in."
    />
  );
}
