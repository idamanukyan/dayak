'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { DISTRICTS, LANGUAGES } from '@/lib/enum-values';
import { updateParentProfileAction, type ProfileActionState } from '@/app/[locale]/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ParentProfileValues {
  district: string;
  languages: string[];
  childrenAges: string;
}

export function ParentProfileForm({ values }: { values: ParentProfileValues }) {
  const t = useTranslations('parent');
  const te = useTranslations('enums');
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateParentProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-2">
        <Label>{t('languages')}</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <label
              key={l}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="checkbox"
                name="languages"
                value={l}
                defaultChecked={values.languages.includes(l)}
                className="accent-primary"
              />
              {te(`language.${l}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="childrenAges">{t('childrenAges')}</Label>
        <Input id="childrenAges" name="childrenAges" defaultValue={values.childrenAges} placeholder="18, 36" />
      </div>

      {state?.ok && <p className="text-sm text-verified">{t('saved')}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {t('saveProfile')}
      </Button>
    </form>
  );
}
