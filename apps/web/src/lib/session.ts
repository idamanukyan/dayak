import { prisma, Role, District, type NannyProfile } from '@dayak/db';
import type { Actor } from '@dayak/db/policy';
import { auth } from '@/auth';

/** Current actor ({id, role}) or null. */
export async function getActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/** Require an authenticated NANNY and return actor + their profile (creating a
 *  bare profile row on first access so onboarding can begin). */
export async function requireNanny(): Promise<{ actor: Actor; nanny: NannyProfile }> {
  const actor = await getActor();
  if (!actor || actor.role !== Role.NANNY) throw new UnauthorizedError();

  const nanny = await prisma.nannyProfile.findUnique({ where: { userId: actor.id } });
  if (!nanny) throw new UnauthorizedError();
  return { actor, nanny };
}

/** Require the nanny profile OR create it if this user is a NANNY without one yet. */
export async function requireOrCreateNanny(): Promise<{ actor: Actor; nanny: NannyProfile }> {
  const actor = await getActor();
  if (!actor || actor.role !== Role.NANNY) throw new UnauthorizedError();

  const nanny = await prisma.nannyProfile.upsert({
    where: { userId: actor.id },
    update: {},
    // District is required; default to OTHER until the nanny sets it in profile basics.
    create: { userId: actor.id, district: District.OTHER },
  });
  return { actor, nanny };
}
