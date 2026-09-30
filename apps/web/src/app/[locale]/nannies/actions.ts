'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma, Schedule, RequestStatus } from '@dayak/db';
import { notifyNewRequest } from '@dayak/notifications';
import { requireOrCreateParent, UnauthorizedError } from '@/lib/session';

export type RequestActionState = { ok?: boolean; error?: string } | undefined;

const requestSchema = z.object({
  nannyId: z.string().optional(),
  schedule: z.nativeEnum(Schedule),
  startWhen: z.enum(['this_week', '2_weeks', 'month', 'browsing']),
  backupImportance: z.enum(['very', 'nice', 'no']),
  message: z.string().max(1000).optional(),
});

export async function createMatchRequestAction(
  input: z.infer<typeof requestSchema>,
): Promise<RequestActionState> {
  let parentId: string;
  try {
    ({
      parent: { id: parentId },
    } = await requireOrCreateParent());
  } catch (e) {
    if (e instanceof UnauthorizedError) return { error: 'login_required' };
    throw e;
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const { nannyId, schedule, startWhen, backupImportance, message } = parsed.data;

  // If a nanny is targeted, confirm she is a real VERIFIED nanny.
  if (nannyId) {
    const nanny = await prisma.nannyProfile.findUnique({ where: { id: nannyId }, select: { id: true } });
    if (!nanny) return { error: 'invalid' };
  }

  const created = await prisma.matchRequest.create({
    data: {
      parentId,
      nannyId: nannyId ?? null,
      status: RequestStatus.NEW,
      schedule,
      startWhen,
      backupImportance,
      message: message || null,
    },
  });
  await prisma.requestEvent.create({
    data: { requestId: created.id, actorId: parentId, type: 'status_change', payload: { to: RequestStatus.NEW } },
  });
  await notifyNewRequest(created.id); // admin group

  revalidatePath('/[locale]/dashboard', 'layout');
  return { ok: true };
}

export async function toggleFavouriteAction(nannyId: string): Promise<{ favourited: boolean } | { error: string }> {
  let parentId: string;
  try {
    ({
      parent: { id: parentId },
    } = await requireOrCreateParent());
  } catch (e) {
    if (e instanceof UnauthorizedError) return { error: 'login_required' };
    throw e;
  }

  const existing = await prisma.favourite.findUnique({
    where: { parentId_nannyId: { parentId, nannyId } },
  });
  if (existing) {
    await prisma.favourite.delete({ where: { parentId_nannyId: { parentId, nannyId } } });
    revalidatePath('/[locale]/dashboard', 'layout');
    return { favourited: false };
  }
  await prisma.favourite.create({ data: { parentId, nannyId } });
  revalidatePath('/[locale]/dashboard', 'layout');
  return { favourited: true };
}
