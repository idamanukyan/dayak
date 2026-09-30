'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import { createMatchRequestAction } from '@/app/[locale]/nannies/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SCHEDULE_VALUES = ['FULL_DAY', 'HALF_DAY', 'EVENINGS', 'WEEKENDS'] as const;
const START_VALUES = ['this_week', '2_weeks', 'month', 'browsing'] as const;
const BACKUP_VALUES = ['very', 'nice', 'no'] as const;

export function RequestModal({
  nannyId,
  triggerLabel,
  triggerVariant = 'default',
}: {
  nannyId?: string;
  triggerLabel: string;
  triggerVariant?: 'default' | 'secondary' | 'outline';
}) {
  const t = useTranslations('request');
  const te = useTranslations('enums');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok?: boolean; error?: string }>();

  const [schedule, setSchedule] = useState<string>('FULL_DAY');
  const [startWhen, setStartWhen] = useState<string>('this_week');
  const [backupImportance, setBackupImportance] = useState<string>('nice');
  const [message, setMessage] = useState('');

  const selectCls = 'h-11 w-full rounded-xl border border-input bg-card px-3 text-sm';

  function submit() {
    startTransition(async () => {
      const res = await createMatchRequestAction({
        nannyId,
        schedule: schedule as (typeof SCHEDULE_VALUES)[number] as never,
        startWhen: startWhen as (typeof START_VALUES)[number],
        backupImportance: backupImportance as (typeof BACKUP_VALUES)[number],
        message: message || undefined,
      });
      setState(res);
    });
  }

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('title')}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {state?.ok ? (
              <p className="rounded-xl bg-verified/10 px-4 py-6 text-center text-sm font-medium text-verified">
                {t('sent')}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>{t('schedule')}</Label>
                  <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={selectCls}>
                    {SCHEDULE_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {te(`schedule.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t('startWhen')}</Label>
                  <select value={startWhen} onChange={(e) => setStartWhen(e.target.value)} className={selectCls}>
                    {START_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {t(`start.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t('backupImportance')}</Label>
                  <select
                    value={backupImportance}
                    onChange={(e) => setBackupImportance(e.target.value)}
                    className={selectCls}
                  >
                    {BACKUP_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {t(`backup.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t('message')}</Label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="rounded-xl border border-input bg-card p-3 text-sm"
                  />
                </div>

                {state?.error === 'login_required' && (
                  <p className="text-sm text-destructive">
                    {t('loginRequired')}{' '}
                    <a href={`/${locale}/auth/login`} className="font-medium underline">
                      →
                    </a>
                  </p>
                )}

                <Button onClick={submit} disabled={pending}>
                  {pending ? t('sending') : t('send')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
