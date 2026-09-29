/**
 * Client-safe enum value lists. Mirrors the Prisma enums but imports nothing
 * from @dayak/db (which pulls in PrismaClient and must never reach the browser).
 * Kept in sync with packages/db/prisma/schema.prisma.
 */
export const DISTRICTS = [
  'KENTRON',
  'ARABKIR',
  'KANAKER_ZEYTUN',
  'AJAPNYAK',
  'DAVTASHEN',
  'NOR_NORK',
  'EREBUNI',
  'SHENGAVIT',
  'MALATIA_SEBASTIA',
  'AVAN',
  'NUBARASHEN',
  'NORK_MARASH',
  'OTHER',
] as const;

export const LANGUAGES = ['HY', 'RU', 'EN'] as const;

export const SCHEDULES = ['FULL_DAY', 'HALF_DAY', 'EVENINGS', 'WEEKENDS'] as const;

export const AGE_GROUPS = ['0-1', '1-3', '3-6', '6+'] as const;

export const NANNY_STATUS = {
  REGISTERED: 'REGISTERED',
  INTERVIEW_IN_PROGRESS: 'INTERVIEW_IN_PROGRESS',
  INTERVIEW_DONE: 'INTERVIEW_DONE',
  DOCS_PENDING: 'DOCS_PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const REQUIRED_DOC_TYPE_VALUES = ['ID_FRONT', 'ID_BACK', 'SELFIE_WITH_ID'] as const;
export const OPTIONAL_DOC_TYPE_VALUES = ['REFERENCE_LETTER', 'CERTIFICATE'] as const;
