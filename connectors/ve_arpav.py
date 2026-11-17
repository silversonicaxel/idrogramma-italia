"""Veneto — ARPAV, REST "dati in diretta" (rete idrometrica regionale).

Endpoint JSON del portale ARPAV (vedi registry/sources.yaml). Il registro
diceva "feed XML ~146 stazioni": la pagina e' migrata a una REST API che
risponde in JSON con ~120 stazioni LIDRO. Dettagli scoperti sul campo:
  - una riga per stazione: "livello" e' l'ultimo valore trasmesso
    (riferito allo zero locale, spesso negativo), "dataora" lo slot;
  - dataora e aggiornamento sono ora locale italiane (Europe/Rome)
    senza offset: vanno convertite in UTC;
  - livello puo' essere null (stazione muta al momento del feed):
    la stazione resta censita, la lettura no;
  - soglie anti-piena non esposte da questo endpoint -> None;
  - il feed include anche stazioni lago (es. "Lago di Garda a Peschiera
    Navigarda"): kind=incerto finche' non avremo una classificazione pulita;
  - codseqst e' l'identificativo stabile usato da tutto il portale ARPAV.
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import requests

from .base import Connector, Harvest, Reading, Station

FEED_URL = "https://api.arpa.veneto.it/REST/v1/meteo_meteogrammilivello"
ROMEO_TZ = ZoneInfo("Europe/Rome")   # il feed non porta l'offset


class VeArpav(Connector):
    source_id = "ve"
    region = "Veneto"

    def __init__(self, session: requests.Session | None = None):
        self.session = session or requests.Session()

    def harvest(self) -> Harvest:
        resp = self.session.get(FEED_URL, timeout=30)
        resp.raise_for_status()
        rows = resp.json()["data"]

        stations: list[Station] = []
        readings: list[Reading] = []
        for raw in rows:
            sid = str(raw["codseqst"])
            stations.append(
                Station(
                    source=self.source_id,
                    station_id=sid,
                    name=raw.get("nome_stazione") or f"stazione {sid}",
                    lat=float(raw["latitudine"]),
                    lon=float(raw["longitudine"]),
                    kind="incerto",
                )
            )
            if raw.get("livello") is None:
                continue
            ts = datetime.fromisoformat(raw["dataora"]).replace(tzinfo=ROMEO_TZ)
            readings.append(
                Reading(
                    source=self.source_id,
                    station_id=sid,
                    ts=ts.astimezone(ZoneInfo("UTC")),
                    level_m=float(raw["livello"]),
                )
            )

        return Harvest(
            stations=stations,
            readings=readings,
            notes=f"{len(rows)} righe, {len(readings)} con livello",
        )
