import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { requireOrCreateNanny } from '@/lib/session';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/nanny/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nanny');

  const { nanny } = await requireOrCreateNanny();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/nanny" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('title')}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            values={{
              district: nanny.district,
              birthYear: nanny.birthYear,
              experienceYears: nanny.experienceYears,
              languages: nanny.languages,
              ageGroups: nanny.ageGroups,
              schedules: nanny.schedules,
              rateHourAmd: nanny.rateHourAmd,
              rateMonthAmd: nanny.rateMonthAmd,
              backupWilling: nanny.backupWilling,
              bio: nanny.bio,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
