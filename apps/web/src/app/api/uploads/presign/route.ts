import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DocType } from '@dayak/db';
import { requireOrCreateNanny, UnauthorizedError } from '@/lib/session';
import { validatePresignRequest, buildDocKey, type AllowedMime } from '@/lib/uploads';
import { ensureBucket, presignPut, PRESIGN_TTL_SECONDS } from '@/lib/s3';
import { rateLimit, LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  docType: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
});

export async function POST(req: Request) {
  let nannyId: string;
  try {
    ({
      nanny: { id: nannyId },
    } = await requireOrCreateNanny());
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    throw e;
  }

  // Rate limit: 20 presigns / hour per nanny (spec 11.7).
  const rl = rateLimit(`presign:${nannyId}`, LIMITS.presign.limit, LIMITS.presign.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { docType, mime, sizeBytes } = parsed.data;
  const check = validatePresignRequest(docType, mime, sizeBytes);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  await ensureBucket();
  const key = buildDocKey(nannyId, docType as DocType, mime as AllowedMime, randomUUID());
  const url = await presignPut(key, mime);

  return NextResponse.json({ url, key, expiresIn: PRESIGN_TTL_SECONDS });
}
