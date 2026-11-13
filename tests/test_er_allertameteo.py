"""Golden test del connector ER su risposta reale salvata.

Quando Arpae cambia il formato, questo fallisce prima della pipeline:
aggiornare la fixture con cura e verificare cosa cambia davvero.
"""
import json
from pathlib import Path

from connectors.er_allertameteo import ErAllertaMeteo

FIXTURE = Path(__file__).parent / "fixtures" / "er_get_sensor_values.json"


def _harvest_da_fixture():
    data = json.loads(FIXTURE.read_text())
    conn = ErAllertaMeteo()
    conn._fetch_slot = lambda back: data   # niente rete nei test
    return data, conn.harvest()


def test_parse_risposta_reale():
    data, h = _harvest_da_fixture()
    assert len(h.stations) == len(data)
    assert len(h.readings) == sum(1 for s in data if s.get("value") is not None)
    assert all(r.level_m is not None for r in h.readings)


def test_conversione_coordinate():
    data, h = _harvest_da_fixture()
    suviana = next(s for s in h.stations if s.name == "Suviana")
    raw = next(s for s in data if s["nomestaz"] == "Suviana")
    assert abs(suviana.lat - int(raw["lat"]) / 100_000) < 1e-9
    assert abs(suviana.lon - int(raw["lon"]) / 100_000) < 1e-9
    assert 40 < suviana.lat < 47 and 6 < suviana.lon < 14   # sanity: dentro l'ER


def test_soglia_zero_diventa_none():
    _, h = _harvest_da_fixture()
    # alcune stazioni nel feed hanno soglia 0 = non definita -> None
    assert any(s.soglia1 is None for s in h.stations)
    assert any(s.soglia2 is not None and s.soglia2 > 0 for s in h.stations)
