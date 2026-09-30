import { setRequestLocale } from 'next-intl/server';
import { prisma, NannyStatus } from '@dayak/db';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

function ageDays(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export default async function AdminQueue({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queue = await prisma.nannyProfile.findMany({
    where: { status: { in: [NannyStatus.UNDER_REVIEW, NannyStatus.CHANGES_REQUESTED] } },
    orderBy: { updatedAt: 'asc' }, // oldest first — longest waiting
    select: {
      id: true,
      status: true,
      district: true,
      aiScore: true,
      aiFlags: true,
      updatedAt: true,
      user: { select: { name: true } },
      _count: { select: { documents: true, references: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Verification queue</h1>
        <p className="text-sm text-muted-foreground">
          {queue.length} {queue.length === 1 ? 'nanny' : 'nannies'} awaiting review, oldest first.
        </p>
      </div>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            The queue is empty. 🎉
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">District</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Docs</th>
                <th className="p-3 font-medium">Refs</th>
                <th className="p-3 font-medium">Score</th>
                <th className="p-3 font-medium">Flags</th>
                <th className="p-3 font-medium">Waiting</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {queue.map((n) => (
                <tr key={n.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="p-3 font-medium">{n.user.name}</td>
                  <td className="p-3">{n.district}</td>
                  <td className="p-3">
                    <Badge variant={n.status === NannyStatus.UNDER_REVIEW ? 'primary' : 'secondary'}>
                      {n.status}
                    </Badge>
                  </td>
                  <td className="p-3">{n._count.documents}</td>
                  <td className="p-3">{n._count.references}</td>
                  <td className="p-3 font-semibold">{n.aiScore ?? '—'}</td>
                  <td className="p-3">
                    {n.aiFlags.length > 0 ? (
                      <Badge variant="destructive">{n.aiFlags.length}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">{ageDays(n.updatedAt)}d</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/nannies/${n.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
