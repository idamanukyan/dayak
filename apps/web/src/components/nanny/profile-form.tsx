'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfileAction, type ActionState } from '@/app/[locale]/nanny/actions';
import { DISTRICTS, LANGUAGES, SCHEDULES, AGE_GROUPS } from '@/lib/enum-values';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ProfileFormValues {
  district: string;
  birthYear: number | null;
  experienceYears: number | null;
  languages: string[];
  ageGroups: string[];
  schedules: string[];
  rateHourAmd: number | null;
  rateMonthAmd: number | null;
  backupWilling: boolean;
  bio: string | null;
}

function CheckboxGroup({
  name,
  options,
  selected,
  labelFor,
}: {
  name: string;
  options: readonly string[];
  selected: string[];
  labelFor: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
        >
          <input
            type="checkbox"
            name={name}
            value={opt}
            defaultChecked={selected.includes(opt)}
            className="accent-primary"
          />
          {labelFor(opt)}
        </label>
      ))}
    </div>
  );
}

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const t = useTranslations('nanny.profile');
  const te = useTranslations('enums');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="district">{t('district')}</Label>
          <select
            id="district"
            name="district"
            defaultValue={values.district}
            className="h-11 rounded-xl border border-input bg-card px-4 text-sm shadow-soft"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {te(`district.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birthYear">{t('birthYear')}</Label>
          <Input
            id="birthYear"
            name="birthYear"
            type="number"
            min={1940}
            max={2010}
            defaultValue={values.birthYear ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="experienceYears">{t('experienceYears')}</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            max={60}
            required
            defaultValue={values.experienceYears ?? ''}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('languages')}</Label>
        <CheckboxGroup
          name="languages"
          options={LANGUAGES}
          selected={values.languages}
          labelFor={(v) => te(`language.${v}`)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('ageGroups')}</Label>
        <CheckboxGroup
          name="ageGroups"
          options={AGE_GROUPS}
          selected={values.ageGroups}
          labelFor={(v) => te(`ageGroup.${v}`)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('schedules')}</Label>
        <CheckboxGroup
          name="schedules"
          options={SCHEDULES}
          selected={values.schedules}
          labelFor={(v) => te(`schedule.${v}`)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateHourAmd">{t('rateHour')}</Label>
          <Input
            id="rateHourAmd"
            name="rateHourAmd"
            type="number"
            min={0}
            defaultValue={values.rateHourAmd ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateMonthAmd">{t('rateMonth')}</Label>
          <Input
            id="rateMonthAmd"
            name="rateMonthAmd"
            type="number"
            min={0}
            defaultValue={values.rateMonthAmd ?? ''}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="backupWilling"
          defaultChecked={values.backupWilling}
          className="accent-primary"
        />
        {t('backupWilling')}
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">{t('bio')}</Label>
        <textarea
          id="bio"
          name="bio"
          maxLength={600}
          rows={4}
          defaultValue={values.bio ?? ''}
          className="rounded-xl border border-input bg-card p-4 text-sm shadow-soft"
        />
        <span className="text-xs text-muted-foreground">{t('bioHint')}</span>
      </div>

      {state?.ok && <p className="text-sm text-verified">{t('saved')}</p>}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {t('save')}
      </Button>
    </form>
  );
}
