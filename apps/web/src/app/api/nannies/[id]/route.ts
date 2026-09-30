import { NextResponse } from 'next/server';
import { getActor } from '@/lib/session';
import { getPublicNannyProfile } from '@/server/nannies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public nanny profile JSON. The `contact` object (full name + phone) is present
 * ONLY when the requesting parent has a FEE_PAID request with this nanny — the
 * phone field is absent from the payload entirely otherwise (spec 4 / 11.4).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  const profile = await getPublicNannyProfile(id, actor);
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(profile);
}
