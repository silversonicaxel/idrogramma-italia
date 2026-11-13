<script lang="ts">
  import { onMount } from 'svelte';
  import type { IControl } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import StationPanel from '$lib/components/StationPanel.svelte';
  import { coloreStazione, sottoZero, fmtOra } from '$lib/constants.js';
  import type { SourceHealth, Station, StationsPayload } from '$lib/types';

  let stazioni = $state<Station[]>([]);
  let fonti = $state<SourceHealth[]>([]);
  let generato = $state<string | null>(null);
  let legendOpen = $state(false);
  let selected = $state<Station | null>(null);

  let mapDiv = $state<HTMLDivElement | null>(null);

  onMount(() => {
    // onMount non può essere async e restituire la cleanup: il lavoro asincrono
    // gira in una IIFE interna, la cleanup resta sincrona
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      // import dinamico: maplibre-gl tocca window/document all'import e il
      // prerender gira in Node, dove non esistono
      const maplibregl = (await import('maplibre-gl')).default;

      const [a, b] = await Promise.all([
      fetch('/data/stations.json'),
      fetch('/data/sources.json'),
    ]);
    const d = (await a.json()) as StationsPayload;
    if (disposed) return;
    stazioni = d.stazioni;
    generato = d.generato;
    fonti = (await b.json()) as SourceHealth[];

    // oggetti stazione VERI per id: al click le proprietà delle feature MapLibre
    // arrivano serializzate a stringa (array -> testo), inutilizzabili per il pannello
    const perId = new Map<string, Station>(stazioni.map((s) => [`${s.source}:${s.id}`, s]));

    const map = new maplibregl.Map({
      container: mapDiv!,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [11.3, 44.5],
      zoom: 7.5,
    });
    if (disposed) {
      map.remove();
      return;
    }
    cleanup = () => map.remove();
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
        btn.onclick = () => (legendOpen = !legendOpen);
        container.appendChild(btn);
        return container;
      },
      onRemove() {},
    };
    map.addControl(legendaControl);

    map.on('load', () => {
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
        selected = perId.get(`${p.source}:${p.id}`) ?? null; // oggetto vero, non le proprietà serializzate
      });
      map.on('mouseenter', 'cerchi', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'cerchi', () => (map.getCanvas().style.cursor = ''));
    });

    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  });
</script>

<svelte:head>
  <title>Idrogramma Italia</title>
</svelte:head>

<div class="map-wrap">
  <div id="mappa" bind:this={mapDiv}></div>

  <div id="legenda" class:aperta={legendOpen}>
    <span class="gruppo" title="il livello di oggi confrontato con i livelli degli stessi giorni degli ultimi 20-30 anni. Attivo dopo il caricamento dello storico.">rispetto agli anni scorsi (stesso periodo):</span>
    <span title="più basso del 95% degli anni scorsi, stesso periodo"><i style="background:#b2182b"></i>magra estrema</span>
    <span title="più basso del 90-95% degli anni scorsi"><i style="background:#ef8a62"></i>magra</span>
    <span title="dentro la fascia normale degli anni scorsi (10°-90° percentile)"><i style="background:#66c2a5"></i>nella norma</span>
    <span title="più alto del 90-95% degli anni scorsi"><i style="background:#67a9cf"></i>piena</span>
    <span title="più alto del 95% degli anni scorsi, stesso periodo"><i style="background:#2166ac"></i>piena estrema</span>
    <span class="divisore"></span>
    <span class="gruppo" title="tre livelli fissi fissati dalla Protezione Civile regionale: superarli scatta l'allerta alluvione. Non esistono soglie ufficiali di magra.">allerta piena (soglie ufficiali):</span>
    <span title="oltre la soglia di attenzione"><i style="background:#fecc5c"></i>soglia 1</span>
    <span title="oltre la soglia di pregiudizio"><i style="background:#d95f02"></i>soglia 2</span>
    <span title="oltre la soglia di emergenza"><i style="background:#7f0000"></i>soglia 3</span>
    <span class="divisore"></span>
    <span title="la stazione trasmette e il livello è sotto tutte le soglie di piena; il confronto con gli anni scorsi non è ancora disponibile"><i style="background:#7f8c8d"></i>nessuna allerta</span>
    <span title="nessuna lettura nelle ultime ore"><i style="background:#cfd8dc"></i>senza dati</span>
    <span class="divisore"></span>
    <span title="livello negativo: più basso del riferimento fisso della stazione — secca oggettiva, visibile già oggi senza storico"><i class="anello"></i>sotto lo zero idrometrico</span>
  </div>

  {#if selected}
    <StationPanel station={selected} onClose={() => (selected = null)} />
  {/if}
</div>

<footer id="fonti">
  {#if generato}
    Dati aggiornati: {fmtOra(generato)} · Fonti:
    {fonti.map((f) => `${f.source} ${f.error ? '⚠ in errore' : 'ok (ultima lettura ' + fmtOra(f.last_reading_ts) + ')'}`).join(' · ')}
    · Dati Arpae/AllertaMeteo Regione Emilia-Romagna
  {/if}
</footer>

<style>
  .map-wrap { position: relative; flex: 1; min-height: 0; }
  #mappa { position: absolute; inset: 0; }

  #legenda {
    display: none; position: absolute; bottom: 10px; left: 10px; z-index: 2;
    background: rgba(255, 255, 255, 0.95); padding: 6px 10px; border-radius: 6px;
    font-size: 12px; max-width: 75%;
  }
  #legenda.aperta { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; }
  #legenda span { white-space: nowrap; cursor: help; }
  #legenda i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
  #legenda i.anello { background: #7f8c8d; box-shadow: 0 0 0 2px #b2182b; }
  #legenda .gruppo { color: #777; font-size: 11px; font-style: italic; }
  #legenda .divisore { width: 1px; height: 18px; background: #ccc; cursor: default; }
</style>
