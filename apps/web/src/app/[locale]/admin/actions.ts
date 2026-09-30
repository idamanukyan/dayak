'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DocStatus, RequestStatus } from '@dayak/db';
import { requireAdmin } from '@/lib/session';
import {
  verifyNanny,
  requestChanges,
  rejectNanny,
  setSuspended,
  setDocumentStatus,
  markReferenceChecked,
  VerifyBlockedError,
} from '@/server/verification';
import { setRequestStatus, markFeePaid, assignBackup } from '@/server/requests';
import { CHANGE_REASONS, REJECT_REASONS } from '@/lib/verification';

export type AdminActionState = { ok?: boolean; error?: string } | undefined;

function revalidateAdmin() {
  revalidatePath('/[locale]/admin', 'layout');
}

export async function verifyAction(nannyId: string, meetingDate: string): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!meetingDate) return { error: 'need_meeting_date' };
  try {
    await verifyNanny(nannyId, admin.id, meetingDate);
  } catch (e) {
    if (e instanceof VerifyBlockedError) return { error: e.reason };
    throw e;
  }
  revalidateAdmin();
  return { ok: true };
}

export async function requestChangesAction(
  nannyId: string,
  reasons: string[],
  note: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const valid = reasons.filter((r) => (CHANGE_REASONS as readonly string[]).includes(r));
  if (valid.length === 0) return { error: 'pick_a_reason' };
  await requestChanges(nannyId, admin.id, valid as never, note || undefined);
  revalidateAdmin();
  return { ok: true };
}

export async function rejectAction(
  nannyId: string,
  reason: string,
  note: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!(REJECT_REASONS as readonly string[]).includes(reason)) return { error: 'pick_a_reason' };
  await rejectNanny(nannyId, admin.id, reason as never, note || undefined);
  revalidateAdmin();
  return { ok: true };
}

export async function setSuspendedAction(nannyId: string, suspend: boolean): Promise<AdminActionState> {
  const admin = await requireAdmin();
  await setSuspended(nannyId, admin.id, suspend);
  revalidateAdmin();
  return { ok: true };
}

const docStatusSchema = z.enum([DocStatus.ACCEPTED, DocStatus.REJECTED, DocStatus.UPLOADED]);

export async function setDocStatusAction(
  docId: string,
  status: string,
  note: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = docStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'bad_status' };
  await setDocumentStatus(docId, admin.id, parsed.data, note || undefined);
  revalidateAdmin();
  return { ok: true };
}

const outcomeSchema = z.enum(['positive', 'negative', 'no_answer']);

export async function markRefAction(
  refId: string,
  outcome: string,
  notes: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = outcomeSchema.safeParse(outcome);
  if (!parsed.success) return { error: 'bad_outcome' };
  await markReferenceChecked(refId, admin.id, parsed.data, notes || undefined);
  revalidateAdmin();
  return { ok: true };
}

const requestStatusSchema = z.nativeEnum(RequestStatus);

export async function setRequestStatusAction(
  requestId: string,
  status: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = requestStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'bad_status' };
  await setRequestStatus(requestId, admin.id, parsed.data);
  revalidateAdmin();
  return { ok: true };
}

export async function markFeePaidAction(requestId: string, feeRef: string): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!feeRef.trim()) return { error: 'need_ref' };
  await markFeePaid(requestId, admin.id, feeRef.trim());
  revalidateAdmin();
  return { ok: true };
}

export async function assignBackupAction(
  requestId: string,
  backupNannyId: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!backupNannyId) return { error: 'need_nanny' };
  await assignBackup(requestId, admin.id, backupNannyId);
  revalidateAdmin();
  return { ok: true };
}
