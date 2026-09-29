import type { Prisma } from '@prisma/client';

/**
 * Prisma `select` allowlists per role (spec Section 11.2). Sensitive fields
 * (aiScore, aiFlags, aiSummary, rejectionReason free text, Reference.notes) are
 * NEVER included in non-admin selects. A snapshot test guards these shapes.
 */

/** Public nanny card — visitors, parents, other nannies. VERIFIED only, no contact data. */
export const nannyPublicSelect = {
  id: true,
  status: true,
  district: true,
  publicLat: true,
  publicLng: true,
  languages: true,
  experienceYears: true,
  ageGroups: true,
  schedules: true,
  rateHourAmd: true,
  rateMonthAmd: true,
  backupWilling: true,
  publicSummary: true,
  verifiedAt: true,
  user: {
    select: {
      name: true, // first name is derived in the UI; surname withheld until FEE_PAID
      avatarKey: true,
    },
  },
} satisfies Prisma.NannyProfileSelect;

/** Nanny viewing her OWN profile — everything editable, but NOT aiScore/aiFlags/aiSummary. */
export const nannyOwnSelect = {
  id: true,
  status: true,
  birthYear: true,
  district: true,
  languages: true,
  experienceYears: true,
  ageGroups: true,
  schedules: true,
  rateHourAmd: true,
  rateMonthAmd: true,
  backupWilling: true,
  bio: true,
  publicSummary: true,
  availability: true,
  verifiedAt: true,
  // rejectionReason free text is withheld; the UI shows only a category (spec 5.4)
  documents: { select: { id: true, type: true, status: true, uploadedAt: true } },
  references: { select: { id: true, name: true, relation: true } },
} satisfies Prisma.NannyProfileSelect;

/** Admin sees everything, including AI internals. */
export const nannyAdminSelect = {
  id: true,
  userId: true,
  status: true,
  birthYear: true,
  district: true,
  lat: true,
  lng: true,
  publicLat: true,
  publicLng: true,
  languages: true,
  experienceYears: true,
  ageGroups: true,
  schedules: true,
  rateHourAmd: true,
  rateMonthAmd: true,
  backupWilling: true,
  bio: true,
  aiSummary: true,
  publicSummary: true,
  aiScore: true,
  aiFlags: true,
  verifiedAt: true,
  verifiedById: true,
  rejectionReason: true,
  availability: true,
  user: { select: { id: true, name: true, email: true, phone: true, locale: true } },
} satisfies Prisma.NannyProfileSelect;
