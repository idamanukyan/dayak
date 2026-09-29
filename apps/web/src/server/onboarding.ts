import 'server-only';
import { prisma, NannyStatus, Locale, type Interview } from '@dayak/db';
import { assertTransition, canTransition } from '@dayak/db/nannyStatus';
import { DEFAULT_MODEL } from '@dayak/ai';
import { meetsReviewGate } from '@/lib/onboarding';

/** Persist a status change and write the required AuditLog row (spec Section 3 rule). */
async function changeStatus(
  nannyId: string,
  from: NannyStatus,
  to: NannyStatus,
  actorId: string | null,
) {
  assertTransition(from, to);
  await prisma.$transaction([
    prisma.nannyProfile.update({ where: { id: nannyId }, data: { status: to } }),
    prisma.auditLog.create({
      data: {
        actorId,
        action: 'nanny.status_change',
        target: `nanny:${nannyId}`,
        meta: { from, to },
      },
    }),
  ]);
}

/**
 * Resume the nanny's active interview or create one, moving REGISTERED ->
 * INTERVIEW_IN_PROGRESS on first entry. Returns the interview to drive the chat.
 */
export async function getOrCreateActiveInterview(
  nannyId: string,
  actorId: string,
  locale: Locale,
): Promise<Interview> {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });

  if (nanny.status === NannyStatus.REGISTERED) {
    await changeStatus(nannyId, nanny.status, NannyStatus.INTERVIEW_IN_PROGRESS, actorId);
  }

  const existing = await prisma.interview.findFirst({
    where: { nannyId, completedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  if (existing) return existing;

  return prisma.interview.create({
    data: { nannyId, locale, model: DEFAULT_MODEL, transcript: [] },
  });
}

/** On finish_interview: advance INTERVIEW_IN_PROGRESS -> INTERVIEW_DONE -> DOCS_PENDING. */
export async function completeInterviewToDocs(nannyId: string, actorId: string) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  if (nanny.status !== NannyStatus.INTERVIEW_IN_PROGRESS) return nanny.status;
  await changeStatus(nannyId, nanny.status, NannyStatus.INTERVIEW_DONE, actorId);
  await changeStatus(nannyId, NannyStatus.INTERVIEW_DONE, NannyStatus.DOCS_PENDING, actorId);
  return NannyStatus.DOCS_PENDING;
}

/**
 * Re-evaluate the documents/references gate and auto-advance to UNDER_REVIEW.
 * Safe to call after any document register or reference change. No-op unless the
 * nanny is in DOCS_PENDING or CHANGES_REQUESTED and the gate is met.
 */
export async function recomputeReviewGate(nannyId: string, actorId: string | null) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  const advanceable =
    nanny.status === NannyStatus.DOCS_PENDING || nanny.status === NannyStatus.CHANGES_REQUESTED;
  if (!advanceable) return nanny.status;

  const [docs, referenceCount] = await Promise.all([
    prisma.document.findMany({ where: { nannyId }, select: { type: true } }),
    prisma.reference.count({ where: { nannyId } }),
  ]);
  const docTypes = docs.map((d) => d.type);

  if (meetsReviewGate(docTypes, referenceCount) && canTransition(nanny.status, NannyStatus.UNDER_REVIEW)) {
    await changeStatus(nannyId, nanny.status, NannyStatus.UNDER_REVIEW, actorId);
    return NannyStatus.UNDER_REVIEW;
  }
  return nanny.status;
}
