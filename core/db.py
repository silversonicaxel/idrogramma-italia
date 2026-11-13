"""Accesso al DB (SQLite in locale, D1 in produzione: stesso schema SQL)."""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from connectors.base import Harvest

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "idrogramma.db"
SCHEMA_PATH = ROOT / "db" / "schema.sql"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def connect(path: Path = DB_PATH) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA_PATH.read_text())
    return con


def save_harvest(con: sqlite3.Connection, harvest: Harvest) -> int:
    """Scrive stazioni, soglie e letture. Ritorna il n. di letture nuove."""
    con.executemany(
        """INSERT INTO stations (source, station_id, name, lat, lon, kind)
           VALUES (:source, :station_id, :name, :lat, :lon, :kind)
           ON CONFLICT(source, station_id) DO UPDATE SET
             name=excluded.name, lat=excluded.lat, lon=excluded.lon,
             kind=excluded.kind""",
        [s.__dict__ for s in harvest.stations],
    )

    ts = now_iso()
    con.executemany(
        """INSERT OR IGNORE INTO thresholds
             (source, station_id, ts, soglia1, soglia2, soglia3)
           VALUES (:source, :station_id, :ts, :soglia1, :soglia2, :soglia3)""",
        [s.__dict__ | {"ts": ts} for s in harvest.stations],
    )

    before = con.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
    con.executemany(
        """INSERT OR IGNORE INTO readings (source, station_id, ts, level_m, flow_m3s)
           VALUES (:source, :station_id, :ts, :level_m, :flow_m3s)""",
        [
            r.__dict__ | {"ts": r.ts.strftime("%Y-%m-%dT%H:%M:%SZ")}
            for r in harvest.readings
        ],
    )
    after = con.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
    con.commit()
    return after - before


def save_health(
    con: sqlite3.Connection,
    source_id: str,
    ok: bool,
    n_readings: int = 0,
    error: str | None = None,
) -> None:
    ts = now_iso()
    if ok:
        last_reading = con.execute(
            "SELECT MAX(ts) FROM readings WHERE source=?", (source_id,)
        ).fetchone()[0]
        con.execute(
            """INSERT INTO sources_health
                 (source, last_run, last_success, last_reading_ts, n_readings, error)
               VALUES (?,?,?,?,?,NULL)
               ON CONFLICT(source) DO UPDATE SET
                 last_run=excluded.last_run, last_success=excluded.last_success,
                 last_reading_ts=excluded.last_reading_ts,
                 n_readings=excluded.n_readings, error=NULL""",
            (source_id, ts, ts, last_reading, n_readings),
        )
    else:
        con.execute(
            """INSERT INTO sources_health (source, last_run, error)
               VALUES (?,?,?)
               ON CONFLICT(source) DO UPDATE SET
                 last_run=excluded.last_run, error=excluded.error""",
            (source_id, ts, error),
        )
    con.commit()
