import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
export const S3_BUCKET = process.env.S3_BUCKET ?? 'dayak-private';

export const s3 = new S3Client({
  endpoint,
  region: process.env.S3_REGION ?? 'auto',
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'dayak',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'dayakminio',
  },
});

/** Presigned URL TTL for all document access (spec Section 2/11: 60 s). */
export const PRESIGN_TTL_SECONDS = 60;

let bucketEnsured = false;

/** Idempotently ensure the private bucket exists (dev convenience for MinIO). */
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
  }
  bucketEnsured = true;
}

export function presignPut(key: string, contentType: string) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn: PRESIGN_TTL_SECONDS,
  });
}

export function presignGet(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: PRESIGN_TTL_SECONDS,
  });
}
