'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Pause, Play } from 'lucide-react';
import { NANNY_STATUS } from '@/lib/enum-values';
import { CHANGE_REASONS, REJECT_REASONS } from '@/lib/verification';
import {
  verifyAction,
  requestChangesAction,
  rejectAction,
  setSuspendedAction,
  type AdminActionState,
} from '@/app/[locale]/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BLOCK_TEXT: Record<string, string> = {
  missing_id_or_selfie: 'Accept the ID front and the selfie-with-ID first.',
  need_two_positive_refs: 'Need at least 2 references marked “positive”.',
  need_parent_employer_ref: 'Need at least 1 positive reference who is a parent-employer.',
  need_meeting_date: 'Enter the in-person meeting date.',
  pick_a_reason: 'Pick at least one reason.',
};

type Panel = 'verify' | 'changes' | 'reject' | null;

export function AdminActionBar({
  nannyId,
  status,
  verifyBlockReason,
}: {
  nannyId: string;
  status: string;
  verifyBlockReason: string | null;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [meetingDate, setMeetingDate] = useState('');
  const [changeReasons, setChangeReasons] = useState<string[]>([]);
  const [changeNote, setChangeNote] = useState('');
  const [rejectReason, setRejectReason] = useState<string>(REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState('');

  const run = (fn: () => Promise<AdminActionState>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(BLOCK_TEXT[res.error] ?? res.error);
      else setPanel(null);
    });
  };

  const isUnderReview = status === NANNY_STATUS.UNDER_REVIEW || status === NANNY_STATUS.CHANGES_REQUESTED;
  const isVerified = status === NANNY_STATUS.VERIFIED;
  const isSuspended = status === NANNY_STATUS.SUSPENDED;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {isUnderReview && (
          <>
            <Button
              size="sm"
              onClick={() => setPanel(panel === 'verify' ? null : 'verify')}
              disabled={pending}
            >
              <CheckCircle2 className="h-4 w-4" /> Verify
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPanel(panel === 'changes' ? null : 'changes')}
              disabled={pending}
            >
              <AlertTriangle className="h-4 w-4" /> Request changes
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setPanel(panel === 'reject' ? null : 'reject')}
              disabled={pending}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </>
        )}
        {isVerified && (
          <Button size="sm" variant="outline" onClick={() => run(() => setSuspendedAction(nannyId, true))} disabled={pending}>
            <Pause className="h-4 w-4" /> Suspend
          </Button>
        )}
        {isSuspended && (
          <Button size="sm" onClick={() => run(() => setSuspendedAction(nannyId, false))} disabled={pending}>
            <Play className="h-4 w-4" /> Unsuspend
          </Button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {panel === 'verify' && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          {verifyBlockReason ? (
            <p className="text-sm text-destructive">{BLOCK_TEXT[verifyBlockReason]}</p>
          ) : (
            <>
              <label className="text-sm font-medium">In-person meeting date</label>
              <Input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-fit"
              />
              <Button
                size="sm"
                disabled={pending || !meetingDate}
                onClick={() => run(() => verifyAction(nannyId, meetingDate))}
                className="w-fit"
              >
                Confirm verify
              </Button>
            </>
          )}
        </div>
      )}

      {panel === 'changes' && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Reasons</p>
          <div className="flex flex-wrap gap-2">
            {CHANGE_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={changeReasons.includes(r)}
                  onChange={(e) =>
                    setChangeReasons((prev) =>
                      e.target.checked ? [...prev, r] : prev.filter((x) => x !== r),
                    )
                  }
                />
                {r.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
          <Input placeholder="Optional note" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => requestChangesAction(nannyId, changeReasons, changeNote))}
            className="w-fit"
          >
            Send request
          </Button>
        </div>
      )}

      {panel === 'reject' && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Reason (nanny sees the category only)</p>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="h-11 w-fit rounded-xl border border-input bg-card px-4 text-sm"
          >
            {REJECT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <Input placeholder="Internal note (never shown to nanny)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => rejectAction(nannyId, rejectReason, rejectNote))}
            className="w-fit"
          >
            Confirm reject
          </Button>
        </div>
      )}
    </div>
  );
}
