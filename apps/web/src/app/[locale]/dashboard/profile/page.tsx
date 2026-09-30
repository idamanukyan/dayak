import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Role } from '@dayak/db';
import { getActor, requireOrCreateParent } from '@/lib/session';
import { Link, redirect } from '@/i18n/routing';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentProfileForm } from '@/components/parent/profile-form';

export const dynamic = 'force-dynamic';

interface Child {
  ageMonths: number;
}

export default async function ParentProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('parent');

  const actor = await getActor();
  if (!actor) redirect({ href: '/auth/login', locale });
  else if (actor.role !== Role.PARENT) redirect({ href: '/', locale });

  const { parent } = await requireOrCreateParent();
  const children = (parent.children as unknown as Child[]) ?? [];

  return (
    <>
      <AppHeader />
      <main className="container max-w-xl py-8">
        <Link
          href="/dashboard"
          className="mb-4 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t('dashboardTitle')}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{t('profileTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ParentProfileForm
              values={{
                district: parent.district,
                languages: parent.languages,
                childrenAges: children.map((c) => c.ageMonths).join(', '),
              }}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
