import { z } from 'zod';

/**
 * `finish_interview` tool (spec Section 5.4). Claude calls this once it has
 * covered every topic; the validated payload is stored as Interview.structured
 * and drives the summary/score/flags/pre-fill worker step.
 */
export const finishInterviewSchema = z.object({
  experience_years: z.number().int().min(0).max(60),
  last_families: z
    .array(
      z.object({
        child_ages: z.string(),
        duration_months: z.number().int().min(0),
        why_ended: z.string(),
      }),
    )
    .default([]),
  age_groups_ok: z.array(z.string()).default([]),
  age_groups_declined: z.array(z.string()).default([]),
  districts: z.array(z.string()).default([]),
  max_commute_min: z.number().int().min(0).max(180).nullable().default(null),
  schedules: z.array(z.string()).default([]),
  earliest_start: z.string().default('browsing'),
  rate_hour_amd: z.number().int().min(0).nullable().default(null),
  rate_month_amd: z.number().int().min(0).nullable().default(null),
  languages: z
    .array(z.object({ code: z.string(), level: z.string() }))
    .default([]),
  currently_placed_via: z.enum(['none', 'agency', 'kindergarten', 'friends']).default('none'),
  backup_willing: z.boolean().default(false),
  backup_days_per_week: z.number().int().min(0).max(7).default(0),
  references: z
    .array(
      z.object({
        name: z.string(),
        phone: z.string(),
        relation: z.string(),
      }),
    )
    .default([]),
  id_consent: z.boolean().default(false),
  red_flags: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  summary_for_admin: z.string(),
  public_summary: z.string(),
  consistency_score: z.number().int().min(0).max(100),
});

export type FinishInterview = z.infer<typeof finishInterviewSchema>;

/** JSON Schema handed to the Anthropic tool definition (strict). */
export const finishInterviewJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    experience_years: { type: 'integer' },
    last_families: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          child_ages: { type: 'string' },
          duration_months: { type: 'integer' },
          why_ended: { type: 'string' },
        },
        required: ['child_ages', 'duration_months', 'why_ended'],
      },
    },
    age_groups_ok: { type: 'array', items: { type: 'string' } },
    age_groups_declined: { type: 'array', items: { type: 'string' } },
    districts: { type: 'array', items: { type: 'string' } },
    max_commute_min: { type: ['integer', 'null'] },
    schedules: { type: 'array', items: { type: 'string' } },
    earliest_start: { type: 'string' },
    rate_hour_amd: { type: ['integer', 'null'] },
    rate_month_amd: { type: ['integer', 'null'] },
    languages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { code: { type: 'string' }, level: { type: 'string' } },
        required: ['code', 'level'],
      },
    },
    currently_placed_via: { type: 'string', enum: ['none', 'agency', 'kindergarten', 'friends'] },
    backup_willing: { type: 'boolean' },
    backup_days_per_week: { type: 'integer' },
    references: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          relation: { type: 'string' },
        },
        required: ['name', 'phone', 'relation'],
      },
    },
    id_consent: { type: 'boolean' },
    red_flags: { type: 'array', items: { type: 'string' } },
    strengths: { type: 'array', items: { type: 'string' } },
    summary_for_admin: { type: 'string' },
    public_summary: { type: 'string' },
    consistency_score: { type: 'integer' },
  },
  required: [
    'experience_years',
    'summary_for_admin',
    'public_summary',
    'consistency_score',
  ],
} as const;

export const FINISH_TOOL_NAME = 'finish_interview';
