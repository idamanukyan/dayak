import { describe, it, expect } from 'vitest';
import { nannyPublicSelect, nannyOwnSelect, nannyAdminSelect } from './serializers';

// Guards spec Section 11.2: sensitive fields must NEVER appear in non-admin selects.
const FORBIDDEN_FOR_NON_ADMIN = ['aiScore', 'aiFlags', 'aiSummary', 'rejectionReason'] as const;

describe('nanny serializers privacy allowlist', () => {
  it('public select never exposes sensitive fields or contact data', () => {
    for (const field of FORBIDDEN_FOR_NON_ADMIN) {
      expect(field in nannyPublicSelect).toBe(false);
    }
    // Public card must not select raw lat/lng (only jittered public coords).
    expect('lat' in nannyPublicSelect).toBe(false);
    expect('lng' in nannyPublicSelect).toBe(false);
    expect(nannyPublicSelect.publicLat).toBe(true);
  });

  it('nanny-own select never exposes AI internals', () => {
    for (const field of FORBIDDEN_FOR_NON_ADMIN) {
      expect(field in nannyOwnSelect).toBe(false);
    }
  });

  it('admin select DOES expose AI internals', () => {
    expect(nannyAdminSelect.aiScore).toBe(true);
    expect(nannyAdminSelect.aiFlags).toBe(true);
    expect(nannyAdminSelect.aiSummary).toBe(true);
  });

  it('serializer shapes are stable (snapshot)', () => {
    expect({
      public: Object.keys(nannyPublicSelect).sort(),
      own: Object.keys(nannyOwnSelect).sort(),
      admin: Object.keys(nannyAdminSelect).sort(),
    }).toMatchSnapshot();
  });
});
