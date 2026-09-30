import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma, Role } from '@dayak/db';
import { getActor } from '@/lib/session';
import { parseFilters } from '@/lib/nanny-search';
import { searchVerifiedNannies } from '@/server/nannies';
import { SiteHeader } from '@/components/site-header';
import { Filters } from '@/components/search/filters';
import { NannyCard } from '@/components/search/nanny-card';
import { NannyMap } from '@/components/search/nanny-map';
import { ViewToggle } from '@/components/search/view-toggle';
import { FindSomeone } from '@/components/search/find-someone';

export const dynamic = 'force-dynamic';

export default async function NanniesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('search');

  const sp = await searchParams;
  const filters = parseFilters(sp);

  const actor = await getActor();
  const isParent = actor?.role === Role.PARENT;

  let parentDistrict: string | null = null;
  let favouriteIds = new Set<string>();
  if (isParent && actor) {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId: actor.id },
      select: { district: true, favourites: { select: { nannyId: true } } },
    });
    parentDistrict = parent?.district ?? null;
    favouriteIds = new Set(parent?.favourites.map((f) => f.nannyId) ?? []);
  }

  const cards = await searchVerifiedNannies(filters, parentDistrict);
  const markers = cards
    .filter((c) => c.publicLat != null && c.publicLng != null)
    .map((c) => ({ id: c.id, lat: c.publicLat!, lng: c.publicLng!, name: c.firstName, district: c.district }));

  const list =
    cards.length === 0 ? (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        {t('noResults')}
      </p>
    ) : (
      cards.map((card) => (
        <NannyCard key={card.id} card={card} isParent={isParent} isFavourite={favouriteIds.has(card.id)} />
      ))
    );

  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('results', { count: cards.length })}
              {parentDistrict ? ` · ${t('sortedByDistance')}` : ''}
            </p>
          </div>
          <FindSomeone />
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <Filters initial={filters} />
          </aside>
          <ViewToggle list={list} map={<NannyMap markers={markers} locale={locale} />} />
        </div>
      </main>
    </>
  );
}
