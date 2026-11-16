import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { fmtOra } from '../lib/constants';

interface FonteLive {
  last_run: string | null;
  last_success: string | null;
  last_reading_ts: string | null;
  n_readings: number | null;
  error: string | null;
}

interface Fonte {
  id: string;
  regione: string;
  ente: string;
  portale: string | null;
  tipo: string;
  stato: string;
  note: string;
  licenza: string | null;
  live: FonteLive | null;
}

interface FontiPayload {
  generato: string;
  fonti: Fonte[];
}

export default function FontiPage() {
  const [fonti, setFonti] = useState<Fonte[]>([]);

  useEffect(() => {
    (async () => {
      setFonti(((await (await fetch('/data/fonti.json')).json()) as FontiPayload).fonti);
    })();
  }, []);

  return (
    <>
      <Header attiva="fonti" />
      <main className="pagina">
        <h2>Da dove vengono i dati</h2>
        <p>
          Ogni regione ha una propria rete di monitoraggio e un proprio centro
          funzionale: Idrogramma raccoglie dai portali pubblici e li rende
          confrontabili su una sola mappa. Le fonti «in arrivo» sono già
          censite e verranno attivate una alla volta.
        </p>
        <table>
          <thead>
            <tr>
              <th>regione</th><th>ente</th><th>tipo</th><th>stato</th>
              <th>portale</th><th>raccolta live</th>
            </tr>
          </thead>
          <tbody>
            {fonti.map((f) => (
              <tr key={f.id}>
                <td>{f.regione}</td>
                <td>
                  {f.ente}
                  {f.note && <div className="nota">{f.note}</div>}
                </td>
                <td>{f.tipo}</td>
                <td>
                  {f.stato === 'attiva'
                    ? <span className="badge ok">attiva</span>
                    : <span className="badge pianificata">in arrivo</span>}
                </td>
                <td>
                  {f.portale && <a href={f.portale} target="_blank" rel="noreferrer">portale ↗</a>}
                </td>
                <td>
                  {f.live ? (
                    f.live.error
                      ? <span className="badge errore">⚠ {f.live.error}</span>
                      : <span className="live">
                          ok · ultima lettura {fmtOra(f.live.last_reading_ts)}
                        </span>
                  ) : (
                    <span className="plain">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Attribuzione e licenze</h2>
        <ul className="licenze">
          {fonti.filter((f) => f.licenza).map((f) => (
            <li key={f.id}>
              <b>{f.regione}</b>: {f.licenza}
            </li>
          ))}
        </ul>
        <p className="disclaimer-p">
          Idrogramma non è un sistema ufficiale di allerta: per le allerte
          idrauliche e idrogeologiche fai riferimento ai bollettini regionali
          della Protezione Civile.
        </p>
      </main>

      <footer className="disclaimer">
        Idrogramma Italia · dati pubblici regionali · pagina generata
        automaticamente dal registro delle fonti
      </footer>
    </>
  );
}
