import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import StationPanel from './components/StationPanel';
import { fmtOra } from './lib/constants';
import type { SourceHealth, Station, StationsPayload } from './lib/types';

export default function App() {
  const [stazioni, setStazioni] = useState<Station[]>([]);
  const [fonti, setFonti] = useState<SourceHealth[]>([]);
  const [generato, setGenerato] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selected, setSelected] = useState<Station | null>(null);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        fetch('/data/stations.json'),
        fetch('/data/sources.json'),
      ]);
      const d = (await a.json()) as StationsPayload;
      setStazioni(d.stazioni);
      setGenerato(d.generato);
      setFonti((await b.json()) as SourceHealth[]);
    })();
  }, []);

  // callback stabili: senza loro MapView ricreerebbe la mappa a ogni render
  const onSelect = useCallback((s: Station) => setSelected(s), []);
  const onLegendToggle = useCallback(() => setLegendOpen((o) => !o), []);

  return (
    <>
      <Header attiva="mappa" />
      <div className="map-wrap">
        <MapView stazioni={stazioni} onSelect={onSelect} onLegendToggle={onLegendToggle} />

        <div id="legenda" className={legendOpen ? 'aperta' : ''}>
          <span className="gruppo" title="il livello di oggi confrontato con i livelli degli stessi giorni degli ultimi 20-30 anni. Attivo dopo il caricamento dello storico.">rispetto agli anni scorsi (stesso periodo):</span>
          <span title="più basso del 95% degli anni scorsi, stesso periodo"><i style={{ background: '#b2182b' }} />magra estrema</span>
          <span title="più basso del 90-95% degli anni scorsi"><i style={{ background: '#ef8a62' }} />magra</span>
          <span title="dentro la fascia normale degli anni scorsi (10°-90° percentile)"><i style={{ background: '#66c2a5' }} />nella norma</span>
          <span title="più alto del 90-95% degli anni scorsi"><i style={{ background: '#67a9cf' }} />piena</span>
          <span title="più alto del 95% degli anni scorsi, stesso periodo"><i style={{ background: '#2166ac' }} />piena estrema</span>
          <span className="divisore" />
          <span className="gruppo" title="tre livelli fissi fissati dalla Protezione Civile regionale: superarli scatta l'allerta alluvione. Non esistono soglie ufficiali di magra.">allerta piena (soglie ufficiali):</span>
          <span title="oltre la soglia di attenzione"><i style={{ background: '#fecc5c' }} />soglia 1</span>
          <span title="oltre la soglia di pregiudizio"><i style={{ background: '#d95f02' }} />soglia 2</span>
          <span title="oltre la soglia di emergenza"><i style={{ background: '#7f0000' }} />soglia 3</span>
          <span className="divisore" />
          <span title="la stazione trasmette e il livello è sotto tutte le soglie di piena; il confronto con gli anni scorsi non è ancora disponibile"><i style={{ background: '#7f8c8d' }} />nessuna allerta</span>
          <span title="nessuna lettura nelle ultime ore"><i style={{ background: '#cfd8dc' }} />senza dati</span>
          <span className="divisore" />
          <span title="livello negativo: più basso del riferimento fisso della stazione — secca oggettiva, visibile già oggi senza storico"><i className="anello" />sotto lo zero idrometrico</span>
        </div>

        {selected && <StationPanel station={selected} onClose={() => setSelected(null)} />}
      </div>

      <footer id="fonti">
        {generato && (
          <>
            Dati aggiornati: {fmtOra(generato)} · Fonti:{' '}
            {fonti.map((f) => `${f.source} ${f.error ? '⚠ in errore' : 'ok (ultima lettura ' + fmtOra(f.last_reading_ts) + ')'}`).join(' · ')}
            {' '}· Dati Arpae/AllertaMeteo Regione Emilia-Romagna
          </>
        )}
      </footer>
    </>
  );
}
