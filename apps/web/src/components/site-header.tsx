import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="inline-block h-7 w-7 rounded-full bg-primary" aria-hidden />
          {t('common.appName')}
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/nannies">{t('nav.findNanny')}</Link>
          </Button>
          <LanguageSwitcher />
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">{t('nav.login')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/register">{t('nav.register')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
