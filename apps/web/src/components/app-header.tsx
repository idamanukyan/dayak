import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { logoutAction } from '@/app/[locale]/auth/actions';

/** Header for authenticated areas (nanny / parent dashboards). */
export function AppHeader() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="inline-block h-7 w-7 rounded-full bg-primary" aria-hidden />
          {t('common.appName')}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
