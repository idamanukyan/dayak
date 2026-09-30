import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { prisma, DocStatus, type DocType } from '@dayak/db';
import { verificationBlockReason } from '@/lib/verification';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminActionBar } from '@/components/admin/action-bar';
import { DocumentReview } from '@/components/admin/document-review';
import { ReferenceLog } from '@/components/admin/reference-log';

export const dynamic = 'force-dynamic';

interface TranscriptTurn {
  role: 'assistant' | 'user';
  content: string;
}

export default async function AdminNannyDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const nanny = await prisma.nannyProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, locale: true } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      references: { orderBy: { id: 'asc' } },
      interviews: { orderBy: { startedAt: 'desc' }, take: 1 },
    },
  });
  if (!nanny) notFound();

  const acceptedDocTypes = nanny.documents
    .filter((d) => d.status === DocStatus.ACCEPTED)
    .map((d) => d.type as DocType);

  // Block reason ignoring the meeting date (the Verify form collects that).
  const verifyBlock = verificationBlockReason({
    acceptedDocTypes,
    references: nanny.references.map((r) => ({ outcome: r.outcome, relation: r.relation })),
    meetingDateProvided: true,
  });

  const interview = nanny.interviews[0];
  const transcript = (interview?.transcript as unknown as TranscriptTurn[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Queue
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{nanny.user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {nanny.district} · {nanny.user.email} · <Badge variant="primary">{nanny.status}</Badge>
          </p>
        </div>
      </div>

      <AdminActionBar nannyId={nanny.id} status={nanny.status} verifyBlockReason={verifyBlock} />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            <Row label="Experience" value={nanny.experienceYears != null ? `${nanny.experienceYears} yrs` : '—'} />
            <Row label="Birth year" value={nanny.birthYear ?? '—'} />
            <Row label="Languages" value={nanny.languages.join(', ') || '—'} />
            <Row label="Age groups" value={nanny.ageGroups.join(', ') || '—'} />
            <Row label="Schedules" value={nanny.schedules.join(', ') || '—'} />
            <Row label="Rate/hr" value={nanny.rateHourAmd ? `${nanny.rateHourAmd} ֏` : '—'} />
            <Row label="Rate/mo" value={nanny.rateMonthAmd ? `${nanny.rateMonthAmd} ֏` : '—'} />
            <Row label="Backup" value={nanny.backupWilling ? 'Yes' : 'No'} />
            <Row label="Phone" value={nanny.user.phone ?? '—'} />
            {nanny.bio && <p className="mt-2 rounded-lg bg-muted p-2 text-muted-foreground">{nanny.bio}</p>}
          </CardContent>
        </Card>

        {/* Interview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">AI score</span>
              <Badge variant="verified">{nanny.aiScore ?? '—'}/100</Badge>
            </div>
            {nanny.aiFlags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {nanny.aiFlags.map((f) => (
                  <Badge key={f} variant="destructive">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
            {nanny.aiSummary && (
              <div>
                <p className="mb-1 font-medium">Summary</p>
                <p className="text-muted-foreground">{nanny.aiSummary}</p>
              </div>
            )}
            <div>
              <p className="mb-1 font-medium">Transcript ({transcript.length})</p>
              <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto rounded-lg bg-muted/50 p-2">
                {transcript.length === 0 && <span className="text-muted-foreground">No transcript.</span>}
                {transcript.map((t, i) => (
                  <p key={i} className="text-xs">
                    <span className={t.role === 'assistant' ? 'font-medium text-primary' : 'font-medium'}>
                      {t.role === 'assistant' ? 'Interviewer' : 'Nanny'}:
                    </span>{' '}
                    {t.content}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentReview
              docs={nanny.documents.map((d) => ({
                id: d.id,
                type: d.type,
                status: d.status,
                mime: d.mime,
              }))}
            />
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">References</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferenceLog
              refs={nanny.references.map((r) => ({
                id: r.id,
                name: r.name,
                phone: r.phone,
                relation: r.relation,
                outcome: r.outcome,
                notes: r.notes,
                checkedAt: r.checkedAt?.toISOString() ?? null,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
