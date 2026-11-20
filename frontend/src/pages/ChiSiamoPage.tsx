import Header from '../components/Header';

const GITHUB = 'https://github.com/silversonicaxel/idrogramma-italia';

export default function ChiSiamoPage() {
  return (
    <>
      <Header attiva="chi-siamo" />
      <main className="pagina contenuto">
        <h1>Chi siamo</h1>
        <p className="sottotitolo">
          Idrogramma è un progetto serio: raccogliere in un unico archivio
          pubblico i dati idrometrici italiani — oggi dispersi tra venti
          portali — e metterli, in forma stabile e citabile, a disposizione
          di enti, professionisti, ricercatori e cittadini.
        </p>

        <h2>L'idea: un unico archivio per dati che esistono ma sono dispersi</h2>
        <p>
          I dati sui livelli dei fiumi italiani <b>esistono</b>: ogni regione
          li misura, e molti li pubblica in tempo reale sui propri portali.
          Ma esistono <b>in forma dispersa</b>: circa venti sistemi
          indipendenti, con formati, licenze e finestre temporali diverse —
          spesso solo le ultime 48 ore. Nessun servizio pubblico offre oggi
          un <b>archivio storico nazionale unificato</b>, consultabile e
          riutilizzabile in forma libera.
        </p>
        <p>
          Il che significa che ogni lettura non salvata viene persa per
          sempre: e con essa la materia prima di qualsiasi analisi —
          storica, ingegneristica, di pianificazione o giornalistica —
          sullo stato reale dei nostri fiumi. Idrogramma nasce per questo:
          <b>un unico collector nazionale</b> che raccoglie, normalizza e
          archivia ogni lettura, per sempre.
        </p>

        <h2>A chi serve</h2>
        <p>
          L'obiettivo dichiarato è poter essere utili a <b>qualsiasi ente
          italiano</b> — comuni, protezioni civili locali, enti di bacino e
          distrettuali, consorzi di bonifica — oltre a professionisti,
          ricercatori, giornalisti e cittadini. Per gli enti: serie storiche
          pronte e citabili, senza dover negoziare accesso a venti sistemi
          diversi. Per i professionisti: il contesto storico che un dato di
          oggi richiede per avere significato. Per tutti: la possibilità di
          sapere com'è — e com'è stato — il fiume più vicino.
        </p>

        <h2>Serietà e metodo</h2>
        <p>
          Un archivio pubblico deve essere <b>affidabile</b>, e l'affidabilità
          si costruisce con metodo, non con dichiarazioni:
        </p>
        <ul>
          <li>
            <b>raccolta automatica e ripetibile</b> — una pipeline che gira
            in modo autonomo, con test sui formati di ogni fonte e
            monitoraggio dello stato di salute di ciascuna;
          </li>
          <li>
            <b>archivio append-only</b> — ogni lettura, una volta salvata,
            non viene più modificata: l'archivio cresce e non si perde più;
          </li>
          <li>
            <b>analisi dichiarate</b> — i percentili e le classificazioni
            sono descritti pubblicamente nella pagina{' '}
            <a href="/come-funziona">Come funziona</a>: chiunque può
            riprodurli;
          </li>
          <li>
            <b>trasparenza sulle fonti</b> — ogni dato dichiarà la propria
            provenienza, nella pagina <a href="/fonti">Fonti</a>.
          </li>
        </ul>

        <h2>Legalità e rispetto delle fonti</h2>
        <p>
          Il progetto si pone <b>nessun obiettivo che entri in conflitto con
          la legge</b>: raccoglie esclusivamente dati pubblici, rispetta le
          licenze delle fonti (attribuzione alle regioni e agli enti
          proprietari, licenze CC BY e affini), non raccoglie alcun dato
          personale e dichiara sempre la propria natura non ufficiale. Il
          codice è open source (AGPL-3.0), i dati elaborati sono CC BY 4.0
          con catena di attribuzione alle fonti originali: chi usa
          Idrogramma sa esattamente da dove viene ogni numero.
        </p>

        <h2>Indipendente oggi, ufficiale domani</h2>
        <p>
          Oggi Idrogramma è un servizio indipendente: le allerte ufficiali
          restano quelle dei Centri Funzionali regionali e dei bollettini
          nazionali, e ogni pagina del sito lo dichiara. L'ambizione è
          però dichiarata con la stessa chiarezza: <b>diventare un
          riferimento ufficiale</b>, riconosciuto e citabile, al servizio
          degli enti italiani — nel rispetto totale delle istituzioni che
          producono i dati, di cui Idrogramma vuole essere un alleato e non
          un concorrente. Se e quando ciò avverrà, sarà nel pieno rispetto
          delle norme: nulla di quello che costruiamo oggi è pensato per
          andare contro qualcosa, tutto è pensato per essere utile.
        </p>

        <h2>Chi ci sta dietro</h2>
        <p>
          Il progetto è sviluppato in pubblico: codice, dati, decisioni e
          test sono visibili sul{' '}
          <a href={GITHUB} target="_blank" rel="noreferrer">
            repository GitHub ↗
          </a>. Contributi, segnalazioni di dati errati e proposte di
          collaborazione — anche istituzionali — sono benvenuti.
        </p>

        <h2>Dove stiamo andando</h2>
        <ul>
          <li>
            <b>archivi storici regionali</b> — per accendere i colori di
            magra e piena su tutte le stazioni già monitorate;
          </li>
          <li>
            <b>nuove regioni</b> — il censimento delle fonti è già fatto
            (vedi <a href="/fonti">Fonti</a>): i connector vengono scritti
            uno alla volta;
          </li>
          <li>
            <b>pagine per stazione</b> — un URL condivisibile per ogni
            fiume, con serie completa e contesto storico;
          </li>
          <li>
            <b>servizi per enti</b> — serie storiche scaricabili e
            riconoscimento formale della citazione.
          </li>
        </ul>

        <p className="chiusura">
          Un fiume senza dati è un fiume che nessuno può difendere.
          Idrogramma esiste perché i dati ci sono già — qualcuno deve solo
          salvarli, seriamente e per tutti.
        </p>
      </main>

      <footer className="disclaimer">
        Idrogramma Italia · open source (AGPL-3.0 / CC BY 4.0) · questo sito
        non è un sistema ufficiale di allerta
      </footer>
    </>
  );
}
