import { prisma } from '@dayak/db';
import { sendEmail, sendTelegram, firstName } from './dispatch';
import * as tpl from './templates';

export * from './templates';
export { sendEmail, sendTelegram } from './dispatch';

/**
 * Table-driven notifications (spec 5.6): each event resolves recipients + channels
 * + localized content, then dispatches. Every function is fire-and-forget safe —
 * failures are logged, never thrown to the caller.
 */

const adminChat = () => process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyNannyVerified(nannyId: string): Promise<void> {
  const nanny = await prisma.nannyProfile.findUnique({
    where: { id: nannyId },
    select: { user: { select: { name: true, email: true, telegramId: true, locale: true } } },
  });
  if (!nanny) return;
  const { name, email, telegramId, locale } = nanny.user;
  const content = tpl.nannyVerified(locale, firstName(name));
  await Promise.all([sendEmail(email, content), sendTelegram(telegramId, content.body)]);
}

export async function notifyNannyStatus(
  nannyId: string,
  kind: 'changes_requested' | 'rejected',
): Promise<void> {
  const nanny = await prisma.nannyProfile.findUnique({
    where: { id: nannyId },
    select: { user: { select: { name: true, email: true, telegramId: true, locale: true } } },
  });
  if (!nanny) return;
  const { name, email, telegramId, locale } = nanny.user;
  const content =
    kind === 'changes_requested'
      ? tpl.nannyChangesRequested(locale, firstName(name))
      : tpl.nannyRejected(locale, firstName(name));
  await Promise.all([sendEmail(email, content), sendTelegram(telegramId, content.body)]);
}

export async function notifyNannyUnderReview(nannyId: string): Promise<void> {
  const nanny = await prisma.nannyProfile.findUnique({
    where: { id: nannyId },
    select: { user: { select: { name: true } } },
  });
  if (!nanny) return;
  await sendTelegram(adminChat(), tpl.adminNannyUnderReview(nanny.user.name));
}

export async function notifyNewRequest(requestId: string): Promise<void> {
  const req = await prisma.matchRequest.findUnique({
    where: { id: requestId },
    select: {
      parent: { select: { user: { select: { name: true, source: true } } } },
      nanny: { select: { user: { select: { name: true } } } },
    },
  });
  if (!req) return;
  await sendTelegram(
    adminChat(),
    tpl.adminNewRequest(req.parent.user.name, req.nanny?.user.name ?? null, req.parent.user.source),
  );
}

export async function notifyRequestStatusParent(requestId: string, statusLabel: string): Promise<void> {
  const req = await prisma.matchRequest.findUnique({
    where: { id: requestId },
    select: { parent: { select: { user: { select: { email: true, telegramId: true, locale: true } } } } },
  });
  if (!req) return;
  const { email, telegramId, locale } = req.parent.user;
  const content = tpl.requestStatusForParent(locale, statusLabel);
  await Promise.all([sendEmail(email, content), sendTelegram(telegramId, content.body)]);
}
