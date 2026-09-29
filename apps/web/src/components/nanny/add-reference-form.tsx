'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { addReferenceAction, type ActionState } from '@/app/[locale]/nanny/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddReferenceForm() {
  const t = useTranslations('nanny.references');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addReferenceAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ref-name">{t('name')}</Label>
        <Input id="ref-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ref-phone">{t('phone')}</Label>
        <Input id="ref-phone" name="phone" type="tel" placeholder="+374…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ref-relation">{t('relation')}</Label>
        <select
          id="ref-relation"
          name="relation"
          className="h-11 rounded-xl border border-input bg-card px-4 text-sm shadow-soft"
          defaultValue="parent_employer"
        >
          <option value="parent_employer">{t('parentEmployer')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ref-years">{t('yearsKnown')}</Label>
        <Input id="ref-years" name="yearsKnown" type="number" min={0} max={50} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {t('add')}
        </Button>
      </div>
    </form>
  );
}
