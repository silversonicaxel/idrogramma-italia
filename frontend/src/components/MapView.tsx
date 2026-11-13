import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { IControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { coloreStazione, sottoZero } from '../lib/constants';
import type { Station } from '../lib/types';

interface Props {
  stazioni: Station[];
  onSelect: (s: Station) => void;
  onLegendToggle: () => void;
}

export default function MapView({ stazioni, onSelect, onLegendToggle }: Props) {
  const mapDiv = useRef<HTMLDivElement | null>(null);

  // la mappa nasce solo quando i dati sono pronti: source e layer vengono
  // creati in un colpo solo, senza stati intermedi
  useEffect(() => {
    if (stazioni.length === 0 || !mapDiv.current) return;

    const map = new maplibregl.Map({
      container: mapDiv.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [11.3, 44.5],
      zoom: 7.5,
    });
    window.__map = map; // handle per test/debug (project, queryRenderedFeatures)

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    // bottone "legenda" come control della mappa (stesso stile degli zoom)
    const legendaControl: IControl = {
      onAdd(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Legenda';
        btn.setAttribute('aria-label', 'Legenda');
        btn.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">' +
          '<circle cx="5" cy="5" r="3" fill="#b2182b"/>' +
          '<circle cx="5" cy="10" r="3" fill="#66c2a5"/>' +
          '<circle cx="5" cy="15" r="3" fill="#2166ac"/>' +
          '<rect x="10" y="3.5" width="8" height="3" rx="1.5" fill="#666"/>' +
          '<rect x="10" y="8.5" width="8" height="3" rx="1.5" fill="#666"/>' +
          '<rect x="10" y="13.5" width="8" height="3" rx="1.5" fill="#666"/></svg>';
        btn.onclick = onLegendToggle;
        container.appendChild(btn);
        return container;
      },
      onRemove() {},
    };
    map.addControl(legendaControl);

    map.on('load', () => {
      // oggetti stazione VERI per id: al click le proprietà delle feature MapLibre
      // arrivano serializzate a stringa (array -> testo), inutilizzabili per il pannello
      const perId = new Map<string, Station>(stazioni.map((s) => [`${s.source}:${s.id}`, s]));

      // MapLibre non richiama funzioni JS nelle espressioni: proprietà precalcolate
      map.addSource('stazioni', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stazioni.map((s) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
            properties: {
              source: s.source,
              id: s.id,
              colore: coloreStazione(s),
              sottozero: sottoZero(s),
            },
          })),
        },
      });
      map.addLayer({
        id: 'cerchi',
        type: 'circle',
        source: 'stazioni',
        paint: {
          'circle-color': ['get', 'colore'],
          'circle-radius': 7,
          // anello rosso per le stazioni sotto lo zero idrometrico (secca oggettiva)
          // NB: match() qui non accetta booleani, serve case/==
          'circle-stroke-width': ['case', ['==', ['get', 'sottozero'], true], 2.5, 1],
          'circle-stroke-color': ['case', ['==', ['get', 'sottozero'], true], '#b2182b', '#fff'],
        },
      });

      map.on('click', 'cerchi', (e) => {
        const p = e.features?.[0]?.properties;
        if (!p) return;
        const stazione = perId.get(`${p.source}:${p.id}`);
        if (stazione) onSelect(stazione); // oggetto vero, non le proprietà serializzate
      });
      map.on('mouseenter', 'cerchi', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'cerchi', () => (map.getCanvas().style.cursor = ''));
    });

    return () => map.remove();
  }, [stazioni, onSelect, onLegendToggle]);

  return <div id="mappa" ref={mapDiv} />;
}
