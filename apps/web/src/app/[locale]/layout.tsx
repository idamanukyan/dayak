import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { locales, localeFont, isLocale } from '@dayak/i18n';
import { messagesByLocale } from '@/i18n/messages';
import { inter, notoArmenian } from '../fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Dayak — Verified nannies in Yerevan',
  description: 'Finding a nanny in Yerevan is easy. Trusting one is hard.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);

  const fontClass = localeFont[locale] === 'armenian' ? notoArmenian.variable : inter.variable;

  return (
    <html lang={locale} className={fontClass}>
      <body className="min-h-screen font-sans antialiased">
        <NextIntlClientProvider messages={messagesByLocale[locale]}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
