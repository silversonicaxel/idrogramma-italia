"""Genera frontend/static/data/fonti.json dal registro (registry/sources.yaml).

La pagina /fonti elenca per ogni regione la fonte dei dati: una sola fonte di
verità (il registro), arricchita con lo stato live (sources_health) per le
fonti attive. Aggiungere una regione = una voce in sources.yaml.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import yaml

from . import db
from .sitejson import DATA_DIR

REGISTRO = db.ROOT / "registry" / "sources.yaml"
LIVE_KEYS = ("last_run", "last_success", "last_reading_ts", "n_readings", "error")


def build(con: sqlite3.Connection) -> None:
    registro = yaml.safe_load(REGISTRO.read_text())["sources"]
    health = {r["source"]: dict(r) for r in con.execute("SELECT * FROM sources_health")}

    fonti = []
    for s in registro:
        h = health.get(s["id"])
        live = {k: h.get(k) for k in LIVE_KEYS} if h else None
        fonti.append({
            "id": s["id"],
            "regione": s["regione"],
            "ente": s["ente"],
            "portale": s.get("portale"),
            "tipo": s["tipo"],
            "stato": s["stato"],
            "note": (s.get("note") or "").strip(),
            "licenza": s.get("licenza"),
            "live": live,
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (Path(DATA_DIR) / "fonti.json").write_text(
        json.dumps(
            {"generato": db.now_iso(), "fonti": fonti},
            ensure_ascii=False,
        )
    )
