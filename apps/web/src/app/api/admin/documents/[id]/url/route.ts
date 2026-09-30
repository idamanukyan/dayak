import { NextResponse } from 'next/server';
import { prisma } from '@dayak/db';
import { requireAdmin, UnauthorizedError } from '@/lib/session';
import { presignGet, PRESIGN_TTL_SECONDS } from '@/lib/s3';
import { thumbKeyFor } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Presigned GET for a document image (spec 5.4 / 6). ADMIN only, 60 s TTL, and
 * EVERY call writes an AuditLog row (spec Section 3 rule + 11.1).
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let adminId: string;
  try {
    ({ id: adminId } = await requireAdmin());
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    throw e;
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const variant = new URL(req.url).searchParams.get('variant') === 'thumb' ? 'thumb' : 'full';
  const key = variant === 'thumb' ? thumbKeyFor(doc.s3Key) : doc.s3Key;
  const url = await presignGet(key);

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: 'document.view',
      target: `document:${id}`,
      meta: { variant },
    },
  });

  return NextResponse.json({ url, expiresIn: PRESIGN_TTL_SECONDS });
}
