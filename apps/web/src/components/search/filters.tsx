'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DISTRICTS, LANGUAGES, SCHEDULES, AGE_GROUPS } from '@/lib/enum-values';
import type { NannyFilters } from '@/lib/nanny-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Filters({ initial }: { initial: NannyFilters }) {
  const t = useTranslations('search');
  const te = useTranslations('enums');
  const router = useRouter();
  const pathname = usePathname();

  const [districts, setDistricts] = useState<string[]>(initial.districts);
  const [schedule, setSchedule] = useState(initial.schedule ?? '');
  const [language, setLanguage] = useState(initial.language ?? '');
  const [ageGroup, setAgeGroup] = useState(initial.ageGroup ?? '');
  const [backup, setBackup] = useState(initial.backupWilling);
  const [rateMin, setRateMin] = useState(initial.rateMin?.toString() ?? '');
  const [rateMax, setRateMax] = useState(initial.rateMax?.toString() ?? '');

  function apply() {
    const p = new URLSearchParams();
    if (districts.length) p.set('district', districts.join(','));
    if (schedule) p.set('schedule', schedule);
    if (language) p.set('language', language);
    if (ageGroup) p.set('age', ageGroup);
    if (backup) p.set('backup', '1');
    if (rateMin) p.set('rateMin', rateMin);
    if (rateMax) p.set('rateMax', rateMax);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clear() {
    setDistricts([]);
    setSchedule('');
    setLanguage('');
    setAgeGroup('');
    setBackup(false);
    setRateMin('');
    setRateMax('');
    router.push(pathname);
  }

  const selectCls = 'h-10 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-soft';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-semibold">{t('filters')}</h2>

      <div className="flex flex-col gap-2">
        <Label>{t('district')}</Label>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {DISTRICTS.map((d) => {
            const on = districts.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setDistricts((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))
                }
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  on ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                }`}
              >
                {te(`district.${d}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-schedule">{t('schedule')}</Label>
        <select id="f-schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={selectCls}>
          <option value="">{t('any')}</option>
          {SCHEDULES.map((s) => (
            <option key={s} value={s}>
              {te(`schedule.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-language">{t('language')}</Label>
        <select id="f-language" value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
          <option value="">{t('any')}</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {te(`language.${l}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-age">{t('ageGroup')}</Label>
        <select id="f-age" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={selectCls}>
          <option value="">{t('any')}</option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a}>
              {te(`ageGroup.${a}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateMin">{t('rateMin')}</Label>
          <Input id="rateMin" type="number" min={0} value={rateMin} onChange={(e) => setRateMin(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateMax">{t('rateMax')}</Label>
          <Input id="rateMax" type="number" min={0} value={rateMax} onChange={(e) => setRateMax(e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="accent-primary" />
        {t('backupWilling')}
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={apply}>
          {t('apply')}
        </Button>
        <Button size="sm" variant="ghost" onClick={clear}>
          {t('clear')}
        </Button>
      </div>
    </div>
  );
}
