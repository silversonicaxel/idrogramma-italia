"""Classificazione dello stato di una stazione.

Due dimensioni indipendenti:
  1. classe percentile (vs distribuzione storica dello stesso periodo):
     magra_estrema | magra | norma | piena | piena_estrema
  2. classe soglie regionali anti-piena (dove esistono): allerta_1/2/3
La prima dice "com'e' rispetto alla storia", la seconda "che dice la
Protezione Civile regionale". Entrambe, mai una sola.
"""
from __future__ import annotations

PERCENTILE_CLASSES = [
    "magra_estrema", "magra", "norma", "piena", "piena_estrema",
]

LABELS = {
    "magra_estrema": "magra estrema",
    "magra": "magra",
    "norma": "nella norma",
    "piena": "piena",
    "piena_estrema": "piena estrema",
    "allerta_1": "soglia 1 (attenzione)",
    "allerta_2": "soglia 2 (pregiudizio)",
    "allerta_3": "soglia 3 (emergenza)",
}


def classify_percentile(level_m: float | None, pct: dict | None) -> str | None:
    if level_m is None or not pct or pct.get("p50") is None:
        return None
    if level_m < pct["p5"]:
        return "magra_estrema"
    if level_m < pct["p10"]:
        return "magra"
    if level_m > pct["p95"]:
        return "piena_estrema"
    if level_m > pct["p90"]:
        return "piena"
    return "norma"


def classify_soglie(
    level_m: float | None,
    soglia1: float | None,
    soglia2: float | None,
    soglia3: float | None,
) -> str | None:
    if level_m is None:
        return None
    if soglia3 is not None and level_m >= soglia3:
        return "allerta_3"
    if soglia2 is not None and level_m >= soglia2:
        return "allerta_2"
    if soglia1 is not None and level_m >= soglia1:
        return "allerta_1"
    return None
