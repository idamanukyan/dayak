import { useTranslations } from 'next-intl';
import { ShieldCheck, RefreshCw, MapPin } from 'lucide-react';
import type { NannyCard as NannyCardData } from '@/server/nannies';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavouriteButton } from '@/components/search/favourite-button';

export function NannyCard({
  card,
  isParent,
  isFavourite,
}: {
  card: NannyCardData;
  isParent: boolean;
  isFavourite: boolean;
}) {
  const t = useTranslations('card');
  const tc = useTranslations('common');
  const te = useTranslations('enums');

  const initial = card.firstName.charAt(0);

  return (
    <Card className="relative overflow-hidden">
      {isParent && (
        <div className="absolute right-3 top-3 z-10">
          <FavouriteButton nannyId={card.id} initialFavourited={isFavourite} />
        </div>
      )}
      <CardContent className="flex gap-4 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-bold text-primary">
          {initial}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {card.firstName}
              {card.ageRange ? `, ${card.ageRange}` : ''}
            </span>
            <Badge variant="verified">
              <ShieldCheck className="h-3 w-3" /> {tc('verified')}
            </Badge>
            {card.backupWilling && (
              <Badge variant="secondary">
                <RefreshCw className="h-3 w-3" />
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {te(`district.${card.district}`)} ·{' '}
            {card.languages.map((l) => te(`language.${l}`)).join(', ')}
          </div>
          {card.experienceYears != null && (
            <span className="text-sm text-muted-foreground">
              {t('experience', { years: card.experienceYears })}
            </span>
          )}
          {card.publicSummary && <p className="line-clamp-2 text-sm">{card.publicSummary}</p>}
          <div className="mt-1 flex items-center justify-between">
            {card.rateHourAmd ? (
              <span className="text-sm font-medium">
                {card.rateHourAmd} ֏{t('perHour')}
              </span>
            ) : (
              <span />
            )}
            <Link
              href={`/nannies/${card.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('viewProfile')} →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
