import { setRequestLocale } from 'next-intl/server';
import { getMetrics } from '@/server/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-3xl font-bold">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function pct(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminMetrics({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const m = await getMetrics();

  const f = m.funnel;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Metrics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Verified nannies" value={f.verified} />
        <Stat label="In review" value={f.underReview} />
        <Stat label="Total requests" value={m.totalRequests} />
        <Stat label="New → fee paid" value={`${m.feePaidConversionPct}%`} />
        <Stat label="Backup assignments" value={m.backupEvents} />
        <Stat
          label="Median hrs new → contacted"
          value={m.medianHoursNewToContacted != null ? m.medianHoursNewToContacted.toFixed(1) : '—'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nanny funnel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <FunnelRow label="Registered" value={f.registered} base={f.registered} />
          <FunnelRow label="Interviewed" value={f.interviewed} base={f.registered} />
          <FunnelRow label="Under review" value={f.underReview} base={f.registered} />
          <FunnelRow label="Verified" value={f.verified} base={f.registered} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nannies by status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {Object.entries(m.nannyStatus).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {Object.entries(m.requestsByStatus).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parent source</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {Object.entries(m.sourceSplit).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        7-day sparklines land with the Phase 5 nightly metrics job. Values above are live.
      </p>
    </div>
  );

  function FunnelRow({ label, value, base }: { label: string; value: number; base: number }) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-28 text-muted-foreground">{label}</span>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: base ? `${Math.round((value / base) * 100)}%` : '0%' }}
          />
        </div>
        <span className="w-16 text-right font-medium">
          {value} ({pct(value, base)})
        </span>
      </div>
    );
  }
}
