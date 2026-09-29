import 'server-only';
import { prisma, NannyStatus, Locale } from '@dayak/db';
import { assertTransition, canTransition } from '@dayak/db/nannyStatus';
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

/** Explicit: nanny starts the interview (REGISTERED -> INTERVIEW_IN_PROGRESS). */
export async function startInterview(nannyId: string, actorId: string) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  if (nanny.status !== NannyStatus.REGISTERED) return nanny.status;
  await changeStatus(nannyId, nanny.status, NannyStatus.INTERVIEW_IN_PROGRESS, actorId);
  return NannyStatus.INTERVIEW_IN_PROGRESS;
}

/**
 * Placeholder for Phase 2's real AI interview: records a completed Interview and
 * advances INTERVIEW_IN_PROGRESS -> INTERVIEW_DONE -> DOCS_PENDING. Phase 2
 * replaces the body with the streaming chat + finish_interview tool call.
 */
export async function completeInterviewPlaceholder(
  nannyId: string,
  actorId: string,
  locale: Locale,
) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  if (nanny.status !== NannyStatus.INTERVIEW_IN_PROGRESS) return nanny.status;

  await prisma.interview.create({
    data: {
      nannyId,
      locale,
      model: 'placeholder-phase1',
      completedAt: new Date(),
      transcript: [],
    },
  });
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
