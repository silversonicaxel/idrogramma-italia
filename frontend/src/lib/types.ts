// Tipi condivisi del frontend — rispecchiano i JSON generati da core/sitejson.py.

export type Classe =
  | 'magra_estrema'
  | 'magra'
  | 'norma'
  | 'piena'
  | 'piena_estrema'
  | 'allerta_1'
  | 'allerta_2'
  | 'allerta_3'
  | 'osservata'
  | 'nessuna';

export interface BandaStorica {
  p10: number;
  p50: number;
  p90: number;
}

export interface PuntoSerie {
  ts: string;
  level_m: number;
}

export interface Station {
  source: string;
  id: string;
  nome: string;
  kind: string;
  lat: number;
  lon: number;
  livello_m: number | null;
  ts: string | null;
  /** soglie anti-piena regionali 1/2/3; null = non definita */
  soglie: (number | null)[];
  /** classe percentile vs storia (attiva dopo il backfill) */
  classe: Classe | null;
  /** classe soglie Protezione Civile (piena) */
  classe_soglie: Classe | null;
  banda_storica: BandaStorica | null;
  serie: PuntoSerie[];
}

export interface SourceHealth {
  source: string;
  last_run: string | null;
  last_success: string | null;
  last_reading_ts: string | null;
  n_readings: number | null;
  error: string | null;
}

export interface StationsPayload {
  generato: string;
  stazioni: Station[];
}
