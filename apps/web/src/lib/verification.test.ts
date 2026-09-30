import { describe, it, expect } from 'vitest';
import { verificationBlockReason } from './verification';

const ok = {
  acceptedDocTypes: ['ID_FRONT', 'SELFIE_WITH_ID'],
  references: [
    { outcome: 'positive', relation: 'parent_employer' },
    { outcome: 'positive', relation: 'other' },
  ],
  meetingDateProvided: true,
};

describe('verificationBlockReason (spec 5.4 gate)', () => {
  it('passes when all preconditions are met', () => {
    expect(verificationBlockReason(ok)).toBeNull();
  });

  it('blocks without ID front + selfie accepted', () => {
    expect(verificationBlockReason({ ...ok, acceptedDocTypes: ['ID_FRONT'] })).toBe(
      'missing_id_or_selfie',
    );
  });

  it('blocks without 2 positive references', () => {
    expect(
      verificationBlockReason({
        ...ok,
        references: [{ outcome: 'positive', relation: 'parent_employer' }],
      }),
    ).toBe('need_two_positive_refs');
    // A non-positive outcome does not count.
    expect(
      verificationBlockReason({
        ...ok,
        references: [
          { outcome: 'positive', relation: 'parent_employer' },
          { outcome: 'no_answer', relation: 'other' },
        ],
      }),
    ).toBe('need_two_positive_refs');
  });

  it('blocks without a parent-employer positive reference', () => {
    expect(
      verificationBlockReason({
        ...ok,
        references: [
          { outcome: 'positive', relation: 'other' },
          { outcome: 'positive', relation: 'other' },
        ],
      }),
    ).toBe('need_parent_employer_ref');
  });

  it('blocks without a meeting date', () => {
    expect(verificationBlockReason({ ...ok, meetingDateProvided: false })).toBe('need_meeting_date');
  });
});
