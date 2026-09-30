import {
  prisma,
  Role,
  Locale,
  District,
  Schedule,
  NannyStatus,
  RequestStatus,
} from '@dayak/db';
import { createMagicToken } from '@dayak/db/magic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Deep-link source: `start=src_fb1` → "fb1" (spec Section 8). */
export function parseSource(payload: string | undefined): string | null {
  if (!payload) return null;
  const trimmed = payload.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('src_') ? trimmed.slice(4) : trimmed;
}

export interface OnboardResult {
  userId: string;
  role: Role;
  isNew: boolean;
  parentProfileId?: string;
  nannyProfileId?: string;
}

/**
 * Create (or fetch) a user from a Telegram interaction. New parents get a
 * ParentProfile; new nannies a NannyProfile(REGISTERED). Idempotent per telegramId.
 */
export async function onboardFromBot(input: {
  telegramId: bigint;
  name: string;
  role: Role;
  locale: Locale;
  source: string | null;
}): Promise<OnboardResult> {
  const existing = await prisma.user.findUnique({
    where: { telegramId: input.telegramId },
    include: { parent: true, nanny: true },
  });
  if (existing) {
    return {
      userId: existing.id,
      role: existing.role,
      isNew: false,
      parentProfileId: existing.parent?.id,
      nannyProfileId: existing.nanny?.id,
    };
  }

  if (input.role === Role.NANNY) {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        role: Role.NANNY,
        locale: input.locale,
        telegramId: input.telegramId,
        source: input.source,
        nanny: { create: { status: NannyStatus.REGISTERED, district: District.OTHER } },
      },
      include: { nanny: true },
    });
    return { userId: user.id, role: Role.NANNY, isNew: true, nannyProfileId: user.nanny!.id };
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      role: Role.PARENT,
      locale: input.locale,
      telegramId: input.telegramId,
      source: input.source,
      parent: { create: { district: District.OTHER, children: [], languages: [] } },
    },
    include: { parent: true },
  });
  return { userId: user.id, role: Role.PARENT, isNew: true, parentProfileId: user.parent!.id };
}

/** A "find me someone" request from the bot (nannyId = null), status NEW. */
export async function createBrowseRequest(parentProfileId: string): Promise<string> {
  const req = await prisma.matchRequest.create({
    data: {
      parentId: parentProfileId,
      nannyId: null,
      status: RequestStatus.NEW,
      schedule: Schedule.FULL_DAY,
      startWhen: 'browsing',
      backupImportance: 'nice',
    },
  });
  await prisma.requestEvent.create({
    data: { requestId: req.id, type: 'status_change', payload: { to: RequestStatus.NEW, via: 'telegram' } },
  });
  return req.id;
}

/** One-time magic link that signs the Telegram user in on the web. */
export async function buildMagicLink(userId: string, locale: Locale, dest: string): Promise<string> {
  const token = await createMagicToken(userId);
  const to = encodeURIComponent(`/${locale}${dest}`);
  return `${APP_URL}/${locale}/auth/magic?token=${token}&to=${to}`;
}
