import 'server-only';
import { prisma, NannyStatus, RequestStatus, type Prisma } from '@dayak/db';
import type { Actor } from '@dayak/db/policy';
import { canParentSeeNannyContact } from '@dayak/db/policy';
import {
  firstName,
  ageRange,
  distanceSq,
  districtCentroid,
  type NannyFilters,
} from '@/lib/nanny-search';

export interface NannyCard {
  id: string;
  firstName: string;
  avatarKey: string | null;
  district: string;
  languages: string[];
  schedules: string[];
  experienceYears: number | null;
  ageRange: string | null;
  publicSummary: string | null;
  backupWilling: boolean;
  rateHourAmd: number | null;
  rateMonthAmd: number | null;
  publicLat: number | null;
  publicLng: number | null;
}

const publicSelect = {
  id: true,
  district: true,
  birthYear: true,
  languages: true,
  schedules: true,
  experienceYears: true,
  publicSummary: true,
  backupWilling: true,
  rateHourAmd: true,
  rateMonthAmd: true,
  publicLat: true,
  publicLng: true,
  verifiedAt: true,
  user: { select: { name: true, avatarKey: true } },
} satisfies Prisma.NannyProfileSelect;

function toCard(n: Prisma.NannyProfileGetPayload<{ select: typeof publicSelect }>): NannyCard {
  return {
    id: n.id,
    firstName: firstName(n.user.name),
    avatarKey: n.user.avatarKey,
    district: n.district,
    languages: n.languages,
    schedules: n.schedules,
    experienceYears: n.experienceYears,
    ageRange: ageRange(n.birthYear),
    publicSummary: n.publicSummary,
    backupWilling: n.backupWilling,
    rateHourAmd: n.rateHourAmd,
    rateMonthAmd: n.rateMonthAmd,
    publicLat: n.publicLat,
    publicLng: n.publicLng,
  };
}

/** VERIFIED nannies matching the filters, sorted by distance to the parent's district then recency. */
export async function searchVerifiedNannies(
  filters: NannyFilters,
  parentDistrict?: string | null,
): Promise<NannyCard[]> {
  const where: Prisma.NannyProfileWhereInput = { status: NannyStatus.VERIFIED };
  if (filters.districts.length) where.district = { in: filters.districts as never };
  if (filters.schedule) where.schedules = { has: filters.schedule as never };
  if (filters.language) where.languages = { has: filters.language as never };
  if (filters.ageGroup) where.ageGroups = { has: filters.ageGroup };
  if (filters.backupWilling) where.backupWilling = true;
  if (filters.rateMin || filters.rateMax) {
    where.rateHourAmd = {
      ...(filters.rateMin ? { gte: filters.rateMin } : {}),
      ...(filters.rateMax ? { lte: filters.rateMax } : {}),
    };
  }

  const rows = await prisma.nannyProfile.findMany({
    where,
    select: publicSelect,
    orderBy: { verifiedAt: 'desc' },
  });

  const origin = parentDistrict ? districtCentroid(parentDistrict) : null;
  const cards = rows.map((r) => ({ card: toCard(r), lat: r.publicLat, lng: r.publicLng }));

  if (origin) {
    cards.sort((a, b) => {
      const da = a.lat != null && a.lng != null ? distanceSq(origin, [a.lat, a.lng]) : Infinity;
      const db = b.lat != null && b.lng != null ? distanceSq(origin, [b.lat, b.lng]) : Infinity;
      return da - db;
    });
  }
  return cards.map((c) => c.card);
}

const REVEAL_STATUSES: RequestStatus[] = [
  RequestStatus.FEE_PAID,
  RequestStatus.TRIAL_SCHEDULED,
  RequestStatus.ACTIVE,
  RequestStatus.COMPLETED,
];

export interface PublicNannyProfile {
  card: NannyCard;
  /** Full name + phone, ONLY present once a FEE_PAID request links this parent & nanny. */
  contact: { fullName: string; phone: string | null } | null;
}

/** Public profile of a VERIFIED nanny; contact revealed only per spec 4/11.4. */
export async function getPublicNannyProfile(
  id: string,
  actor: Actor | null,
): Promise<PublicNannyProfile | null> {
  const nanny = await prisma.nannyProfile.findFirst({
    where: { id, status: { in: [NannyStatus.VERIFIED, NannyStatus.SUSPENDED] } },
    select: { ...publicSelect, user: { select: { name: true, avatarKey: true, phone: true } } },
  });
  if (!nanny) return null;

  const card = toCard(nanny);

  // Determine whether this viewer may see contact details.
  let requestStatus: RequestStatus | null = null;
  if (actor?.role === 'PARENT') {
    const parent = await prisma.parentProfile.findUnique({ where: { userId: actor.id } });
    if (parent) {
      const req = await prisma.matchRequest.findFirst({
        where: { parentId: parent.id, nannyId: id, status: { in: REVEAL_STATUSES } },
        select: { status: true },
      });
      requestStatus = req?.status ?? null;
    }
  }

  const contact = canParentSeeNannyContact(actor, { requestStatus })
    ? { fullName: nanny.user.name, phone: nanny.user.phone }
    : null;

  return { card, contact };
}
