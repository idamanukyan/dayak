import { DocType, NannyStatus } from '@dayak/db';

/** Minimal profile fields required before the interview step unlocks. */
export interface ProfileFacts {
  languages: unknown[];
  experienceYears: number | null;
  ageGroups: unknown[];
  schedules: unknown[];
}

export interface OnboardingInput {
  status: NannyStatus;
  profile: ProfileFacts;
  docTypesPresent: DocType[];
  referenceCount: number;
  interviewDone: boolean;
}

export interface OnboardingChecklist {
  profileComplete: boolean;
  interviewComplete: boolean;
  documentsComplete: boolean;
  referencesComplete: boolean;
  /** All gates for admin review satisfied (spec 5.1 auto-transition to UNDER_REVIEW). */
  readyForReview: boolean;
}

export function isProfileComplete(p: ProfileFacts): boolean {
  return (
    p.languages.length > 0 &&
    p.experienceYears !== null &&
    p.experienceYears !== undefined &&
    p.ageGroups.length > 0 &&
    p.schedules.length > 0
  );
}

/**
 * Auto-transition gate (spec 5.1): UNDER_REVIEW when ID_FRONT + SELFIE_WITH_ID
 * uploaded AND >= 2 references entered.
 */
export function meetsReviewGate(docTypesPresent: DocType[], referenceCount: number): boolean {
  const has = (t: DocType) => docTypesPresent.includes(t);
  return has(DocType.ID_FRONT) && has(DocType.SELFIE_WITH_ID) && referenceCount >= 2;
}

export function computeChecklist(input: OnboardingInput): OnboardingChecklist {
  const profileComplete = isProfileComplete(input.profile);
  const documentsComplete =
    input.docTypesPresent.includes(DocType.ID_FRONT) &&
    input.docTypesPresent.includes(DocType.SELFIE_WITH_ID);
  const referencesComplete = input.referenceCount >= 2;
  return {
    profileComplete,
    interviewComplete: input.interviewDone,
    documentsComplete,
    referencesComplete,
    readyForReview:
      profileComplete &&
      input.interviewDone &&
      meetsReviewGate(input.docTypesPresent, input.referenceCount),
  };
}
