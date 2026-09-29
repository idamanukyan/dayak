import { describe, it, expect } from 'vitest';
import { DocType, NannyStatus } from '@dayak/db';
import { computeChecklist, isProfileComplete, meetsReviewGate } from './onboarding';

const fullProfile = {
  languages: ['HY'],
  experienceYears: 5,
  ageGroups: ['1-3'],
  schedules: ['FULL_DAY'],
};

describe('isProfileComplete', () => {
  it('true when all required fields present', () => {
    expect(isProfileComplete(fullProfile)).toBe(true);
  });
  it('false when a list is empty or experience missing', () => {
    expect(isProfileComplete({ ...fullProfile, languages: [] })).toBe(false);
    expect(isProfileComplete({ ...fullProfile, experienceYears: null })).toBe(false);
    expect(isProfileComplete({ ...fullProfile, ageGroups: [] })).toBe(false);
    expect(isProfileComplete({ ...fullProfile, schedules: [] })).toBe(false);
  });
});

describe('meetsReviewGate', () => {
  it('needs ID_FRONT + SELFIE_WITH_ID and >= 2 references', () => {
    expect(meetsReviewGate([DocType.ID_FRONT, DocType.SELFIE_WITH_ID], 2)).toBe(true);
  });
  it('fails without the selfie', () => {
    expect(meetsReviewGate([DocType.ID_FRONT], 2)).toBe(false);
  });
  it('fails with fewer than 2 references', () => {
    expect(meetsReviewGate([DocType.ID_FRONT, DocType.SELFIE_WITH_ID], 1)).toBe(false);
  });
  it('ID_BACK alone does not satisfy the gate', () => {
    expect(meetsReviewGate([DocType.ID_FRONT, DocType.ID_BACK], 2)).toBe(false);
  });
});

describe('computeChecklist', () => {
  it('readyForReview only when profile + interview + docs + refs all done', () => {
    const c = computeChecklist({
      status: NannyStatus.DOCS_PENDING,
      profile: fullProfile,
      docTypesPresent: [DocType.ID_FRONT, DocType.SELFIE_WITH_ID],
      referenceCount: 2,
      interviewDone: true,
    });
    expect(c.readyForReview).toBe(true);
    expect(c.profileComplete && c.interviewComplete && c.documentsComplete).toBe(true);
  });

  it('not ready if the interview is not done', () => {
    const c = computeChecklist({
      status: NannyStatus.DOCS_PENDING,
      profile: fullProfile,
      docTypesPresent: [DocType.ID_FRONT, DocType.SELFIE_WITH_ID],
      referenceCount: 2,
      interviewDone: false,
    });
    expect(c.readyForReview).toBe(false);
  });
});
