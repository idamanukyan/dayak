import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ShieldCheck, RefreshCw, Phone, Lock } from 'lucide-react';
import { prisma, Role } from '@dayak/db';
import { getActor } from '@/lib/session';
import { getPublicNannyProfile } from '@/server/nannies';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RequestModal } from '@/components/search/request-modal';
import { FavouriteButton } from '@/components/search/favourite-button';

export const dynamic = 'force-dynamic';

export default async function NannyProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('publicProfile');
  const tc = await getTranslations('common');
  const te = await getTranslations('enums');
  const tcard = await getTranslations('card');

  const actor = await getActor();
  const profile = await getPublicNannyProfile(id, actor);
  if (!profile) notFound();
  const { card, contact } = profile;

  const isParent = actor?.role === Role.PARENT;
  let isFavourite = false;
  if (isParent && actor) {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId: actor.id },
      select: { favourites: { where: { nannyId: id }, select: { nannyId: true } } },
    });
    isFavourite = (parent?.favourites.length ?? 0) > 0;
  }

  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8">
        <Link
          href="/nannies"
          className="mb-4 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-primary">
                {card.firstName.charAt(0)}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {contact ? contact.fullName : card.firstName}
                    {card.ageRange ? `, ${card.ageRange}` : ''}
                  </h1>
                  <Badge variant="verified">
                    <ShieldCheck className="h-3 w-3" /> {tc('verified')}
                  </Badge>
                  {card.backupWilling && (
                    <Badge variant="secondary">
                      <RefreshCw className="h-3 w-3" /> {tc('roleNanny')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {te(`district.${card.district}`)} ·{' '}
                  {card.languages.map((l) => te(`language.${l}`)).join(', ')}
                </p>
                {isParent && (
                  <div className="mt-1 w-fit">
                    <FavouriteButton nannyId={card.id} initialFavourited={isFavourite} />
                  </div>
                )}
              </div>
            </div>

            {card.publicSummary && (
              <div>
                <h2 className="mb-1 font-semibold">{t('about')}</h2>
                <p className="text-sm text-muted-foreground">{card.publicSummary}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label={t('experience')} value={card.experienceYears != null ? tcard('experience', { years: card.experienceYears }) : '—'} />
              <Detail label={t('schedules')} value={card.schedules.map((s) => te(`schedule.${s}`)).join(', ') || '—'} />
              <Detail
                label={t('rate')}
                value={card.rateHourAmd ? `${card.rateHourAmd} ֏${tcard('perHour')}` : card.rateMonthAmd ? `${card.rateMonthAmd} ֏${tcard('perMonth')}` : '—'}
              />
              <Detail label={t('languages')} value={card.languages.map((l) => te(`language.${l}`)).join(', ')} />
            </div>

            {/* Contact — gated on FEE_PAID */}
            {contact ? (
              <div className="flex items-center gap-2 rounded-xl bg-verified/10 px-4 py-3 text-sm text-verified">
                <Phone className="h-4 w-4" />
                {t('phone')}: <span className="font-semibold">{contact.phone ?? '—'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> {t('contactHidden')}
              </div>
            )}

            <p className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm">
              {t('feeNotice')}
            </p>

            <div className="flex flex-wrap gap-3">
              <RequestModal nannyId={card.id} triggerLabel={t('requestIntro')} />
              <RequestModal triggerLabel={t('findSomeone')} triggerVariant="outline" />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
