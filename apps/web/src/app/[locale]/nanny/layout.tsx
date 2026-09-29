import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { Role } from '@dayak/db';
import { getActor } from '@/lib/session';
import { AppHeader } from '@/components/app-header';

export default async function NannyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const actor = await getActor();
  if (!actor) redirect({ href: '/auth/login', locale });
  else if (actor.role !== Role.NANNY) redirect({ href: '/dashboard', locale });

  return (
    <>
      <AppHeader />
      <main className="container max-w-3xl py-10">{children}</main>
    </>
  );
}
