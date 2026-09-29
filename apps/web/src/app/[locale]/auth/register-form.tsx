'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Role } from '@dayak/db';
import type { Locale } from '@dayak/i18n';
import { registerAction, type RegisterState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [role, setRole] = useState<Role>(Role.PARENT);
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col gap-2">
        <Label>{t('chooseRole')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {[Role.PARENT, Role.NANNY].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                role === r
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted',
              )}
            >
              {r === Role.PARENT ? tc('roleParent') : tc('roleNanny')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t('phone')}</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+374…" autoComplete="tel" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">
          {state.error === 'email_taken' ? t('invalidCredentials') : t('invalidCredentials')}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? tc('loading') : t('submitRegister')}
      </Button>
    </form>
  );
}
