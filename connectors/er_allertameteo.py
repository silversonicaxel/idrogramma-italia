"""Emilia-Romagna — portale AllertaMeteo (rete Arpae).

Endpoint JSON ricavato dal traffico del portale (vedi registry/sources.yaml).
Dettagli scoperti sul campo:
  - variabile B13215 = livello idrometrico, metri;
  - senza il parametro time (epoch ms su griglia 15 minuti) i value sono null;
  - non tutte le stazioni trasmettono su ogni slot: si guarda indietro
    alcuni slot tenendo per ogni stazione la lettura piu' recente;
  - coordinate come gradi decimali x100000, interi;
  - soglia = 0 significa "non definita" -> None;
  - il feed include anche stazioni lago/diga (es. "Molato Diga"): kind=incerto
    finche' non avremo una classificazione pulita;
  - e stazioni FUORI regione: il Po a monte (Piemonte/Lombardia) che Arpae
    ripubblica per il monitoraggio delle piene in arrivo, piu' Conca Diga
    (Marche). Quelle in REGIONE_FUORI_ER dichiarano la regione vera; tutte
    le altre ereditano la regione della fonte in sitejson.
"""
from __future__ import annotations

import sqlite3
import time
from datetime import datetime, timezone

import requests

from .base import Connector, Harvest, Reading, Station

SENSORS_URL = (
    "https://allertameteo.regione.emilia-romagna.it"
    "/o/api/allerta/get-sensor-values"
)
TIME_SERIES_URL = (
    "https://allertameteo.regione.emilia-romagna.it"
    "/o/api/allerta/get-time-series/"
)
VARIABILE_LIVELLO = "254,0,0/1,-,-,-/B13215"
SLOT_SEC = 900        # griglia di trasmissione: 15 minuti
SLOTS_BACK = 5        # guarda indietro 75' per assorbire i ritardi di rete

# idstazione -> regione reale per le stazioni che Arpae ripubblica nel suo
# feed ma stanno fuori Emilia-Romagna (corridoio del Po a monte + Conca Diga).
# Se Arpae ne aggiunge altre, basta una riga qui: il golden test le verifica.
REGIONE_FUORI_ER = {
    "3959": "Piemonte",        # Carignano Po
    "5403": "Piemonte",        # Casale Monferrato Po
    "5421": "Piemonte",        # Ponte Valenza Po
    "5386": "Piemonte",        # Isola S.Antonio PO
    "12753": "Lombardia",      # Casei Gerola Po
    "12815": "Lombardia",      # Ponte Becca Po
    "12850": "Lombardia",      # Spessa Po
    "53072": "Marche",         # Conca Diga
}


def _slot_epoch_ms(back: int = 0) -> int:
    now = int(time.time())
    return (now - now % SLOT_SEC - back * SLOT_SEC) * 1000


class ErAllertaMeteo(Connector):
    source_id = "er"
    region = "Emilia-Romagna"

    def __init__(self, session: requests.Session | None = None):
        self.session = session or requests.Session()

    def _fetch_slot(self, back: int) -> list[dict]:
        resp = self.session.get(
            SENSORS_URL,
            params={"variabile": VARIABILE_LIVELLO, "time": _slot_epoch_ms(back)},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def harvest(self) -> Harvest:
        stations: dict[str, Station] = {}
        latest: dict[str, Reading] = {}

        for back in range(SLOTS_BACK):
            ts = datetime.fromtimestamp(_slot_epoch_ms(back) / 1000, tz=timezone.utc)
            for raw in self._fetch_slot(back):
                sid = str(raw["idstazione"])
                stations.setdefault(
                    sid,
                    Station(
                        source=self.source_id,
                        station_id=sid,
                        name=raw.get("nomestaz") or f"stazione {sid}",
                        lat=int(raw["lat"]) / 100_000,
                        lon=int(raw["lon"]) / 100_000,
                        kind="incerto",
                        regione=REGIONE_FUORI_ER.get(sid),
                        soglia1=raw.get("soglia1") or None,
                        soglia2=raw.get("soglia2") or None,
                        soglia3=raw.get("soglia3") or None,
                    ),
                )
                value = raw.get("value")
                if value is not None and sid not in latest:
                    latest[sid] = Reading(
                        source=self.source_id,
                        station_id=sid,
                        ts=ts,
                        level_m=float(value),
                    )

        return Harvest(
            stations=list(stations.values()),
            readings=list(latest.values()),
            notes=f"{SLOTS_BACK} slot interrogati",
        )

    def catch_up(self, con: sqlite3.Connection) -> int:
        """Recupera dal time-series API la serie densa (15 min) delle ultime ~70h.

        Il feed dei valori correnti (sondaggio su 75') vede solo le trasmissioni
        che cadono nel momento giusto: i sensori che trasmettono raramente
        (es. montagna) vengono catturati sparsamente, con buchi di ore. Il
        backend conserva comunque la serie completa a 15 minuti: questa
        passata (notturna) la riversa nel db con INSERT OR IGNORE, riempiendo
        i buchi. Ritorna il numero di letture nuove inserite.
        """
        ids = [r[0] for r in con.execute("SELECT station_id FROM stations WHERE source='er'")]
        inserite = 0
        errori = 0
        for sid in ids:
            try:
                resp = self.session.get(
                    TIME_SERIES_URL,
                    params={"stazione": sid, "variabile": VARIABILE_LIVELLO},
                    timeout=30,
                )
                resp.raise_for_status()
                for punto in resp.json():
                    livello = punto.get("v")
                    if livello is None:
                        continue
                    ts = datetime.fromtimestamp(
                        int(punto["t"]) / 1000, tz=timezone.utc
                    ).strftime("%Y-%m-%dT%H:%M:%SZ")
                    cur = con.execute(
                        "INSERT OR IGNORE INTO readings (source, station_id, ts, level_m) "
                        "VALUES ('er', ?, ?, ?)",
                        (sid, ts, float(livello)),
                    )
                    inserite += cur.rowcount
            except Exception:
                errori += 1
        if errori:
            print(f"catch_up er: {errori} stazioni con errori (saltate)")
        return inserite
