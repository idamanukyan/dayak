import { describe, it, expect } from 'vitest';
import { NannyStatus } from '@prisma/client';
import { canTransition, assertTransition, InvalidTransitionError } from './nannyStatus';

describe('nanny status machine', () => {
  it('allows the happy-path onboarding transitions', () => {
    expect(canTransition(NannyStatus.REGISTERED, NannyStatus.INTERVIEW_IN_PROGRESS)).toBe(true);
    expect(canTransition(NannyStatus.INTERVIEW_IN_PROGRESS, NannyStatus.INTERVIEW_DONE)).toBe(true);
    expect(canTransition(NannyStatus.INTERVIEW_DONE, NannyStatus.DOCS_PENDING)).toBe(true);
    expect(canTransition(NannyStatus.DOCS_PENDING, NannyStatus.UNDER_REVIEW)).toBe(true);
    expect(canTransition(NannyStatus.UNDER_REVIEW, NannyStatus.VERIFIED)).toBe(true);
  });

  it('allows admin decisions and re-review loop', () => {
    expect(canTransition(NannyStatus.UNDER_REVIEW, NannyStatus.CHANGES_REQUESTED)).toBe(true);
    expect(canTransition(NannyStatus.CHANGES_REQUESTED, NannyStatus.UNDER_REVIEW)).toBe(true);
    expect(canTransition(NannyStatus.VERIFIED, NannyStatus.SUSPENDED)).toBe(true);
    expect(canTransition(NannyStatus.SUSPENDED, NannyStatus.VERIFIED)).toBe(true);
  });

  it('rejects skipping and illegal transitions', () => {
    expect(canTransition(NannyStatus.REGISTERED, NannyStatus.VERIFIED)).toBe(false);
    expect(canTransition(NannyStatus.REJECTED, NannyStatus.VERIFIED)).toBe(false);
    expect(canTransition(NannyStatus.VERIFIED, NannyStatus.REGISTERED)).toBe(false);
  });

  it('assertTransition throws on illegal transition', () => {
    expect(() => assertTransition(NannyStatus.REGISTERED, NannyStatus.VERIFIED)).toThrow(
      InvalidTransitionError,
    );
  });
});
