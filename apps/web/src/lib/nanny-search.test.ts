import { describe, it, expect } from 'vitest';
import { firstName, ageRange, parseFilters, distanceSq } from './nanny-search';

describe('firstName', () => {
  it('takes the first token', () => {
    expect(firstName('Անահիտ Գրիգորյան')).toBe('Անահիտ');
    expect(firstName('Marina')).toBe('Marina');
  });
});

describe('ageRange', () => {
  it('bands to the decade', () => {
    expect(ageRange(1980, 2026)).toBe('40s');
    expect(ageRange(1995, 2026)).toBe('30s');
  });
  it('returns null for unknown or implausible', () => {
    expect(ageRange(null)).toBeNull();
    expect(ageRange(1800, 2026)).toBeNull();
  });
});

describe('parseFilters', () => {
  it('parses districts (comma + repeated), toggles, and rates', () => {
    const f = parseFilters({
      district: 'ARABKIR,KENTRON',
      schedule: 'FULL_DAY',
      language: 'RU',
      age: '1-3',
      backup: '1',
      rateMin: '1000',
      rateMax: '2000',
    });
    expect(f.districts).toEqual(['ARABKIR', 'KENTRON']);
    expect(f.schedule).toBe('FULL_DAY');
    expect(f.language).toBe('RU');
    expect(f.ageGroup).toBe('1-3');
    expect(f.backupWilling).toBe(true);
    expect(f.rateMin).toBe(1000);
    expect(f.rateMax).toBe(2000);
  });

  it('defaults empty', () => {
    const f = parseFilters({});
    expect(f.districts).toEqual([]);
    expect(f.backupWilling).toBe(false);
    expect(f.rateMin).toBeUndefined();
  });
});

describe('distanceSq', () => {
  it('is zero for identical points and grows with distance', () => {
    expect(distanceSq([40.18, 44.51], [40.18, 44.51])).toBe(0);
    expect(distanceSq([40.18, 44.51], [40.2, 44.51])).toBeGreaterThan(0);
  });
});
