import { prisma, Language, Schedule } from '@dayak/db';
import type { FinishInterview } from './finishTool';

const LANG_MAP: Record<string, Language> = { HY: Language.HY, RU: Language.RU, EN: Language.EN };
const SCHEDULE_SET = new Set<string>(Object.values(Schedule));

function mapLanguages(input: FinishInterview['languages']): Language[] {
  const out = new Set<Language>();
  for (const l of input) {
    const m = LANG_MAP[l.code?.toUpperCase?.() ?? ''];
    if (m) out.add(m);
  }
  return [...out];
}

function mapSchedules(input: string[]): Schedule[] {
  return input.filter((s) => SCHEDULE_SET.has(s)) as Schedule[];
}

/**
 * After finish_interview fires (spec 5.2): persist the structured result, write
 * admin-only summary/score/flags, pre-fill EMPTY profile fields (never clobber
 * what the nanny already entered), and seed references if she has none yet.
 *
 * Note: in Phase 2 this runs inline from the interview route. Phase 5 moves it to
 * a BullMQ worker — the signature stays the same. See docs/DECISIONS.md.
 */
export async function processFinishedInterview(
  interviewId: string,
  structured: FinishInterview,
): Promise<void> {
  const interview = await prisma.interview.findUniqueOrThrow({
    where: { id: interviewId },
    include: { nanny: { include: { references: true } } },
  });
  const nanny = interview.nanny;

  await prisma.interview.update({
    where: { id: interviewId },
    data: { structured: structured as object, completedAt: new Date() },
  });

  const langs = mapLanguages(structured.languages);
  const schedules = mapSchedules(structured.schedules);

  await prisma.nannyProfile.update({
    where: { id: nanny.id },
    data: {
      aiSummary: structured.summary_for_admin,
      publicSummary: structured.public_summary,
      aiScore: structured.consistency_score,
      aiFlags: structured.red_flags,
      // Pre-fill only empty fields.
      experienceYears: nanny.experienceYears ?? structured.experience_years,
      languages: nanny.languages.length ? nanny.languages : langs,
      schedules: nanny.schedules.length ? nanny.schedules : schedules,
      ageGroups: nanny.ageGroups.length ? nanny.ageGroups : structured.age_groups_ok,
      rateHourAmd: nanny.rateHourAmd ?? structured.rate_hour_amd,
      rateMonthAmd: nanny.rateMonthAmd ?? structured.rate_month_amd,
      backupWilling: nanny.backupWilling || structured.backup_willing,
    },
  });

  // Seed references from the interview only if the nanny hasn't added any.
  if (nanny.references.length === 0 && structured.references.length > 0) {
    await prisma.reference.createMany({
      data: structured.references.map((r) => ({
        nannyId: nanny.id,
        name: r.name,
        phone: r.phone,
        relation: r.relation || 'parent_employer',
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      action: 'interview.finished',
      target: `nanny:${nanny.id}`,
      meta: { interviewId, consistency_score: structured.consistency_score },
    },
  });
}
