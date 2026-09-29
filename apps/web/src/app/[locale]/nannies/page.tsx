import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PhasePlaceholder } from '@/components/phase-placeholder';

export default async function NanniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return (
    <PhasePlaceholder
      title={t('findNanny')}
      note="Search + map arrives in Phase 4. Verified nannies are already seeded in the database."
    />
  );
}
