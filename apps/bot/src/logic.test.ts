import { describe, it, expect } from 'vitest';
import { parseSource } from './logic';

describe('parseSource (deep-link source)', () => {
  it('strips the src_ prefix', () => {
    expect(parseSource('src_fb1')).toBe('fb1');
    expect(parseSource('src_instagram')).toBe('instagram');
  });
  it('keeps a bare payload', () => {
    expect(parseSource('promo2026')).toBe('promo2026');
  });
  it('returns null for empty/undefined', () => {
    expect(parseSource(undefined)).toBeNull();
    expect(parseSource('')).toBeNull();
    expect(parseSource('   ')).toBeNull();
  });
});
