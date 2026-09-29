import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@dayak/db';
import { requireOrCreateNanny } from '@/lib/session';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentsManager } from '@/components/nanny/documents-manager';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nanny');

  const { nanny } = await requireOrCreateNanny();
  const documents = await prisma.document.findMany({
    where: { nannyId: nanny.id },
    orderBy: { uploadedAt: 'desc' },
    select: { type: true, status: true },
  });

  // Keep the latest status per doc type.
  const latest = new Map<string, string>();
  for (const d of documents) if (!latest.has(d.type)) latest.set(d.type, d.status);
  const initial = [...latest.entries()].map(([type, status]) => ({ type, status }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/nanny" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('title')}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t('documents.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('documents.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <DocumentsManager initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
