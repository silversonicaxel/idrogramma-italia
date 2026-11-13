"""Ricalcolo notturno dei percentili: stazione x giorno dell'anno.

Media giornaliera dei livelli, finestra +-7 giorni attorno al giorno
dell'anno (con wrap a cavallo di fine anno), quantili al 5%.
Serve storia: finche' il backfill non c'e', la tabella resta vuota e
il sito mostra solo le soglie regionali.

TODO roadmap: giorno idrologico su fuso Roma (qui si usa il giorno UTC).
"""
from __future__ import annotations

import sqlite3
from datetime import date
from statistics import quantiles

WINDOW_DAYS = 7
MIN_YEARS = 5     # anni distinti di storia, sotto non ha senso
MIN_OBS = 30      # osservazioni nella finestra (5 anni x ~15 giorni x copertura)


def _daily_means(con: sqlite3.Connection) -> dict[tuple[str, str], dict[str, float]]:
    rows = con.execute(
        "SELECT source, station_id, ts, level_m FROM readings WHERE level_m IS NOT NULL"
    ).fetchall()
    daily: dict[tuple[str, str], dict[str, list[float]]] = {}
    for r in rows:
        day = r["ts"][:10]                      # giorno UTC (TODO: fuso Roma)
        daily.setdefault((r["source"], r["station_id"]), {}).setdefault(
            day, []
        ).append(r["level_m"])
    return {
        k: {d: sum(v) / len(v) for d, v in series.items()}
        for k, series in daily.items()
    }


def recompute(con: sqlite3.Connection) -> int:
    out = []
    for (source, sid), series in _daily_means(con).items():
        by_doy: dict[int, list[float]] = {}
        years: set[int] = set()
        for day, mean in series.items():
            d = date.fromisoformat(day)
            by_doy.setdefault(d.timetuple().tm_yday, []).append(mean)
            years.add(d.year)
        if len(years) < MIN_YEARS:
            continue
        for doy in range(1, 367):
            vals = [
                m for d, means in by_doy.items() for m in means
                if min(abs(d - doy), 365 - abs(d - doy)) <= WINDOW_DAYS
            ]
            if len(vals) < MIN_OBS:
                continue
            q = quantiles(vals, n=20, method="inclusive")  # tagli ogni 5%
            out.append(
                (source, sid, doy, q[0], q[1], q[4], q[9], q[14], q[17], q[18], len(vals))
            )

    con.execute("DELETE FROM percentiles")
    con.executemany(
        """INSERT INTO percentiles
             (source, station_id, doy, p5, p10, p25, p50, p75, p90, p95, n_obs)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        out,
    )
    con.commit()
    return len(out)
