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
    finche' non avremo una classificazione pulita.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import requests

from .base import Connector, Harvest, Reading, Station

SENSORS_URL = (
    "https://allertameteo.regione.emilia-romagna.it"
    "/o/api/allerta/get-sensor-values"
)
VARIABILE_LIVELLO = "254,0,0/1,-,-,-/B13215"
SLOT_SEC = 900        # griglia di trasmissione: 15 minuti
SLOTS_BACK = 5        # guarda indietro 75' per assorbire i ritardi di rete


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
