// Client-safe: no @dayak/db import (this module reaches client components via the
// reason lists). Doc types are compared as string literals.

/** Fixed reason lists (spec 5.4). Shown to admin; reject shows the category to the nanny. */
export const CHANGE_REASONS = [
  'blurry_id',
  'missing_id_back',
  'reference_unreachable',
  'selfie_unclear',
  'incomplete_profile',
] as const;

export const REJECT_REASONS = [
  'no_experience',
  'outside_yerevan',
  'negative_reference',
  'failed_identity_match',
  'other',
] as const;

export type ChangeReason = (typeof CHANGE_REASONS)[number];
export type RejectReason = (typeof REJECT_REASONS)[number];

export interface VerifyGateInput {
  acceptedDocTypes: string[];
  references: { outcome: string | null; relation: string }[];
  meetingDateProvided: boolean;
}

export type VerifyBlockReason =
  | 'missing_id_or_selfie'
  | 'need_two_positive_refs'
  | 'need_parent_employer_ref'
  | 'need_meeting_date';

/**
 * Server-enforced Verify preconditions (spec 5.4): ID_FRONT + SELFIE_WITH_ID
 * accepted, >= 2 references with outcome "positive" and >= 1 relation
 * "parent_employer", and an in-person meeting date entered. Returns the first
 * unmet reason, or null when the nanny may be verified.
 */
export function verificationBlockReason(input: VerifyGateInput): VerifyBlockReason | null {
  const has = (t: string) => input.acceptedDocTypes.includes(t);
  if (!has('ID_FRONT') || !has('SELFIE_WITH_ID')) return 'missing_id_or_selfie';

  const positive = input.references.filter((r) => r.outcome === 'positive');
  if (positive.length < 2) return 'need_two_positive_refs';
  if (!positive.some((r) => r.relation === 'parent_employer')) return 'need_parent_employer_ref';

  if (!input.meetingDateProvided) return 'need_meeting_date';
  return null;
}
