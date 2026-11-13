#!/usr/bin/env python3
"""Entrypoint della pipeline.

  python pipeline.py            # harvest + build (ogni 30 min da Actions)
  python pipeline.py nightly    # ricalcolo percentili + build (job notturno)

Aggiungere una regione = aggiungere una classe in connectors/ e una riga
in REGISTRY qui sotto. Tutto il resto e' condiviso.
"""
from __future__ import annotations

import argparse
import sys

from connectors import ErAllertaMeteo
from core import db, percentiles, sitejson

# Binding fonte -> connector. `enabled` rispecchia registry/sources.yaml.
REGISTRY = {
    "er": ErAllertaMeteo,
}
ENABLED = ["er"]


def harvest() -> int:
    con = db.connect()
    exit_code = 0
    for source_id in ENABLED:
        connector = REGISTRY[source_id]()
        try:
            result = connector.harvest()
            nuovi = db.save_harvest(con, result)
            db.save_health(con, source_id, ok=True, n_readings=len(result.readings))
            print(
                f"[{source_id}] OK: {len(result.stations)} stazioni, "
                f"{len(result.readings)} letture ({nuovi} nuove)"
            )
        except Exception as exc:  # la fonte non deve mai fermare le altre
            db.save_health(con, source_id, ok=False, error=str(exc)[:500])
            print(f"[{source_id}] ERRORE: {exc}", file=sys.stderr)
            exit_code = 1
    con.close()
    return exit_code


def nightly() -> None:
    con = db.connect()
    n = percentiles.recompute(con)
    print(f"percentili ricalcolati: {n} righe (stazione x giorno)")
    sitejson.build(con)
    con.close()


def build() -> None:
    con = db.connect()
    sitejson.build(con)
    con.close()
    print("site/data/ aggiornato")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline Idrogramma")
    parser.add_argument(
        "command",
        nargs="?",
        default="harvest",
        choices=["harvest", "nightly", "build"],
    )
    args = parser.parse_args()
    if args.command == "harvest":
        # il sito va aggiornato comunque: mostra anche lo stato "fonte in errore"
        code = harvest()
        build()
        sys.exit(code)
    elif args.command == "nightly":
        nightly()
    else:
        build()
