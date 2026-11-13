<script lang="ts">
  import { onMount } from 'svelte';
  import { COLORI, ETICHETTE, sottoZero, fmtOra, fmtLivello } from '$lib/constants.js';
  import type { Classe, SourceHealth, Station, StationsPayload } from '$lib/types';

  let stazioni = $state<Station[]>([]);
  let fonti = $state<SourceHealth[]>([]);
  let filtro = $state('');

  const filtrate = $derived(
    stazioni.filter((s) => s.nome.toLowerCase().includes(filtro.toLowerCase()))
  );

  onMount(async () => {
    const [a, b] = await Promise.all([
      fetch('/data/stations.json'),
      fetch('/data/sources.json'),
    ]);
    stazioni = ((await a.json()) as StationsPayload).stazioni;
    fonti = (await b.json()) as SourceHealth[];
  });
</script>

<svelte:head>
  <title>Dati aggiornati — Idrogramma Italia</title>
</svelte:head>

<main class="pagina">
  <h2>Fonti</h2>
  <table>
    <thead>
      <tr><th>fonte</th><th>ultimo run</th><th>ultima lettura ricevuta</th>
        <th class="num">letture</th><th>stato</th></tr>
    </thead>
    <tbody>
      {#each fonti as f (f.source)}
        <tr>
          <td>{f.source}</td>
          <td>{fmtOra(f.last_run)}</td>
          <td>{fmtOra(f.last_reading_ts)}</td>
          <td class="num">{f.n_readings ?? '—'}</td>
          <td>
            {#if f.error}
              <span class="badge errore">⚠ {f.error}</span>
            {:else}
              <span class="badge ok">ok</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  <h2>Stazioni</h2>
  <p><input type="search" placeholder="filtra per nome stazione…" bind:value={filtro}></p>
  <table>
    <thead>
      <tr><th>stazione</th><th class="num">livello (m)</th><th>aggiornato</th>
        <th>stato</th><th>soglie 1/2/3 (m)</th><th>fonte</th></tr>
    </thead>
    <tbody>
      {#each filtrate as s (s.source + ':' + s.id)}
        <tr>
          <td>{s.nome}</td>
          <td class="num">{fmtLivello(s.livello_m)}</td>
          <td>{fmtOra(s.ts)}</td>
          <td>
            {#if !(s.classe_soglie || s.classe) && s.livello_m == null}
              <span class="plain">senza dati recenti</span>
            {:else if s.classe_soglie || s.classe}
              {@const c = (s.classe_soglie || s.classe) as Classe}
              <span class="badge" style="background:{COLORI[c]}">{ETICHETTE[c] || c}</span>
            {:else}
              <span class="badge" style="background:#7f8c8d">nessuna allerta</span>
            {/if}
            {#if sottoZero(s)}<span class="badge errore">sotto lo zero</span>{/if}
          </td>
          <td>{(s.soglie ?? []).map((v) => (v === null ? '—' : v)).join(' / ')}</td>
          <td>{s.source}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<footer class="disclaimer">
  Idrogramma Italia · dati Arpae/AllertaMeteo Regione Emilia-Romagna ·
  questo sito non è un sistema ufficiale di allerta
</footer>

<style>
  .pagina { flex: 1; overflow-y: auto; padding: 16px; max-width: 1100px; }
  .pagina h2 { font-size: 18px; margin: 18px 0 8px; }
  .pagina table { border-collapse: collapse; width: 100%; font-size: 13px; }
  .pagina th, .pagina td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e5e5e5; white-space: nowrap; }
  .pagina th { background: #f7f7f7; position: sticky; top: 0; }
  .pagina td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .pagina input[type='search'] {
    padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px;
    font-size: 14px; width: min(320px, 100%);
  }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 10px; color: #fff; font-size: 11px; }
  .badge.ok { background: #2e7d32; }
  .badge.errore { background: #7f0000; }
  .plain { color: #999; }
  .disclaimer { font-size: 11px; color: #555; background: #fff; border-top: 1px solid #ddd; padding: 4px 14px; }
</style>
