import 'server-only';
import { prisma, NannyStatus, RequestStatus } from '@dayak/db';

const FEE_PAID_OR_LATER: RequestStatus[] = [
  RequestStatus.FEE_PAID,
  RequestStatus.TRIAL_SCHEDULED,
  RequestStatus.ACTIVE,
  RequestStatus.COMPLETED,
];

const POST_INTERVIEW: NannyStatus[] = [
  NannyStatus.INTERVIEW_DONE,
  NannyStatus.DOCS_PENDING,
  NannyStatus.UNDER_REVIEW,
  NannyStatus.CHANGES_REQUESTED,
  NannyStatus.VERIFIED,
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export interface Metrics {
  nannyStatus: Record<string, number>;
  funnel: { registered: number; interviewed: number; underReview: number; verified: number };
  requestsByStatus: Record<string, number>;
  totalRequests: number;
  feePaidConversionPct: number;
  backupEvents: number;
  medianHoursNewToContacted: number | null;
  sourceSplit: Record<string, number>;
}

export async function getMetrics(): Promise<Metrics> {
  const [nannyGroups, requestGroups, backupEvents, totalNannies, totalRequests] = await Promise.all([
    prisma.nannyProfile.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.matchRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.requestEvent.count({ where: { type: 'backup_assigned' } }),
    prisma.nannyProfile.count(),
    prisma.matchRequest.count(),
  ]);

  const nannyStatus: Record<string, number> = {};
  for (const g of nannyGroups) nannyStatus[g.status] = g._count._all;

  const requestsByStatus: Record<string, number> = {};
  for (const g of requestGroups) requestsByStatus[g.status] = g._count._all;

  const interviewed = POST_INTERVIEW.reduce((n, s) => n + (nannyStatus[s] ?? 0), 0);
  const underReview =
    (nannyStatus[NannyStatus.UNDER_REVIEW] ?? 0) + (nannyStatus[NannyStatus.CHANGES_REQUESTED] ?? 0);
  const verified = nannyStatus[NannyStatus.VERIFIED] ?? 0;

  const feePaid = FEE_PAID_OR_LATER.reduce((n, s) => n + (requestsByStatus[s] ?? 0), 0);
  const feePaidConversionPct = totalRequests ? Math.round((feePaid / totalRequests) * 100) : 0;

  // Median hours from request creation to the first "contacted" status change.
  const contactedEvents = await prisma.requestEvent.findMany({
    where: { type: 'status_change' },
    select: { requestId: true, createdAt: true, payload: true, request: { select: { createdAt: true } } },
  });
  const deltas: number[] = [];
  const seen = new Set<string>();
  for (const e of contactedEvents) {
    const to = (e.payload as { to?: string } | null)?.to;
    if (to !== RequestStatus.CONTACTED || seen.has(e.requestId)) continue;
    seen.add(e.requestId);
    deltas.push((e.createdAt.getTime() - e.request.createdAt.getTime()) / 3_600_000);
  }
  const medianHoursNewToContacted = median(deltas);

  const sources = await prisma.user.groupBy({
    by: ['source'],
    where: { role: 'PARENT' },
    _count: { _all: true },
  });
  const sourceSplit: Record<string, number> = {};
  for (const s of sources) sourceSplit[s.source ?? 'direct'] = s._count._all;

  return {
    nannyStatus,
    funnel: { registered: totalNannies, interviewed, underReview, verified },
    requestsByStatus,
    totalRequests,
    feePaidConversionPct,
    backupEvents,
    medianHoursNewToContacted,
    sourceSplit,
  };
}
