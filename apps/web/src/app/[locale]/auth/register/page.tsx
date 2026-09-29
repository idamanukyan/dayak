import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@dayak/i18n';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '../register-form';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RegisterView locale={locale as Locale} />;
}

function RegisterView({ locale }: { locale: Locale }) {
  const t = useTranslations('auth');
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="mb-2 text-sm font-bold text-primary">
            Dayak
          </Link>
          <CardTitle>{t('registerTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm locale={locale} />
          <p className="text-center text-sm text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              {t('submitLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
