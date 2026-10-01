'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@dayak/i18n';
import { loginAction, type RegisterState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">
          {state.error === 'rate_limited' ? t('tooManyAttempts') : t('invalidCredentials')}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? tc('loading') : t('submitLogin')}
      </Button>
    </form>
  );
}
