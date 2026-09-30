import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Heart, Phone, Lock, Pencil } from 'lucide-react';
import { prisma, Role, RequestStatus } from '@dayak/db';
import { firstName } from '@/lib/nanny-search';
import { getActor, requireOrCreateParent } from '@/lib/session';
import { Link, redirect } from '@/i18n/routing';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const REVEAL: RequestStatus[] = [
  RequestStatus.FEE_PAID,
  RequestStatus.TRIAL_SCHEDULED,
  RequestStatus.ACTIVE,
  RequestStatus.COMPLETED,
];

export default async function ParentDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('parent');
  const ts = await getTranslations('requestStatus');
  const te = await getTranslations('enums');

  const actor = await getActor();
  if (!actor) redirect({ href: '/auth/login', locale });
  else if (actor.role !== Role.PARENT) redirect({ href: '/', locale });

  const { parent } = await requireOrCreateParent();

  const [requests, favRows] = await Promise.all([
    prisma.matchRequest.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: 'desc' },
      include: { nanny: { include: { user: { select: { name: true, phone: true } } } } },
    }),
    prisma.favourite.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  // Favourite has no nanny relation — resolve the nannies separately.
  const favNannies = await prisma.nannyProfile.findMany({
    where: { id: { in: favRows.map((f) => f.nannyId) } },
    select: { id: true, user: { select: { name: true } } },
  });
  const favOrder = new Map(favRows.map((f, i) => [f.nannyId, i]));
  const favourites = favNannies.sort(
    (a, b) => (favOrder.get(a.id) ?? 0) - (favOrder.get(b.id) ?? 0),
  );

  return (
    <>
      <AppHeader />
      <main className="container max-w-4xl py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('dashboardTitle')}</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">
                <Pencil className="h-4 w-4" /> {t('editProfile')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/nannies">{t('findNannies')}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Requests */}
          <section className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">{t('myRequests')}</h2>
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">{t('noRequests')}</CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((r) => {
                  const revealed = !!r.nanny && REVEAL.includes(r.status);
                  return (
                    <Card key={r.id}>
                      <CardContent className="flex flex-col gap-2 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {r.nanny ? (revealed ? r.nanny.user.name : firstName(r.nanny.user.name)) : t('findSomeoneTitle')}
                          </span>
                          <Badge variant={r.status === RequestStatus.FEE_PAID ? 'verified' : 'primary'}>
                            {ts(r.status)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {te(`schedule.${r.schedule}`)} · {r.startWhen}
                        </span>

                        {revealed ? (
                          <div className="flex items-center gap-2 rounded-lg bg-verified/10 px-3 py-2 text-sm text-verified">
                            <Phone className="h-4 w-4" /> {r.nanny!.user.phone ?? '—'} · {t('contactUnlocked')}
                          </div>
                        ) : r.status === RequestStatus.FEE_PENDING ? (
                          <div className="flex flex-col gap-1 rounded-lg bg-secondary/10 px-3 py-2 text-sm">
                            <span className="font-medium">{t('feePending')}</span>
                            <span className="text-muted-foreground">{t('idram')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" /> {t('feePending')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Favourites */}
          <section>
            <h2 className="mb-3 flex items-center gap-1 font-semibold">
              <Heart className="h-4 w-4 text-secondary" /> {t('favourites')}
            </h2>
            {favourites.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">{t('noFavourites')}</CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {favourites.map((f) => (
                  <Link
                    key={f.id}
                    href={`/nannies/${f.id}`}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted"
                  >
                    {firstName(f.user.name)}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
