# Idrogramma — lo stato dei fiumi italiani

Per ogni stazione idrometrica: il livello di oggi confrontato con la distribuzione
storica dello stesso periodo dell'anno. Due estremi, un solo strumento:
**magra estrema ←→ piena estrema**.

## Stato

Pipeline in tre regioni attive: Emilia-Romagna (AllertaMeteo/Arpae),
Veneto (ARPAV) e Toscana (SIR), DB SQLite, motore percentili/soglie,
sito statico React 19 + MapLibre + Plotly.

## Quickstart

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python pipeline.py            # harvest + build dei JSON del sito
python pipeline.py nightly    # catch-up + ricalcolo percentili (job notturno)
pytest                        # golden test dei connector (fixture reali)

# frontend React 19 + Vite (in frontend/):
npm install
npm run dev                   # sviluppo con HMR
npm run build && npm run preview -- --port 8000   # build statica in frontend/dist/
```

## Architettura

```
connectors/   una classe per fonte — l'UNICA parte di codice per-regione
registry/     sources.yaml: fonti note, endpoint, abilitazione
core/         db · percentiles · status · sitejson (condiviso, region-agnostic)
db/           schema.sql (SQLite in locale, Cloudflare D1 in produzione)
frontend/     React 19 + Vite + TypeScript (MPA), build statica in dist/
pipeline.py   entrypoint: harvest | nightly | build
```

Regole del progetto:

- il sito legge **solo** i JSON generati in `frontend/static/data/`, mai le API pubbliche;
- ogni run registra lo stato di salute della fonte in `sources_health`
  (quando una fonte si rompe, il sito deve dirlo, non mostrare dati stantii);
- ogni connector ha un golden test su fixture reale in `tests/fixtures/`
  (quando il formato cambia, il test fallisce prima della pipeline).

## Fonti attive

**Emilia-Romagna** — portale AllertaMeteo. Endpoint JSON non documentato
ufficialmente (`registry/sources.yaml` per dettagli e note); la variabile
`B13215` è il livello idrometrico. Dati forniti da Arpae — citare sempre
la fonte. Il feed include stazioni lago/diga e otto stazioni fuori regione
(Po a monte e Conca Diga), etichettate con la regione reale.

**Veneto** — ARPAV, REST "dati in diretta" (JSON, ~120 stazioni LIDRO).
Una riga per stazione con l'ultimo livello trasmesso; ora locale
Europe/Rome convertita in UTC; livelli riferiti allo zero locale, anche
negativi. Dati ARPAV — citare sempre la fonte.

**Toscana** — SIR (sir.toscana.it/idrometria-pub), rete idrometrica
~195 stazioni; JSON via chiamata per stazione; dataora locale
Europe/Rome convertita in UTC. Dati Regione Toscana — citare la fonte.

Le altre regioni sono censite in `registry/sources.yaml` con stato
`pianificata`: aggiungerle = un connector in `connectors/` + una riga
in `pipeline.py`.

## Attribuzione dati

- **Emilia-Romagna**: dati Arpae / AllertaMeteo Regione ER — citare la fonte
- **Veneto**: dati ARPAV (CC BY 4.0) — citare la fonte
- **Toscana**: dati Regione Toscana / SIR — citare la fonte
- Bollettini di criticità nazionali: Protezione Civile (DPC)

## Roadmap (in ordine di priorità)

1. **Harvest Toscana locale** — l'API SIR blocca gli IP datacenter (429 su
   GitHub Actions): job locale sul Mac (launchd/cron, orario) + push. Il
   connector è pronto, manca solo il job.
2. **Backfill storici** — Dext3r per l'ER e archivi open-data ARPAV per il
   Veneto: accendono i percentili storici, la feature unica del sito.
3. **Soglie ARPAV** — indagine sull'API/app "Fiumi Veneto" o richiesta al
   CFD Veneto: porta l'allerta piena sulle 120 stazioni venete.
4. **Giorno idrologico su fuso Roma** (i percentili ora usano il giorno UTC).
5. **Classificare stazioni lago/diga vs fiume** (Suviana, Ridracoli,
   Molato Diga... leggono quote d'invaso su scale diverse).
6. **Gestione crescita del db** (~10 MB/giorno): retention raw >2 anni con
   medie giornaliere; migrazione su Cloudflare D1 al go-live.
7. **Nuove regioni** — una alla volta, priorità alle API documentate e
   permissive (Lombardia ARPA Socrata, Liguria CFMeteo, Umbria CKAN);
   quelle che bloccano gli IP datacenter seguiranno il modello Toscana
   (harvest locale).
8. **Go-live Cloudflare** — Pages + D1 + cron esterno deterministico
   (sostituisce lo scheduler GitHub, che drifta di ore).
9. **Bot Telegram** per le allerte.

## Deploy (futuro)

1. Repo GitHub **pubblico** (Actions illimitato) → workflow `harvest` (30 min)
   e `nightly` (percentili) già presenti in `.github/workflows/`.
2. Cloudflare free: Pages (hosting statico) + D1 (DB in produzione).
3. Fase 3: bot Telegram per le allerte. Dominio: idrogramma.it (libero a nov 2026).
