"""Toscana — SIR (Sistema Informativo Regionale Ambientale), rete idrometrica.

API del portale sir.toscana.it, scoperta dal traffico della pagina
/idrometria-pub (non documentata pubblicamente):
  - lista stazioni: monitoraggio/actions.php?action=list&type_gauge=idro
    -> GeoJSON con le ~195 stazioni idrometriche (feature PIATTE:
    IDStazione "TOS...", Nome, Lat/Lon come stringhe, Provincia, Fiume)
  - letture: monitoraggio/actions.php?action=station&id=TOS...
    -> gruppi per sensore; per le idrometriche c'e' il gruppo "idro":
       {"date": "20/11/2026 23:30:00", "value": "0.31"} — dataora locale
       italiana (Europe/Rome) senza offset, valore come stringa
  - una chiamata per stazione: 195 richieste per harvest (~1 min)
  - nessun endpoint storico pubblico trovato -> nessun catch_up (il
    valore del dettaglio e' solo l'ultimo snapshot orario di ARPAV/CFR)
  - soglie non esposte -> None (le soglie Toscana sono documenti del CFR,
    da integrare eventualmente in futuro)
  - il feed include anche stazioni lago/invaso: kind=incerto
"""
from __future__ import annotations

import time
from datetime import datetime
from zoneinfo import ZoneInfo

import requests

from .base import Connector, Harvest, Reading, Station

FEED_URL = "https://www.sir.toscana.it/monitoraggio/actions.php"
ROMEO_TZ = ZoneInfo("Europe/Rome")   # il feed non porta l'offset
PAUSA_SEC = 0.8                      # l'API SIR ha rate limiting (429 oltre)


class TosSir(Connector):
    source_id = "tos"
    region = "Toscana"

    def __init__(self, session: requests.Session | None = None):
        self.session = session or requests.Session()

    def harvest(self) -> Harvest:
        resp = self.session.get(
            FEED_URL, params={"action": "list", "type_gauge": "idro"}, timeout=30
        )
        resp.raise_for_status()
        feats = resp.json()["features"]

        stations: list[Station] = []
        readings: list[Reading] = []
        for feat in feats:
            sid = feat["IDStazione"]
            stations.append(
                Station(
                    source=self.source_id,
                    station_id=sid,
                    name=feat.get("Nome") or f"stazione {sid}",
                    lat=float(feat["Lat"]),
                    lon=float(feat["Lon"]),
                    kind="incerto",
                )
            )

            # una chiamata per stazione: l'elenco non porta i valori
            time.sleep(PAUSA_SEC)
            det = None
            for attesa in (0, 15, 30, 45):  # rate limiting: backoff progressivo
                if attesa:
                    time.sleep(attesa)
                det = self.session.get(
                    FEED_URL, params={"action": "station", "id": sid}, timeout=30
                )
                if det.status_code != 429:
                    break
            det.raise_for_status()
            idro = det.json().get("idro")
            if not idro or idro.get("value") in (None, "", "-"):
                continue
            ts = datetime.strptime(idro["date"], "%d/%m/%Y %H:%M:%S").replace(
                tzinfo=ROMEO_TZ
            )
            readings.append(
                Reading(
                    source=self.source_id,
                    station_id=sid,
                    ts=ts.astimezone(ZoneInfo("UTC")),
                    level_m=float(idro["value"]),
                )
            )

        return Harvest(
            stations=stations,
            readings=readings,
            notes=f"{len(feats)} stazioni idrometriche SIR",
        )
