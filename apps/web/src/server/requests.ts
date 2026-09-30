import 'server-only';
import { prisma, RequestStatus } from '@dayak/db';
import { notifyRequestStatusParent } from '@dayak/notifications';

/** Move a match request to a new status and log the transition. */
export async function setRequestStatus(requestId: string, adminId: string, status: RequestStatus) {
  const req = await prisma.matchRequest.findUniqueOrThrow({ where: { id: requestId } });
  await prisma.$transaction([
    prisma.matchRequest.update({ where: { id: requestId }, data: { status } }),
    prisma.requestEvent.create({
      data: {
        requestId,
        actorId: adminId,
        type: 'status_change',
        payload: { from: req.status, to: status },
      },
    }),
  ]);
  await notifyRequestStatusParent(requestId, status);
}

/** Mark the 5,000 AMD matching fee paid (admin types the Idram reference). */
export async function markFeePaid(requestId: string, adminId: string, feeRef: string) {
  await prisma.$transaction([
    prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.FEE_PAID, feePaidAt: new Date(), feeRef },
    }),
    prisma.requestEvent.create({
      data: { requestId, actorId: adminId, type: 'status_change', payload: { to: RequestStatus.FEE_PAID, feeRef } },
    }),
  ]);
  await notifyRequestStatusParent(requestId, RequestStatus.FEE_PAID);
}

/** Assign a same-day backup nanny; the event timestamp drives the "backup within 4h" metric. */
export async function assignBackup(requestId: string, adminId: string, backupNannyId: string) {
  await prisma.$transaction([
    prisma.matchRequest.update({ where: { id: requestId }, data: { backupNannyId } }),
    prisma.requestEvent.create({
      data: {
        requestId,
        actorId: adminId,
        type: 'backup_assigned',
        payload: { backupNannyId, at: new Date().toISOString() },
      },
    }),
  ]);
}
