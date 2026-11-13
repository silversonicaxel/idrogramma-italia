# Idrogramma — lo stato dei fiumi italiani

Per ogni stazione idrometrica: il livello di oggi confrontato con la distribuzione
storica dello stesso periodo dell'anno. Due estremi, un solo strumento:
**magra estrema ←→ piena estrema**.

## Stato

Scheletro funzionante: pipeline Emilia-Romagna (fonte AllertaMeteo/Arpae),
DB SQLite, motore percentili/soglie, sito statico MapLibre + Plotly.

## Quickstart

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python pipeline.py            # harvest + build dei JSON del sito
python pipeline.py nightly    # ricalcolo percentili (job notturno)
pytest                        # golden test dei connector (fixture reali)

python -m http.server -d site 8000   # il sito è in http://127.0.0.1:8000
```

## Architettura

```
connectors/   una classe per fonte — l'UNICA parte di codice per-regione
registry/     sources.yaml: fonti note, endpoint, abilitazione
core/         db · percentiles · status · sitejson (condiviso, region-agnostic)
db/           schema.sql (SQLite in locale, Cloudflare D1 in produzione)
site/         statico: MapLibre (tiles OpenFreeMap) + Plotly.js
pipeline.py   entrypoint: harvest | nightly | build
```

Regole del progetto:

- il sito legge **solo** i JSON generati in `site/data/`, mai le API pubbliche;
- ogni run registra lo stato di salute della fonte in `sources_health`
  (quando una fonte si rompe, il sito deve dirlo, non mostrare dati stantii);
- ogni connector ha un golden test su fixture reale in `tests/fixtures/`
  (quando il formato cambia, il test fallisce prima della pipeline).

## Fonte Emilia-Romagna (attiva)

Portale AllertaMeteo Regione ER. Endpoint JSON non documentato ufficialmente
(`registry/sources.yaml` per dettagli e note); la variabile `B13215` è il
livello idrometrico. Dati forniti da Arpae — citare sempre la fonte.

## Deploy (futuro)

1. Repo GitHub **pubblico** (Actions illimitato) → workflow `harvest` (30 min)
   e `nightly` (percentili) già presenti in `.github/workflows/`.
2. Cloudflare free: Pages (hosting statico) + D1 (DB in produzione).
3. Fase 3: bot Telegram per le allerte. Dominio: idrogramma.it (libero a nov 2026).

## Roadmap

- [ ] backfill storico ER (export Dext3r, CSV) → percentili reali
- [ ] giorno idrologico su fuso Roma (ora i percentili usano il giorno UTC)
- [ ] classificare stazioni lago/diga vs fiume (es. "Molato Diga", "Suviana")
- [ ] soglie di magra per-regione (le soglie 1/2/3 sono solo anti-piena)
- [ ] baseline storica nazionale GloFAS (rianalisi Copernicus)
- [ ] connector: Veneto (ARPAV XML), Trentino (CKAN), DPC bollettini
