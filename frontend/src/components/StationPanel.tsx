import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-basic-dist-min';
import {
  coloreStazione, classeStazione, ETICHETTE, fmtLivello, fmtOra,
} from '../lib/constants';
import type { Station } from '../lib/types';

interface Props {
  station: Station;
  onClose: () => void;
}

const LAYOUT: Record<string, unknown> = {
  margin: { t: 8, r: 8, b: 36, l: 42 },
  yaxis: { title: 'livello (m)' },
  showlegend: false,
};

export default function StationPanel({ station, onClose }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  // (re)disegna il grafico a ogni stazione selezionata
  useEffect(() => {
    if (!chartRef.current) return;
    const serie = station.serie ?? [];
    const tracce: unknown[] = [
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
      tracce.push({
        x: serie.map((p) => p.ts),
        y: serie.map(() => station.banda_storica!.p50),
        type: 'scatter', mode: 'lines', name: 'mediana storica',
        line: { color: '#66c2a5', dash: 'dot' },
      });
    }
    Plotly.react(chartRef.current, tracce, LAYOUT, { responsive: true });
    return () => Plotly.purge(chartRef.current!);
  }, [station]);

  const classe = classeStazione(station);
  const dettaglio =
    classe === 'osservata' && station.soglie && station.soglie[0] !== null
      ? ` — livello sotto la soglia 1 di piena (${station.soglie[0]} m)`
      : '';

  return (
    <aside id="pannello">
      <button className="chiudi" title="chiudi" onClick={onClose}>×</button>
      <h2>{station.nome}</h2>
      <div id="p-info">
        <b style={{ color: coloreStazione(station) }}>{ETICHETTE[classe] || classe}{dettaglio}</b>
        <br />
        Livello: <b>{fmtLivello(station.livello_m)}</b> · aggiornato {fmtOra(station.ts)}<br />
        Soglie regionali: {(station.soglie ?? []).map((v) => (v === null ? '—' : v)).join(' / ') || '—'} m<br />
        {station.banda_storica ? (
          <>
            Banda storica oggi: p10 {station.banda_storica.p10} · p50 {station.banda_storica.p50} ·
            p90 {station.banda_storica.p90} m
          </>
        ) : (
          'Banda storica: non ancora disponibile (serve il backfill)'
        )}
        {station.livello_m != null && station.livello_m < 0 && (
          <div className="secca">
            <b>⚠ sotto lo zero idrometrico ({station.livello_m.toFixed(2)} m)</b> — livello più
            basso del riferimento fisso della stazione: secca oggettiva
          </div>
        )}
      </div>
      <div id="p-grafico" ref={chartRef} />
    </aside>
  );
}
