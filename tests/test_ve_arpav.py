"""Golden test del connector Veneto su risposta reale salvata.

Quando ARPAV cambia il formato, questo fallisce prima della pipeline:
aggiornare la fixture con cura e verificare cosa cambia davvero.
"""
import json
from pathlib import Path

import requests

from connectors.ve_arpav import VeArpav

FIXTURE = Path(__file__).parent / "fixtures" / "ve_meteo_meteogrammilivello.json"


class _FakeResp:
    def raise_for_status(self):
        pass

    def json(self):
        return {"data": json.loads(FIXTURE.read_text())["data"]}


def _harvest_da_fixture():
    conn = VeArpav()
    conn.session = requests.Session()
    conn.session.get = lambda url, timeout: _FakeResp()   # niente rete nei test
    data = conn.session.get(None, None).json()["data"]
    return data, conn.harvest()


def test_parse_risposta_reale():
    data, h = _harvest_da_fixture()
    assert len(h.stations) == len(data)
    assert len(h.readings) == sum(1 for r in data if r["livello"] is not None)
    assert all(r.level_m is not None for r in h.readings)


def test_coordinate_e_ids():
    data, h = _harvest_da_fixture()
    malcontenta = next(s for s in h.stations if s.name == "A7P - Malcontenta")
    raw = next(r for r in data if r["nome_stazione"] == "A7P - Malcontenta")
    assert malcontenta.station_id == str(raw["codseqst"])
    assert abs(malcontenta.lat - raw["latitudine"]) < 1e-9
    assert abs(malcontenta.lon - raw["longitudine"]) < 1e-9
    assert 44 < malcontenta.lat < 47 and 10 < malcontenta.lon < 14   # sanity: nel Veneto


def test_ora_locale_diventa_utc():
    data, h = _harvest_da_fixture()
    raw = next(r for r in data if r["nome_stazione"] == "A7P - Malcontenta")
    lettura = next(r for r in h.readings if r.station_id == str(raw["codseqst"]))
    # dataora "2026-11-17T07:00:00" e' ora Europe/Rome (CET, +1) -> 06:00Z
    assert lettura.ts.strftime("%Y-%m-%dT%H:%M:%SZ") == "2026-11-17T06:00:00Z"


def test_livelli_negativi_riferiti_zero_locale():
    _, h = _harvest_da_fixture()
    # diversi zero locali veneti sono sotto il livello del mare (es. Adige a Badia Polesine)
    assert any(r.level_m < 0 for r in h.readings)
