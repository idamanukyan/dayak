'use client';

import { useState, useTransition } from 'react';
import { markRefAction } from '@/app/[locale]/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Ref {
  id: string;
  name: string;
  phone: string;
  relation: string;
  outcome: string | null;
  notes: string | null;
  checkedAt: string | null;
}

const OUTCOMES = ['positive', 'negative', 'no_answer'] as const;

function outcomeVariant(o: string | null) {
  if (o === 'positive') return 'verified' as const;
  if (o === 'negative') return 'destructive' as const;
  if (o === 'no_answer') return 'secondary' as const;
  return 'default' as const;
}

export function ReferenceLog({ refs }: { refs: Ref[] }) {
  if (refs.length === 0) return <p className="text-sm text-muted-foreground">No references.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {refs.map((r) => (
        <RefRow key={r.id} r={r} />
      ))}
    </ul>
  );
}

function RefRow({ r }: { r: Ref }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(r.notes ?? '');

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{r.name}</span>
        <Badge variant={outcomeVariant(r.outcome)}>{r.outcome ?? 'not called'}</Badge>
      </div>
      <span className="text-xs text-muted-foreground">
        {r.phone} · {r.relation.replace(/_/g, ' ')}
      </span>
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Call notes"
        className="h-9 text-xs"
      />
      <div className="flex flex-wrap gap-1">
        {OUTCOMES.map((o) => (
          <Button
            key={o}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={pending}
            onClick={() => startTransition(() => void markRefAction(r.id, o, notes))}
          >
            {o.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>
    </li>
  );
}
