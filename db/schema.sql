-- Schema SQLite (compatibile Cloudflare D1). ts sempre ISO-8601 UTC.

CREATE TABLE IF NOT EXISTS stations (
  source     TEXT NOT NULL,
  station_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  lat        REAL NOT NULL,
  lon        REAL NOT NULL,
  kind       TEXT DEFAULT 'fiume',           -- fiume | lago_diga | incerto
  PRIMARY KEY (source, station_id)
);

-- Soglie anti-piena per stazione, con storico (possono cambiare nel tempo).
CREATE TABLE IF NOT EXISTS thresholds (
  source     TEXT NOT NULL,
  station_id TEXT NOT NULL,
  ts         TEXT NOT NULL,
  soglia1    REAL,
  soglia2    REAL,
  soglia3    REAL,
  PRIMARY KEY (source, station_id, ts)
);

CREATE TABLE IF NOT EXISTS readings (
  source     TEXT NOT NULL,
  station_id TEXT NOT NULL,
  ts         TEXT NOT NULL,
  level_m    REAL,
  flow_m3s   REAL,
  PRIMARY KEY (source, station_id, ts)
);

-- Percentili per stazione x giorno dell'anno (finestra ±7 gg, ricalcolo notturno).
CREATE TABLE IF NOT EXISTS percentiles (
  source     TEXT NOT NULL,
  station_id TEXT NOT NULL,
  doy        INTEGER NOT NULL,
  p5 REAL, p10 REAL, p25 REAL, p50 REAL, p75 REAL, p90 REAL, p95 REAL,
  n_obs      INTEGER,
  PRIMARY KEY (source, station_id, doy)
);

-- Stato di salute di ogni fonte: quando si rompe, il sito deve dirlo.
CREATE TABLE IF NOT EXISTS sources_health (
  source          TEXT PRIMARY KEY,
  last_run        TEXT,
  last_success    TEXT,
  last_reading_ts TEXT,
  n_readings      INTEGER,
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts);
