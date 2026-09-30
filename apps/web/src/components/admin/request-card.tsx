'use client';

import { useState, useTransition } from 'react';
import {
  setRequestStatusAction,
  markFeePaidAction,
  assignBackupAction,
} from '@/app/[locale]/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ALL_STATUSES = [
  'NEW',
  'CONTACTED',
  'INTRO_SCHEDULED',
  'FEE_PENDING',
  'FEE_PAID',
  'TRIAL_SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED_BY_PARENT',
  'CANCELLED_BY_NANNY',
  'NO_MATCH',
];

export function RequestCard({
  id,
  status,
  parentName,
  nannyName,
  schedule,
  startWhen,
  backupImportance,
  feeRef,
  backupOptions,
}: {
  id: string;
  status: string;
  parentName: string;
  nannyName: string | null;
  schedule: string;
  startWhen: string;
  backupImportance: string;
  feeRef: string | null;
  backupOptions: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [ref, setRef] = useState(feeRef ?? '');
  const [backup, setBackup] = useState('');

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-sm shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{parentName}</span>
        {backupImportance === 'very' && <Badge variant="secondary">backup!</Badge>}
      </div>
      <span className="text-xs text-muted-foreground">
        {nannyName ? `→ ${nannyName}` : 'Find me someone'} · {schedule.replace(/_/g, ' ')} · {startWhen}
      </span>

      <select
        value={status}
        disabled={pending}
        onChange={(e) => startTransition(() => void setRequestStatusAction(id, e.target.value))}
        className="h-8 rounded-lg border border-input bg-card px-2 text-xs"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        <Input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Idram ref"
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs"
          disabled={pending || !ref.trim()}
          onClick={() => startTransition(() => void markFeePaidAction(id, ref))}
        >
          Fee paid
        </Button>
      </div>

      {backupOptions.length > 0 && (
        <div className="flex gap-1">
          <select
            value={backup}
            onChange={(e) => setBackup(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-input bg-card px-2 text-xs"
          >
            <option value="">Assign backup…</option>
            {backupOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs"
            disabled={pending || !backup}
            onClick={() => startTransition(() => void assignBackupAction(id, backup))}
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}
