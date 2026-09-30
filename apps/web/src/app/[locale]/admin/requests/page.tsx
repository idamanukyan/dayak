import { setRequestLocale } from 'next-intl/server';
import { prisma, RequestStatus, NannyStatus } from '@dayak/db';
import { RequestCard } from '@/components/admin/request-card';

export const dynamic = 'force-dynamic';

const COLUMNS: RequestStatus[] = [
  RequestStatus.NEW,
  RequestStatus.CONTACTED,
  RequestStatus.INTRO_SCHEDULED,
  RequestStatus.FEE_PENDING,
  RequestStatus.FEE_PAID,
  RequestStatus.ACTIVE,
  RequestStatus.COMPLETED,
];

export default async function AdminRequests({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [requests, backupNannies] = await Promise.all([
    prisma.matchRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { include: { user: { select: { name: true } } } },
        nanny: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.nannyProfile.findMany({
      where: { status: NannyStatus.VERIFIED, backupWilling: true },
      select: { id: true, district: true, user: { select: { name: true } } },
    }),
  ]);

  const backupOptions = backupNannies.map((n) => ({
    id: n.id,
    label: `${n.user.name} (${n.district})`,
  }));

  const byStatus = (s: RequestStatus) => requests.filter((r) => r.status === s);
  const otherStatuses = requests.filter((r) => !COLUMNS.includes(r.status));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Match requests</h1>
        <p className="text-sm text-muted-foreground">{requests.length} total · drag work through the pipeline.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const items = byStatus(status);
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                <span>{status.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">{items.length}</span>
              </div>
              {items.map((r) => (
                <RequestCard
                  key={r.id}
                  id={r.id}
                  status={r.status}
                  parentName={r.parent.user.name}
                  nannyName={r.nanny?.user.name ?? null}
                  schedule={r.schedule}
                  startWhen={r.startWhen}
                  backupImportance={r.backupImportance}
                  feeRef={r.feeRef}
                  backupOptions={backupOptions}
                />
              ))}
            </div>
          );
        })}

        {otherStatuses.length > 0 && (
          <div className="flex w-72 shrink-0 flex-col gap-3">
            <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">Other</div>
            {otherStatuses.map((r) => (
              <RequestCard
                key={r.id}
                id={r.id}
                status={r.status}
                parentName={r.parent.user.name}
                nannyName={r.nanny?.user.name ?? null}
                schedule={r.schedule}
                startWhen={r.startWhen}
                backupImportance={r.backupImportance}
                feeRef={r.feeRef}
                backupOptions={backupOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
