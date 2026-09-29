import { NannyStatus } from '@prisma/client';

/**
 * Server-enforced nanny status machine (spec Section 5.1).
 *
 * REGISTERED → INTERVIEW_IN_PROGRESS → INTERVIEW_DONE → DOCS_PENDING → UNDER_REVIEW
 * UNDER_REVIEW → VERIFIED | REJECTED | CHANGES_REQUESTED
 * CHANGES_REQUESTED → UNDER_REVIEW
 * VERIFIED → SUSPENDED → VERIFIED
 */
export const ALLOWED_TRANSITIONS: Record<NannyStatus, NannyStatus[]> = {
  [NannyStatus.REGISTERED]: [NannyStatus.INTERVIEW_IN_PROGRESS],
  [NannyStatus.INTERVIEW_IN_PROGRESS]: [NannyStatus.INTERVIEW_DONE],
  [NannyStatus.INTERVIEW_DONE]: [NannyStatus.DOCS_PENDING],
  [NannyStatus.DOCS_PENDING]: [NannyStatus.UNDER_REVIEW],
  [NannyStatus.UNDER_REVIEW]: [
    NannyStatus.VERIFIED,
    NannyStatus.REJECTED,
    NannyStatus.CHANGES_REQUESTED,
  ],
  [NannyStatus.CHANGES_REQUESTED]: [NannyStatus.UNDER_REVIEW],
  [NannyStatus.VERIFIED]: [NannyStatus.SUSPENDED],
  [NannyStatus.REJECTED]: [],
  [NannyStatus.SUSPENDED]: [NannyStatus.VERIFIED],
};

export function canTransition(from: NannyStatus, to: NannyStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: NannyStatus,
    public readonly to: NannyStatus,
  ) {
    super(`Invalid nanny status transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Throws InvalidTransitionError if the transition is not allowed. */
export function assertTransition(from: NannyStatus, to: NannyStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
