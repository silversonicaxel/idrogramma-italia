"""Interfaccia comune di tutti i connector.

Un connector per fonte regionale: è l'UNICA parte di codice per-regione.
Tutto ciò che produce (Station/Reading) è già nello schema canonico,
così core/ non sa nulla delle differenze regionali.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Station:
    source: str
    station_id: str
    name: str
    lat: float
    lon: float
    kind: str = "fiume"                     # fiume | lago_diga | incerto
    soglia1: float | None = None            # soglie anti-piena regionali, m
    soglia2: float | None = None
    soglia3: float | None = None


@dataclass
class Reading:
    source: str
    station_id: str
    ts: datetime                            # sempre UTC
    level_m: float | None = None            # livello, m (riferito allo zero locale)
    flow_m3s: float | None = None           # portata, m3/s (se disponibile)


@dataclass
class Harvest:
    stations: list[Station]
    readings: list[Reading]
    notes: str = ""


class Connector(ABC):
    source_id: str = "??"
    region: str = "??"

    @abstractmethod
    def harvest(self) -> Harvest:
        """Scarica e restituisce stazioni + letture recenti nello schema canonico."""
