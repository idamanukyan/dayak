import 'server-only';
import { prisma, NannyStatus, DocStatus, DocType } from '@dayak/db';
import { assertTransition } from '@dayak/db/nannyStatus';
import {
  verificationBlockReason,
  type VerifyBlockReason,
  type ChangeReason,
  type RejectReason,
} from '@/lib/verification';
import { DISTRICT_CENTROIDS, jitterCoord } from '@/lib/districts';

export class VerifyBlockedError extends Error {
  constructor(public readonly reason: VerifyBlockReason) {
    super(`verify_blocked:${reason}`);
    this.name = 'VerifyBlockedError';
  }
}

async function setStatus(
  nannyId: string,
  from: NannyStatus,
  to: NannyStatus,
  adminId: string,
  action: string,
  meta: Record<string, unknown> = {},
) {
  assertTransition(from, to);
  await prisma.$transaction([
    prisma.nannyProfile.update({ where: { id: nannyId }, data: { status: to } }),
    prisma.auditLog.create({
      data: { actorId: adminId, action, target: `nanny:${nannyId}`, meta: { from, to, ...meta } },
    }),
  ]);
}

/** Admin accepts/rejects an uploaded document. */
export async function setDocumentStatus(
  docId: string,
  adminId: string,
  status: DocStatus,
  reviewNote?: string,
) {
  const doc = await prisma.document.update({
    where: { id: docId },
    data: { status, reviewNote: reviewNote ?? null },
  });
  await prisma.auditLog.create({
    data: { actorId: adminId, action: 'document.review', target: `document:${docId}`, meta: { status } },
  });
  return doc;
}

/** Admin logs the outcome of a reference call. */
export async function markReferenceChecked(
  refId: string,
  adminId: string,
  outcome: 'positive' | 'negative' | 'no_answer',
  notes?: string,
) {
  const ref = await prisma.reference.update({
    where: { id: refId },
    data: { outcome, notes: notes ?? null, checkedAt: new Date(), checkedById: adminId },
  });
  await prisma.auditLog.create({
    data: { actorId: adminId, action: 'reference.checked', target: `reference:${refId}`, meta: { outcome } },
  });
  return ref;
}

/** Verify a nanny — enforces spec 5.4 preconditions, then publishes her public card. */
export async function verifyNanny(nannyId: string, adminId: string, meetingDate: string) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({
    where: { id: nannyId },
    include: { documents: true, references: true },
  });

  const acceptedDocTypes = nanny.documents
    .filter((d) => d.status === DocStatus.ACCEPTED)
    .map((d) => d.type as DocType);

  const block = verificationBlockReason({
    acceptedDocTypes,
    references: nanny.references.map((r) => ({ outcome: r.outcome, relation: r.relation })),
    meetingDateProvided: !!meetingDate,
  });
  if (block) throw new VerifyBlockedError(block);

  // Jitter public coordinates once, at verification (spec 11.3).
  const base: [number, number] =
    nanny.lat != null && nanny.lng != null
      ? [nanny.lat, nanny.lng]
      : (DISTRICT_CENTROIDS[nanny.district] ?? DISTRICT_CENTROIDS.KENTRON!);
  const [publicLat, publicLng] = jitterCoord(base[0], base[1]);

  assertTransition(nanny.status, NannyStatus.VERIFIED);
  await prisma.$transaction([
    prisma.nannyProfile.update({
      where: { id: nannyId },
      data: {
        status: NannyStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById: adminId,
        lat: base[0],
        lng: base[1],
        publicLat,
        publicLng,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'nanny.verify',
        target: `nanny:${nannyId}`,
        meta: { from: nanny.status, to: NannyStatus.VERIFIED, meetingDate },
      },
    }),
  ]);
  // Notification (email + Telegram) is sent by the Phase 5 worker.
}

export async function requestChanges(
  nannyId: string,
  adminId: string,
  reasons: ChangeReason[],
  note?: string,
) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  await setStatus(nannyId, nanny.status, NannyStatus.CHANGES_REQUESTED, adminId, 'nanny.request_changes', {
    reasons,
    note: note ?? null,
  });
}

export async function rejectNanny(
  nannyId: string,
  adminId: string,
  reason: RejectReason,
  note?: string,
) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  assertTransition(nanny.status, NannyStatus.REJECTED);
  await prisma.$transaction([
    prisma.nannyProfile.update({
      where: { id: nannyId },
      data: { status: NannyStatus.REJECTED, rejectionReason: reason },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'nanny.reject',
        target: `nanny:${nannyId}`,
        meta: { from: nanny.status, to: NannyStatus.REJECTED, reason, note: note ?? null },
      },
    }),
  ]);
}

export async function setSuspended(nannyId: string, adminId: string, suspend: boolean) {
  const nanny = await prisma.nannyProfile.findUniqueOrThrow({ where: { id: nannyId } });
  const to = suspend ? NannyStatus.SUSPENDED : NannyStatus.VERIFIED;
  await setStatus(nannyId, nanny.status, to, adminId, suspend ? 'nanny.suspend' : 'nanny.unsuspend');
}
