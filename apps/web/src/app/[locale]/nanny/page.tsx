import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Trash2, FileText, Pencil, MessageSquare } from 'lucide-react';
import { prisma, NannyStatus, DocType } from '@dayak/db';
import { requireOrCreateNanny } from '@/lib/session';
import { computeChecklist } from '@/lib/onboarding';
import { REQUIRED_DOC_TYPES } from '@/lib/uploads';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stepper } from '@/components/nanny/stepper';
import { AddReferenceForm } from '@/components/nanny/add-reference-form';
import { deleteReferenceAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function NannyDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nanny');
  const te = await getTranslations('enums');

  const { nanny } = await requireOrCreateNanny();
  const [documents, references] = await Promise.all([
    prisma.document.findMany({ where: { nannyId: nanny.id }, orderBy: { uploadedAt: 'desc' } }),
    prisma.reference.findMany({ where: { nannyId: nanny.id }, orderBy: { id: 'asc' } }),
  ]);

  const docTypesPresent = [...new Set(documents.map((d) => d.type))];
  const preInterview: NannyStatus[] = [
    NannyStatus.REGISTERED,
    NannyStatus.INTERVIEW_IN_PROGRESS,
  ];
  const interviewDone = !preInterview.includes(nanny.status);

  const checklist = computeChecklist({
    status: nanny.status,
    profile: {
      languages: nanny.languages,
      experienceYears: nanny.experienceYears,
      ageGroups: nanny.ageGroups,
      schedules: nanny.schedules,
    },
    docTypesPresent,
    referenceCount: references.length,
    interviewDone,
  });

  const statusVariant =
    nanny.status === NannyStatus.VERIFIED
      ? 'verified'
      : nanny.status === NannyStatus.REJECTED
        ? 'destructive'
        : 'primary';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Status banner */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-6">
          <Badge variant={statusVariant} className="w-fit">
            {t(`status.${nanny.status}`)}
          </Badge>
          <p className="text-sm text-muted-foreground">{t(`statusHelp.${nanny.status}`)}</p>
        </CardContent>
      </Card>

      <Stepper checklist={checklist} />

      {/* Profile */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('profile.title')}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/nanny/profile">
              <Pencil className="h-4 w-4" />
              {checklist.profileComplete ? t('profile.edit') : t('profile.save')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {checklist.profileComplete ? (
            <span>
              {te(`district.${nanny.district}`)} ·{' '}
              {nanny.languages.map((l) => te(`language.${l}`)).join(', ')} · {nanny.experienceYears}{' '}
              {t('profile.experienceYears').toLowerCase()}
            </span>
          ) : (
            <span>{t('todo')}</span>
          )}
        </CardContent>
      </Card>

      {/* Interview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('steps.interview')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {interviewDone ? (
            <Badge variant="verified">{t('status.INTERVIEW_DONE')}</Badge>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t('interview.intro')}</p>
              <Button asChild className="w-fit">
                <Link href="/nanny/interview">
                  <MessageSquare className="h-4 w-4" />
                  {nanny.status === NannyStatus.INTERVIEW_IN_PROGRESS
                    ? t('interview.resume')
                    : t('interview.start')}
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('documents.title')}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/nanny/documents">
              <FileText className="h-4 w-4" />
              {t('documents.title')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REQUIRED_DOC_TYPES.map((dt: DocType) => (
            <Badge key={dt} variant={docTypesPresent.includes(dt) ? 'verified' : 'outline'}>
              {t(`docType.${dt}`)}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <CardTitle>{t('references.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('references.subtitle')}</p>

          {references.length > 0 && (
            <ul className="flex flex-col gap-2">
              {references.map((ref) => (
                <li
                  key={ref.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2"
                >
                  <span className="text-sm">
                    <span className="font-medium">{ref.name}</span> · {ref.phone} ·{' '}
                    {ref.relation === 'parent_employer'
                      ? t('references.parentEmployer')
                      : t('references.other')}
                  </span>
                  <form action={deleteReferenceAction.bind(null, ref.id)}>
                    <Button type="submit" variant="ghost" size="icon" aria-label={t('references.remove')}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {references.length < 2 && (
            <p className="text-sm text-secondary-foreground">{t('references.min')}</p>
          )}

          <AddReferenceForm />
        </CardContent>
      </Card>
    </div>
  );
}
