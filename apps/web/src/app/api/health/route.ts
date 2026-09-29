import { NextResponse } from 'next/server';
import { prisma } from '@dayak/db';

export const dynamic = 'force-dynamic';

/** Liveness + DB readiness probe (spec Section 6 route table). */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
