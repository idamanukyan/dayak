'use client';

import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  district: string;
}

// Yerevan bounds (spec 5.5): [[west,south],[east,north]]
const BOUNDS: [[number, number], [number, number]] = [
  [44.4, 40.1],
  [44.62, 40.25],
];

const STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

export function NannyMap({ markers, locale }: { markers: MapMarker[]; locale: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: import('maplibre-gl').Map | undefined;
    let ro: ResizeObserver | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE,
        bounds: BOUNDS,
        maxBounds: BOUNDS,
        fitBoundsOptions: { padding: 30 },
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      const data = {
        type: 'FeatureCollection' as const,
        features: markers.map((m) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
          properties: { id: m.id, name: m.name, district: m.district },
        })),
      };

      map.on('load', () => {
        if (!map) return;
        map.addSource('nannies', {
          type: 'geojson',
          data,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 45,
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'nannies',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#4F7355',
            'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 15, 30],
            'circle-opacity': 0.85,
          },
        });
        map.addLayer({
          id: 'unclustered',
          type: 'circle',
          source: 'nannies',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#D08A6A',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        map.on('click', 'clusters', (e) => {
          const feature = map!.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
          const clusterId = feature?.properties?.cluster_id;
          const src = map!.getSource('nannies') as import('maplibre-gl').GeoJSONSource;
          src.getClusterExpansionZoom(clusterId).then((zoom) => {
            map!.easeTo({
              center: (feature!.geometry as GeoJSON.Point).coordinates as [number, number],
              zoom,
            });
          });
        });

        map.on('click', 'unclustered', (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const { id, name, district } = f.properties as { id: string; name: string; district: string };
          new maplibregl.Popup({ closeButton: true })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:13px"><strong>${name}</strong><br/>${district}<br/>` +
                `<a href="/${locale}/nannies/${id}" style="color:#4F7355;font-weight:600">View profile →</a></div>`,
            )
            .addTo(map!);
        });

        for (const layer of ['clusters', 'unclustered']) {
          map.on('mouseenter', layer, () => (map!.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', layer, () => (map!.getCanvas().style.cursor = ''));
        }
      });

      // Keep the canvas sized when the container is shown (mobile list/map toggle).
      ro = new ResizeObserver(() => map?.resize());
      ro.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
    };
  }, [markers, locale]);

  return <div ref={containerRef} className="h-[60vh] w-full overflow-hidden rounded-2xl border border-border" />;
}
