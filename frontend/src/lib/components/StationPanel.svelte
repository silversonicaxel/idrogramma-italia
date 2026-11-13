<script lang="ts">
  import type { PlotlyStatic } from 'plotly.js-basic-dist-min';
  import {
    coloreStazione, classeStazione, sottoZero, ETICHETTE, fmtLivello, fmtOra,
  } from '$lib/constants.js';
  import type { Station } from '$lib/types';

  let { station, onClose }: { station: Station; onClose: () => void } = $props();

  let chartDiv = $state<HTMLDivElement | null>(null);
  let Plotly: PlotlyStatic | null = null;

  const classe = $derived(classeStazione(station));
  const dettaglio = $derived(
    classe === 'osservata' && station.soglie && station.soglie[0] !== null
      ? ` — livello sotto la soglia 1 di piena (${station.soglie[0]} m)`
      : ''
  );

  const tracce = $derived.by(() => {
    const serie = station.serie ?? [];
    const t: unknown[] = [
      {
        x: serie.map((p) => p.ts),
        y: serie.map((p) => p.level_m),
        type: 'scatter',
        mode: 'lines+markers', // col singolo punto di adesso la linea non esiste ancora
        name: 'livello',
        line: { color: '#2166ac', width: 2 },
        marker: { size: 7 },
      },
    ];
    if (station.banda_storica && serie.length) {
      t.push({
        x: serie.map((p) => p.ts),
        y: serie.map(() => station.banda_storica!.p50),
        type: 'scatter', mode: 'lines', name: 'mediana storica',
        line: { color: '#66c2a5', dash: 'dot' },
      });
    }
    return t;
  });

  const layout: Record<string, unknown> = {
    margin: { t: 8, r: 8, b: 36, l: 42 },
    yaxis: { title: 'livello (m)' },
    showlegend: false,
  };

  // (re)disegna il grafico a ogni stazione selezionata.
  // import dinamico: plotly.js tocca document all'import e il prerender
  // gira in Node, dove non esiste
  $effect(() => {
    if (!chartDiv) return;
    let cancelled = false;
    import('plotly.js-basic-dist-min').then((m) => {
      if (cancelled) return;
      Plotly = m.default;
      Plotly.react(chartDiv, tracce, layout, { responsive: true });
    });
    return () => {
      cancelled = true;
      Plotly?.purge(chartDiv);
    };
  });
</script>

<aside id="pannello">
  <button class="chiudi" title="chiudi" onclick={onClose}>×</button>
  <h2>{station.nome}</h2>
  <div id="p-info">
    <b style="color:{coloreStazione(station)}">{ETICHETTE[classe] || classe}{dettaglio}</b><br>
    Livello: <b>{fmtLivello(station.livello_m)}</b> · aggiornato {fmtOra(station.ts)}<br>
    Soglie regionali: {(station.soglie ?? []).map((v) => (v === null ? '—' : v)).join(' / ') || '—'} m<br>
    {#if station.banda_storica}
      Banda storica oggi: p10 {station.banda_storica.p10} · p50 {station.banda_storica.p50} ·
      p90 {station.banda_storica.p90} m
    {:else}
      Banda storica: non ancora disponibile (serve il backfill)
    {/if}
    {#if station.livello_m != null && station.livello_m < 0}
      <div class="secca">
        <b>⚠ sotto lo zero idrometrico ({station.livello_m.toFixed(2)} m)</b> — livello più
        basso del riferimento fisso della stazione: secca oggettiva
      </div>
    {/if}
  </div>
  <div id="p-grafico" bind:this={chartDiv}></div>
</aside>
