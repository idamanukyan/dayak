import { describe, it, expect } from 'vitest';
import { DocType } from '@dayak/db';
import {
  validatePresignRequest,
  buildDocKey,
  thumbKeyFor,
  MAX_UPLOAD_BYTES,
  isAllowedMime,
} from './uploads';

describe('validatePresignRequest', () => {
  it('accepts a valid image within size', () => {
    expect(validatePresignRequest(DocType.ID_FRONT, 'image/jpeg', 1024)).toEqual({ ok: true });
  });
  it('rejects an unknown doc type', () => {
    expect(validatePresignRequest('NOPE', 'image/jpeg', 1024)).toEqual({
      ok: false,
      error: 'bad_doctype',
    });
  });
  it('rejects a disallowed mime', () => {
    expect(validatePresignRequest(DocType.ID_FRONT, 'application/zip', 1024)).toEqual({
      ok: false,
      error: 'bad_mime',
    });
  });
  it('rejects files over the size limit or empty', () => {
    expect(validatePresignRequest(DocType.ID_FRONT, 'image/png', MAX_UPLOAD_BYTES + 1).error).toBe(
      'too_large',
    );
    expect(validatePresignRequest(DocType.ID_FRONT, 'image/png', 0).error).toBe('too_large');
  });
});

describe('buildDocKey', () => {
  it('builds nannies/{id}/{docType}/{uuid}.{ext}', () => {
    const key = buildDocKey('nanny123', DocType.SELFIE_WITH_ID, 'image/png', 'uuid-1');
    expect(key).toBe('nannies/nanny123/SELFIE_WITH_ID/uuid-1.png');
    expect(thumbKeyFor(key)).toBe('nannies/nanny123/SELFIE_WITH_ID/uuid-1.png.thumb.jpg');
  });
});

describe('isAllowedMime', () => {
  it('allows the documented mime types only', () => {
    expect(isAllowedMime('application/pdf')).toBe(true);
    expect(isAllowedMime('image/gif')).toBe(false);
  });
});
