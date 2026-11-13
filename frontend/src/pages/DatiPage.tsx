import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { COLORI, ETICHETTE, sottoZero, fmtOra, fmtLivello } from '../lib/constants';
import type { Classe, SourceHealth, Station, StationsPayload } from '../lib/types';

export default function DatiPage() {
  const [stazioni, setStazioni] = useState<Station[]>([]);
  const [fonti, setFonti] = useState<SourceHealth[]>([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        fetch('/data/stations.json'),
        fetch('/data/sources.json'),
      ]);
      setStazioni(((await a.json()) as StationsPayload).stazioni);
      setFonti((await b.json()) as SourceHealth[]);
    })();
  }, []);

  const filtrate = useMemo(
    () => stazioni.filter((s) => s.nome.toLowerCase().includes(filtro.toLowerCase())),
    [stazioni, filtro]
  );

  return (
    <>
      <Header attiva="dati" />
      <main className="pagina">
        <h2>Fonti</h2>
        <table>
          <thead>
            <tr><th>fonte</th><th>ultimo run</th><th>ultima lettura ricevuta</th>
              <th className="num">letture</th><th>stato</th></tr>
          </thead>
          <tbody>
            {fonti.map((f) => (
              <tr key={f.source}>
                <td>{f.source}</td>
                <td>{fmtOra(f.last_run)}</td>
                <td>{fmtOra(f.last_reading_ts)}</td>
                <td className="num">{f.n_readings ?? '—'}</td>
                <td>
                  {f.error
                    ? <span className="badge errore">⚠ {f.error}</span>
                    : <span className="badge ok">ok</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Stazioni</h2>
        <p>
          <input
            type="search"
            placeholder="filtra per nome stazione…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </p>
        <table>
          <thead>
            <tr><th>stazione</th><th className="num">livello (m)</th><th>aggiornato</th>
              <th>stato</th><th>soglie 1/2/3 (m)</th><th>fonte</th></tr>
          </thead>
          <tbody>
            {filtrate.map((s) => {
              const c = (s.classe_soglie || s.classe) as Classe | undefined;
              return (
                <tr key={s.source + ':' + s.id}>
                  <td>{s.nome}</td>
                  <td className="num">{fmtLivello(s.livello_m)}</td>
                  <td>{fmtOra(s.ts)}</td>
                  <td>
                    {!c && s.livello_m == null
                      ? <span className="plain">senza dati recenti</span>
                      : c
                        ? <span className="badge" style={{ background: COLORI[c] }}>{ETICHETTE[c] || c}</span>
                        : <span className="badge" style={{ background: '#7f8c8d' }}>nessuna allerta</span>}
                    {sottoZero(s) && <span className="badge errore">sotto lo zero</span>}
                  </td>
                  <td>{(s.soglie ?? []).map((v) => (v === null ? '—' : v)).join(' / ')}</td>
                  <td>{s.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>

      <footer className="disclaimer">
        Idrogramma Italia · dati Arpae/AllertaMeteo Regione Emilia-Romagna ·
        questo sito non è un sistema ufficiale di allerta
      </footer>
    </>
  );
}
