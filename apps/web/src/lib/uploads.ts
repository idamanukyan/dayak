import { DocType } from '@dayak/db';

/** Upload constraints (spec Section 5.3). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf',
] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

const MIME_EXT: Record<AllowedMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

export const REQUIRED_DOC_TYPES: DocType[] = [
  DocType.ID_FRONT,
  DocType.ID_BACK,
  DocType.SELFIE_WITH_ID,
];

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

export function isAllowedDocType(value: string): value is DocType {
  return (Object.values(DocType) as string[]).includes(value);
}

/** Deterministic object key: nannies/{nannyId}/{docType}/{uuid}.{ext} */
export function buildDocKey(nannyId: string, docType: DocType, mime: AllowedMime, uuid: string) {
  return `nannies/${nannyId}/${docType}/${uuid}.${MIME_EXT[mime]}`;
}

export function thumbKeyFor(docKey: string) {
  return `${docKey}.thumb.jpg`;
}

export interface PresignValidation {
  ok: boolean;
  error?: 'bad_doctype' | 'bad_mime' | 'too_large';
}

export function validatePresignRequest(
  docType: string,
  mime: string,
  sizeBytes: number,
): PresignValidation {
  if (!isAllowedDocType(docType)) return { ok: false, error: 'bad_doctype' };
  if (!isAllowedMime(mime)) return { ok: false, error: 'bad_mime' };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES)
    return { ok: false, error: 'too_large' };
  return { ok: true };
}
