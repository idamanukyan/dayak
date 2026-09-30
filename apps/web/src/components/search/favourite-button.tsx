'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleFavouriteAction } from '@/app/[locale]/nannies/actions';
import { cn } from '@/lib/utils';

export function FavouriteButton({
  nannyId,
  initialFavourited,
}: {
  nannyId: string;
  initialFavourited: boolean;
}) {
  const [fav, setFav] = useState(initialFavourited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Save"
      aria-pressed={fav}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavouriteAction(nannyId);
          if ('favourited' in res) setFav(res.favourited);
        })
      }
      className="rounded-full bg-card/80 p-2 shadow-soft backdrop-blur transition-colors hover:bg-card"
    >
      <Heart className={cn('h-4 w-4', fav ? 'fill-secondary text-secondary' : 'text-muted-foreground')} />
    </button>
  );
}
