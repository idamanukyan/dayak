import { randomUUID } from 'node:crypto';
import { prisma } from './index';

/**
 * One-time magic-link tokens (spec Section 8). The Telegram bot mints a token for a
 * user; the web `magic` auth provider consumes it to sign them in. Backed by the
 * Auth.js VerificationToken table (identifier = userId).
 */
export async function createMagicToken(userId: string, ttlMinutes = 15): Promise<string> {
  const token = randomUUID();
  await prisma.verificationToken.create({
    data: { identifier: userId, token, expires: new Date(Date.now() + ttlMinutes * 60_000) },
  });
  return token;
}

/** Validate + consume a token. Returns the userId, or null if invalid/expired. */
export async function consumeMagicToken(token: string): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return null;
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
  if (row.expires.getTime() < Date.now()) return null;
  return row.identifier;
}
