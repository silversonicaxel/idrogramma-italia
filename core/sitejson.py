"""Genera i JSON che il sito legge (site/data/). Il sito non tocca mai le API."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .status import classify_percentile, classify_soglie

ROOT = Path(__file__).resolve().parent.parent
# i JSON finiscono negli asset statici del frontend SvelteKit (copiati in build/)
DATA_DIR = ROOT / "frontend" / "static" / "data"
SERIES_DAYS = 7


def build(con: sqlite3.Connection) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)

    doy = now.timetuple().tm_yday
    pct_by_station = {
        (r["source"], r["station_id"]): r
        for r in con.execute("SELECT * FROM percentiles WHERE doy=?", (doy,))
    }
    latest = {
        (r["source"], r["station_id"]): r
        for r in con.execute(
            """SELECT r.* FROM readings r
               JOIN (SELECT source, station_id, MAX(ts) mts
                     FROM readings GROUP BY source, station_id) l
                 ON r.source=l.source AND r.station_id=l.station_id
                    AND r.ts=l.mts
               WHERE r.ts >= datetime('now', '-2 days')"""
        )
    }
    series: dict[tuple[str, str], list] = {}
    since = (now - timedelta(days=SERIES_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    for r in con.execute(
        "SELECT source, station_id, ts, level_m FROM readings "
        "WHERE ts >= ? AND level_m IS NOT NULL ORDER BY ts",
        (since,),
    ):
        series.setdefault((r["source"], r["station_id"]), []).append(
            {"ts": r["ts"], "level_m": r["level_m"]}
        )

    stations_out = []
    soglie_query = """
        SELECT s.*, t.soglia1, t.soglia2, t.soglia3
        FROM stations s
        LEFT JOIN thresholds t
          ON t.source = s.source AND t.station_id = s.station_id
         AND t.ts = (SELECT MAX(ts) FROM thresholds t2
                     WHERE t2.source = s.source AND t2.station_id = s.station_id)
        ORDER BY s.name
    """
    for st in con.execute(soglie_query):
        key = (st["source"], st["station_id"])
        last = latest.get(key)
        pct = pct_by_station.get(key)
        level = last["level_m"] if last else None
        stations_out.append({
            "source": st["source"],
            "id": st["station_id"],
            "nome": st["name"],
            "kind": st["kind"],
            "lat": st["lat"],
            "lon": st["lon"],
            "livello_m": level,
            "ts": last["ts"] if last else None,
            "soglie": [st["soglia1"], st["soglia2"], st["soglia3"]],
            "classe": classify_percentile(level, dict(pct) if pct else None),
            "classe_soglie": classify_soglie(
                level, st["soglia1"], st["soglia2"], st["soglia3"]
            ),
            "banda_storica": {
                k: pct[k] for k in ("p10", "p50", "p90")
            } if pct and pct["p50"] is not None else None,
            "serie": series.get(key, []),
        })

    health = [
        dict(r) for r in con.execute("SELECT * FROM sources_health ORDER BY source")
    ]

    (DATA_DIR / "stations.json").write_text(
        json.dumps(
            {"generato": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
             "stazioni": stations_out},
            ensure_ascii=False,
        )
    )
    (DATA_DIR / "sources.json").write_text(
        json.dumps(health, ensure_ascii=False)
    )
