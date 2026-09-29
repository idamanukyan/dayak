import { NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { z } from 'zod';
import { prisma, DocType } from '@dayak/db';
import { requireNanny, UnauthorizedError } from '@/lib/session';
import { isAllowedDocType, isAllowedMime, MAX_UPLOAD_BYTES, thumbKeyFor } from '@/lib/uploads';
import { s3, S3_BUCKET } from '@/lib/s3';
import { recomputeReviewGate } from '@/server/onboarding';

export const runtime = 'nodejs';

const bodySchema = z.object({ key: z.string().min(1), docType: z.string() });

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  // @ts-expect-error - AWS SDK body is an async iterable in Node
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  let nannyId: string;
  let actorId: string;
  try {
    const { nanny, actor } = await requireNanny();
    nannyId = nanny.id;
    actorId = actor.id;
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    throw e;
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { key, docType } = parsed.data;

  if (!isAllowedDocType(docType)) return NextResponse.json({ error: 'bad_doctype' }, { status: 400 });
  // The key must belong to this nanny (prevents registering someone else's object).
  if (!key.startsWith(`nannies/${nannyId}/`))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Fetch the uploaded object and verify its real content type (server-side sniff).
  const obj = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  const buf = await streamToBuffer(obj.Body);
  if (buf.byteLength === 0 || buf.byteLength > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: 'too_large' }, { status: 400 });

  const sniffed = await fileTypeFromBuffer(buf);
  const mime = sniffed?.mime ?? obj.ContentType ?? 'application/octet-stream';
  if (!isAllowedMime(mime)) return NextResponse.json({ error: 'bad_mime' }, { status: 400 });

  // Generate a 480px thumbnail for the admin viewer (images only; PDFs skipped).
  if (mime.startsWith('image/')) {
    try {
      const thumb = await sharp(buf).resize(480, 480, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: thumbKeyFor(key),
          Body: thumb,
          ContentType: 'image/jpeg',
        }),
      );
    } catch {
      // Non-fatal: HEIC/unsupported formats just won't have a thumbnail.
    }
  }

  const doc = await prisma.document.create({
    data: { nannyId, type: docType as DocType, s3Key: key, mime, sizeBytes: buf.byteLength },
  });
  await prisma.auditLog.create({
    data: { actorId, action: 'document.upload', target: `document:${doc.id}`, meta: { type: docType } },
  });

  const status = await recomputeReviewGate(nannyId, actorId);
  return NextResponse.json({ id: doc.id, status });
}
