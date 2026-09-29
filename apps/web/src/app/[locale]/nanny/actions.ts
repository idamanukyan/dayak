'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma, District, Language, Schedule } from '@dayak/db';
import { requireOrCreateNanny, requireNanny } from '@/lib/session';
import { recomputeReviewGate } from '@/server/onboarding';

export type ActionState = { ok?: boolean; error?: string } | undefined;

const AGE_GROUPS = ['0-1', '1-3', '3-6', '6+'] as const;

const profileSchema = z.object({
  district: z.nativeEnum(District),
  birthYear: z.coerce.number().int().min(1940).max(2010).optional().or(z.literal(NaN).transform(() => undefined)),
  experienceYears: z.coerce.number().int().min(0).max(60),
  languages: z.array(z.nativeEnum(Language)).min(1),
  ageGroups: z.array(z.enum(AGE_GROUPS)).min(1),
  schedules: z.array(z.nativeEnum(Schedule)).min(1),
  rateHourAmd: z.coerce.number().int().min(0).max(100000).optional().or(z.literal(NaN).transform(() => undefined)),
  rateMonthAmd: z.coerce.number().int().min(0).max(5000000).optional().or(z.literal(NaN).transform(() => undefined)),
  backupWilling: z.boolean(),
  bio: z.string().max(600).optional(),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { nanny } = await requireOrCreateNanny();

  const parsed = profileSchema.safeParse({
    district: formData.get('district'),
    birthYear: formData.get('birthYear') || undefined,
    experienceYears: formData.get('experienceYears'),
    languages: formData.getAll('languages'),
    ageGroups: formData.getAll('ageGroups'),
    schedules: formData.getAll('schedules'),
    rateHourAmd: formData.get('rateHourAmd') || undefined,
    rateMonthAmd: formData.get('rateMonthAmd') || undefined,
    backupWilling: formData.get('backupWilling') === 'on',
    bio: formData.get('bio') || undefined,
  });
  if (!parsed.success) return { error: 'invalid' };

  await prisma.nannyProfile.update({
    where: { id: nanny.id },
    data: {
      district: parsed.data.district,
      birthYear: parsed.data.birthYear ?? null,
      experienceYears: parsed.data.experienceYears,
      languages: parsed.data.languages,
      ageGroups: parsed.data.ageGroups,
      schedules: parsed.data.schedules,
      rateHourAmd: parsed.data.rateHourAmd ?? null,
      rateMonthAmd: parsed.data.rateMonthAmd ?? null,
      backupWilling: parsed.data.backupWilling,
      bio: parsed.data.bio ?? null,
    },
  });

  revalidatePath('/[locale]/nanny', 'layout');
  return { ok: true };
}

const referenceSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().regex(/^\+?[0-9\s-]{6,20}$/),
  relation: z.enum(['parent_employer', 'other']),
  yearsKnown: z.coerce.number().int().min(0).max(50).optional().or(z.literal(NaN).transform(() => undefined)),
});

export async function addReferenceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { nanny, actor } = await requireNanny();

  const parsed = referenceSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    relation: formData.get('relation'),
    yearsKnown: formData.get('yearsKnown') || undefined,
  });
  if (!parsed.success) return { error: 'invalid' };

  await prisma.reference.create({
    data: {
      nannyId: nanny.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      relation: parsed.data.relation,
      yearsKnown: parsed.data.yearsKnown ?? null,
    },
  });

  await recomputeReviewGate(nanny.id, actor.id);
  revalidatePath('/[locale]/nanny', 'layout');
  return { ok: true };
}

export async function deleteReferenceAction(id: string): Promise<void> {
  const { nanny } = await requireNanny();
  // Ensure the reference belongs to this nanny before deleting.
  const ref = await prisma.reference.findUnique({ where: { id } });
  if (!ref || ref.nannyId !== nanny.id) return;
  await prisma.reference.delete({ where: { id } });
  revalidatePath('/[locale]/nanny', 'layout');
}

