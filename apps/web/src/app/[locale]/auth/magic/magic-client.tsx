'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { magicLoginAction } from '@/app/[locale]/auth/actions';

export function MagicClient({ token, to }: { token: string; to: string }) {
  const tc = useTranslations('common');
  const t = useTranslations('auth');
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    magicLoginAction(token, to).then((res) => {
      if (res?.error) setFailed(true);
    });
  }, [token, to]);

  return (
    <p className="text-center text-muted-foreground">
      {failed ? t('invalidCredentials') : tc('loading')}
    </p>
  );
}
