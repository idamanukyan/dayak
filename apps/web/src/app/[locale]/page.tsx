import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ShieldCheck, FileCheck2, Users, Clock, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SiteHeader } from '@/components/site-header';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing />;
}

function Landing() {
  const t = useTranslations('landing');

  const trust = [
    { icon: Users, label: t('trust1') },
    { icon: FileCheck2, label: t('trust2') },
    { icon: ShieldCheck, label: t('trust3') },
    { icon: Clock, label: t('trust4') },
  ];

  const steps = [
    { title: t('howStep1Title'), body: t('howStep1Body') },
    { title: t('howStep2Title'), body: t('howStep2Body') },
    { title: t('howStep3Title'), body: t('howStep3Body') },
  ];

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-70"
            style={{
              background:
                'radial-gradient(60% 50% at 80% 0%, hsl(var(--secondary) / 0.18), transparent), radial-gradient(50% 40% at 0% 20%, hsl(var(--primary) / 0.12), transparent)',
            }}
            aria-hidden
          />
          <div className="container flex flex-col items-center gap-8 py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-verified/10 px-4 py-1.5 text-sm font-medium text-verified">
              <ShieldCheck className="h-4 w-4" />
              {t('trust1')} · {t('trust3')}
            </span>

            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/nannies">
                  {t('ctaParent')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/register">{t('ctaNanny')}</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <ul className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {trust.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-card/70 px-4 py-5 text-center shadow-soft"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="container py-16 md:py-24">
          <h2 className="mb-10 text-center text-3xl font-bold">{t('howTitle')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={step.title}>
                <CardContent className="flex flex-col gap-3 p-8">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Dayak · Yerevan
        </div>
      </footer>
    </>
  );
}
