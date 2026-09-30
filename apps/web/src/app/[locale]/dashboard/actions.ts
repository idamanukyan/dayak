'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma, District, Language } from '@dayak/db';
import { requireOrCreateParent } from '@/lib/session';

export type ProfileActionState = { ok?: boolean; error?: string } | undefined;

const schema = z.object({
  district: z.nativeEnum(District),
  languages: z.array(z.nativeEnum(Language)),
  childrenAges: z.string().optional(),
});

export async function updateParentProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { parent } = await requireOrCreateParent();

  const parsed = schema.safeParse({
    district: formData.get('district'),
    languages: formData.getAll('languages'),
    childrenAges: formData.get('childrenAges') ?? '',
  });
  if (!parsed.success) return { error: 'invalid' };

  const children = (parsed.data.childrenAges ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 240)
    .map((ageMonths) => ({ ageMonths }));

  await prisma.parentProfile.update({
    where: { id: parent.id },
    data: { district: parsed.data.district, languages: parsed.data.languages, children },
  });

  revalidatePath('/[locale]/dashboard', 'layout');
  return { ok: true };
}
