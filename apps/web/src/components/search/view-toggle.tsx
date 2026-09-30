'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ViewToggle({ list, map }: { list: React.ReactNode; map: React.ReactNode }) {
  const t = useTranslations('search');
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div>
      <div className="mb-3 flex gap-2 lg:hidden">
        <Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
          <List className="h-4 w-4" /> {t('listView')}
        </Button>
        <Button size="sm" variant={view === 'map' ? 'default' : 'outline'} onClick={() => setView('map')}>
          <Map className="h-4 w-4" /> {t('mapView')}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={view === 'list' ? 'flex flex-col gap-3' : 'hidden lg:flex lg:flex-col lg:gap-3'}>
          {list}
        </div>
        <div className={`${view === 'map' ? 'block' : 'hidden lg:block'} lg:sticky lg:top-20 lg:h-fit`}>
          {map}
        </div>
      </div>
    </div>
  );
}
