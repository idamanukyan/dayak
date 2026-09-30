/** Pure, client-safe helpers for the public nanny search/cards. No @dayak/db import. */
import { DISTRICT_CENTROIDS } from './districts';

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** Approximate age band from birth year, e.g. "40s". Null when unknown. */
export function ageRange(birthYear: number | null | undefined, now = 2026): string | null {
  if (!birthYear) return null;
  const age = now - birthYear;
  if (age < 18 || age > 90) return null;
  const band = Math.floor(age / 10) * 10;
  return `${band}s`;
}

export interface NannyFilters {
  districts: string[];
  schedule?: string;
  language?: string;
  ageGroup?: string;
  backupWilling: boolean;
  rateMin?: number;
  rateMax?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(params: RawParams): NannyFilters {
  const districtsRaw = params.district;
  const districts = (Array.isArray(districtsRaw) ? districtsRaw : districtsRaw ? [districtsRaw] : [])
    .flatMap((d) => d.split(','))
    .filter(Boolean);
  const rateMin = Number(first(params.rateMin));
  const rateMax = Number(first(params.rateMax));
  return {
    districts,
    schedule: first(params.schedule) || undefined,
    language: first(params.language) || undefined,
    ageGroup: first(params.age) || undefined,
    backupWilling: first(params.backup) === '1',
    rateMin: Number.isFinite(rateMin) && rateMin > 0 ? rateMin : undefined,
    rateMax: Number.isFinite(rateMax) && rateMax > 0 ? rateMax : undefined,
  };
}

/** Squared distance (no sqrt needed for sorting) between two lat/lng points. */
export function distanceSq(a: [number, number], b: [number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

export function districtCentroid(district: string): [number, number] {
  return DISTRICT_CENTROIDS[district] ?? DISTRICT_CENTROIDS.KENTRON!;
}
