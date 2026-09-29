'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, type Locale } from '@dayak/i18n';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    // Replace the current route under the new locale — preserves the path.
    router.replace(pathname, { locale: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Change language">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{t(`localeNames.${locale}`)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => switchTo(l)} className="cursor-pointer">
            <span className="flex-1">{t(`localeNames.${l}`)}</span>
            {l === locale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
