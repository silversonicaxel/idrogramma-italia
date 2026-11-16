import Header from '../components/Header';

export default function ComeFunzionaPage() {
  return (
    <>
      <Header attiva="come-funziona" />
      <main className="pagina contenuto">
        <h1>Come funziona</h1>
        <p className="sottotitolo">
          Idrogramma mostra i livelli dei fiumi italiani e li mette in
          prospettiva. Due strumenti di giudizio, un riferimento fisso e
          qualche stato tecnico: in questa pagina spieghiamo tutto, in
          parole semplici.
        </p>

        <h2>Cosa misuriamo: il livello e lo «zero idrometrico»</h2>
        <p>
          Ogni stazione idrometrica misura l'altezza dell'acqua rispetto a un
          livello di riferimento fisso chiamato <b>zero idrometrico</b>: è lo
          «zero» della stazione, definito una volta e non cambia.
        </p>
        <p>
          Un livello <b>negativo</b> significa che l'acqua è sotto quel
          riferimento. È un fatto oggettivo, non serve nessuna statistica per
          riconoscerlo: quando lo vediamo, lo segnaliamo sulla mappa con un{' '}
          <b>anello rosso</b> attorno al pallino e nella scheda della stazione
          con la dicitura <i>sotto lo zero idrometrico</i>. È il segnale più
          netto di secca che esista.
        </p>
        <div className="esempio">
          Esempio reale: durante la magra del Po, la stazione di Cremona ha
          toccato <b>−5,64 m</b>: quasi 6 metri sotto il proprio zero
          idrometrico.
        </div>

        <h2>I due giudizi: storia e soglie</h2>
        <p>
          Sulla mappa ci sono due scale di colore che misurano cose diverse.
          Capirle è capire tutto il sito.
        </p>

        <h3>1. Rispetto agli anni scorsi — la scala storica</h3>
        <p>
          Il livello di oggi viene confrontato con i livelli degli{' '}
          <b>stessi giorni degli ultimi 20–30 anni</b> della stessa stazione.
          Il risultato è una posizione nella distribuzione storica:
        </p>
        <ul>
          <li><b>magra estrema</b> — più basso del 95% degli anni scorsi;</li>
          <li><b>magra</b> — più basso del 90%;</li>
          <li><b>nella norma</b> — dentro la fascia normale (tra il 10° e il 90° percentile);</li>
          <li><b>piena</b> — più alto del 90%;</li>
          <li><b>piena estrema</b> — più alto del 95%.</li>
        </ul>
        <p>
          È la scala che risponde alla domanda «questo fiume com'è, oggi,
          rispetto alla sua storia?». <b>Non è ancora attiva</b>: per
          funzionare servono anni di storico accumulato. La stiamo costruendo
          giorno dopo giorno — 30 minuti alla volta — e la accenderemo con il
          caricamento degli archivi storici regionali.
        </p>

        <h3>2. Allerta piena — le soglie ufficiali</h3>
        <p>
          Ogni regione fissa per le proprie stazioni tre livelli assoluti:
          <b> soglia 1</b> (attenzione), <b>soglia 2</b> (pregiudizio) e{' '}
          <b>soglia 3</b> (emergenza). Superarle significa che la Protezione
          Civile regionale valuta l'allerta alluvione. Questa scala è{' '}
          <b>attiva da subito</b> e non dipende da noi: sono i valori
          ufficiali.
        </p>
        <p>
          <b>Non esistono soglie ufficiali di magra</b>: per la secca non c'è
          un sistema nazionale di allerta. È esattamente lo spazio che
          Idrogramma vuole colmare con la scala storica.
        </p>

        <h3>Perché le due scale non coincidono</h3>
        <p>
          La soglia 1 di un torrente di montagna può stare al 99° percentile
          storico; quella del Po principale al 92°. Le soglie sono scelte per
          la sicurezza, non per la statistica. Quando un pallino supera una
          soglia, l'allerta ufficiale <b>vince</b> sul colore storico: la
          sicurezza viene prima.
        </p>

        <h2>Gli stati tecnici</h2>
        <p>
          Accanto ai giudizi, tre condizioni pratiche del pallino:
        </p>
        <ul>
          <li>
            <b>nessuna allerta</b> (grigio scuro) — la stazione trasmette e il
            livello è sotto tutte le soglie di piena. <i>Non</i> significa
            «nella norma»: significa che il confronto con la storia non è
            ancora disponibile;
          </li>
          <li>
            <b>senza dati</b> (grigio chiaro) — nessuna lettura nelle ultime
            ore: stazione spenta, in manutenzione o con trasmissione sporadica;
          </li>
          <li>
            <b>sotto lo zero idrometrico</b> — anello rosso attorno al
            pallino: secca oggettiva, visibile già oggi senza storico.
          </li>
        </ul>

        <h2>Come leggere la scheda di una stazione</h2>
        <p>
          Cliccando un pallino si apre la scheda: livello attuale con orario
          di aggiornamento, le soglie regionali, la banda storica (p10, p50,
          p90 del periodo) e il grafico degli ultimi 7 giorni con la{' '}
          <b>linea tratteggiata della mediana storica</b>. Se il pallino ha
          l'anello rosso, la scheda mostra anche l'avviso di secca.
        </p>
        <p>
          Nella pagina <a href="/dati">Dati aggiornati</a> trovi la tabella
          completa di tutte le stazioni con ricerca per nome.
        </p>

        <h2>Da dove arrivano i dati, e ogni quanto</h2>
        <p>
          I dati vengono raccolti automaticamente dai portali pubblici
          regionali — una fonte per regione, citata e linkata nella pagina{' '}
          <a href="/fonti">Fonti</a>. La raccolta gira ogni 30 minuti; i
          percentili vengono ricalcolati ogni notte. I dati in tempo reale
          sono <i>non validati</i>: possono esserci buchi o valori errati
          (manutenzione, guasti): è normale in ogni rete di misurazione.
        </p>

        <h2>Domande frequenti</h2>
        <h3>È un sistema ufficiale?</h3>
        <p>
          No. Idrogramma è un progetto indipendente che riorganizza dati
          pubblici. Per le allerte idrauliche e idrogeologiche fai sempre
          riferimento ai bollettini della Protezione Civile della tua regione.
        </p>
        <h3>Perché la mia regione non c'è?</h3>
        <p>
          Le regioni vengono attivate una alla volta, quando il loro formato
          dati è stato analizzato. Vedi lo stato di ogni fonte nella pagina{' '}
          <a href="/fonti">Fonti</a>.
        </p>
        <h3>Perché quasi tutti i pallini sono grigi?</h3>
        <p>
          Perché i colori storici (magra/nella norma/piena) non sono ancora
          attivi: richiedono anni di storico. I pallini grigi scuri dicono
          «stazione viva, nessuna allerta» — non «nella norma».
        </p>
        <h3>Perché nel grafico c'è un punto solo, senza linea?</h3>
        <p>
          Le serie si riempiono con il tempo: il sito è giovane, e ogni
          mezz'ora aggiunge un pezzo. Col backfill degli archivi regionali
          anche le serie si allungheranno all'indietro.
        </p>

        <p className="chiusura">
          Una domanda che non c'è? Costruiamo in pubblico: il progetto è open
          source e ogni etichetta di questo sito è negoziabile — se non è
          chiara, è un bug nostro.
        </p>
      </main>

      <footer className="disclaimer">
        Idrogramma Italia · dati pubblici regionali · questo sito non è un
        sistema ufficiale di allerta
      </footer>
    </>
  );
}
