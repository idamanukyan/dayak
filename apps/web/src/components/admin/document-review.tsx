'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, X, ExternalLink, FileText } from 'lucide-react';
import { setDocStatusAction } from '@/app/[locale]/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Doc {
  id: string;
  type: string;
  status: string;
  mime: string;
}

function Thumb({ id, isImage }: { id: string; isImage: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage) return;
    let active = true;
    fetch(`/api/admin/documents/${id}/url?variant=thumb`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d?.url && setUrl(d.url))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, isImage]);

  if (!isImage) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileText className="h-6 w-6" />
      </div>
    );
  }
  return url ? (
    // Presigned, short-lived, private image — next/image optimization doesn't apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="document" className="h-16 w-16 rounded-lg object-cover" />
  ) : (
    <div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
  );
}

export function DocumentReview({ docs }: { docs: Doc[] }) {
  const [pending, startTransition] = useTransition();

  async function openFull(id: string) {
    const res = await fetch(`/api/admin/documents/${id}/url?variant=full`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener');
    }
  }

  if (docs.length === 0) return <p className="text-sm text-muted-foreground">No documents uploaded.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {docs.map((d) => (
        <li key={d.id} className="flex gap-3 rounded-xl border border-border p-2">
          <button type="button" onClick={() => openFull(d.id)} aria-label="Open full">
            <Thumb id={d.id} isImage={d.mime.startsWith('image/')} />
          </button>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{d.type}</span>
              <Badge
                variant={
                  d.status === 'ACCEPTED' ? 'verified' : d.status === 'REJECTED' ? 'destructive' : 'default'
                }
              >
                {d.status}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={pending}
                onClick={() => startTransition(() => void setDocStatusAction(d.id, 'ACCEPTED', ''))}
              >
                <Check className="h-3 w-3" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={pending}
                onClick={() => startTransition(() => void setDocStatusAction(d.id, 'REJECTED', ''))}
              >
                <X className="h-3 w-3" /> Reject
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openFull(d.id)}>
                <ExternalLink className="h-3 w-3" /> View
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
