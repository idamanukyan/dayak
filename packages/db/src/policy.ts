import { Role, RequestStatus } from '@prisma/client';

/**
 * Central authorisation policy (spec Section 4). Every server action and route
 * handler MUST call the relevant function here instead of re-deriving rules.
 */
export interface Actor {
  id: string;
  role: Role;
}

interface DocumentRef {
  nannyUserId: string;
}

/** Documents (ID images/selfies) are viewable only by ADMIN (audited) or the owning nanny (list only). */
export function canViewDocument(actor: Actor | null, doc: DocumentRef): boolean {
  if (!actor) return false;
  if (actor.role === Role.ADMIN) return true;
  if (actor.role === Role.NANNY && actor.id === doc.nannyUserId) return true;
  return false;
}

/** Only ADMIN may see aiScore / aiFlags / aiSummary (never nanny, never parent). */
export function canViewAiInternals(actor: Actor | null): boolean {
  return actor?.role === Role.ADMIN;
}

interface PhoneRevealContext {
  /** status of the MatchRequest linking this parent and nanny, if any */
  requestStatus?: RequestStatus | null;
}

const FEE_PAID_OR_LATER: RequestStatus[] = [
  RequestStatus.FEE_PAID,
  RequestStatus.TRIAL_SCHEDULED,
  RequestStatus.ACTIVE,
  RequestStatus.COMPLETED,
];

/** Parent sees a nanny's phone/surname only after FEE_PAID on a request with that nanny. */
export function canParentSeeNannyContact(
  actor: Actor | null,
  ctx: PhoneRevealContext,
): boolean {
  if (!actor) return false;
  if (actor.role === Role.ADMIN) return true;
  if (actor.role !== Role.PARENT) return false;
  return !!ctx.requestStatus && FEE_PAID_OR_LATER.includes(ctx.requestStatus);
}

/** Nanny sees a parent's phone only after FEE_PAID. Symmetric to the above. */
export function canNannySeeParentContact(
  actor: Actor | null,
  ctx: PhoneRevealContext,
): boolean {
  if (!actor) return false;
  if (actor.role === Role.ADMIN) return true;
  if (actor.role !== Role.NANNY) return false;
  return !!ctx.requestStatus && FEE_PAID_OR_LATER.includes(ctx.requestStatus);
}

export function isAdmin(actor: Actor | null): boolean {
  return actor?.role === Role.ADMIN;
}
