'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, Check, Clock, X } from 'lucide-react';
import { REQUIRED_DOC_TYPE_VALUES, OPTIONAL_DOC_TYPE_VALUES } from '@/lib/enum-values';
import { Badge } from '@/components/ui/badge';

export interface DocState {
  type: string;
  status: string; // UPLOADED | ACCEPTED | REJECTED
}

const ACCEPT = 'image/jpeg,image/png,image/heic,application/pdf';

export function DocumentsManager({ initial }: { initial: DocState[] }) {
  const t = useTranslations('nanny.documents');
  const tType = useTranslations('nanny.docType');
  const router = useRouter();
  const [docs, setDocs] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((d) => [d.type, d.status])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(docType: string, file: File) {
    setError(null);
    setBusy(docType);
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ docType, mime: file.type, sizeBytes: file.size }),
      });
      if (!presignRes.ok) throw new Error((await presignRes.json()).error ?? 'presign_failed');
      const { url, key } = await presignRes.json();

      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      });
      if (!put.ok) throw new Error('upload_failed');

      const reg = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, docType }),
      });
      if (!reg.ok) throw new Error((await reg.json()).error ?? 'register_failed');

      setDocs((prev) => ({ ...prev, [docType]: 'UPLOADED' }));
      router.refresh(); // pick up any status auto-transition
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setBusy(null);
    }
  }

  function Row({ docType, required }: { docType: string; required: boolean }) {
    const status = docs[docType];
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{tType(docType)}</span>
          <span className="text-xs text-muted-foreground">
            {required ? t('required') : t('optional')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {status === 'ACCEPTED' && (
            <Badge variant="verified">
              <Check className="h-3 w-3" /> {t('accepted')}
            </Badge>
          )}
          {status === 'REJECTED' && (
            <Badge variant="destructive">
              <X className="h-3 w-3" /> {t('rejected')}
            </Badge>
          )}
          {status === 'UPLOADED' && (
            <Badge variant="primary">
              <Clock className="h-3 w-3" /> {t('uploaded')}
            </Badge>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" />
            {busy === docType ? t('uploading') : status ? t('replace') : t('choose')}
            <input
              type="file"
              accept={ACCEPT}
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(docType, f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {REQUIRED_DOC_TYPE_VALUES.map((dt) => (
        <Row key={dt} docType={dt} required />
      ))}
      {OPTIONAL_DOC_TYPE_VALUES.map((dt) => (
        <Row key={dt} docType={dt} required={false} />
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
