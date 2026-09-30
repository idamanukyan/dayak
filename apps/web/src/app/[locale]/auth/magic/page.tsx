import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { MagicClient } from './magic-client';

export const dynamic = 'force-dynamic';

export default async function MagicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; to?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, to } = await searchParams;

  if (!token) redirect({ href: '/auth/login', locale });

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <MagicClient token={token!} to={to && to.startsWith('/') ? to : `/${locale}/dashboard`} />
    </main>
  );
}
