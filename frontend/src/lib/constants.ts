// Costanti e helper condivisi tra le pagine (ex constants di app.js/dati.js).
import type { Classe, Station } from '$lib/types';

export const COLORI: Record<Classe, string> = {
  magra_estrema: '#b2182b',
  magra: '#ef8a62',
  norma: '#66c2a5',
  piena: '#67a9cf',
  piena_estrema: '#2166ac',
  allerta_1: '#fecc5c', // ambra gialla: ben distinta dal salmone di "magra"
  allerta_2: '#d95f02',
  allerta_3: '#7f0000',
  osservata: '#7f8c8d', // ha dati, nessuna allerta, percentili ancora mancano
  nessuna: '#cfd8dc', // davvero senza dati recenti
};

export const ETICHETTE: Record<Classe, string> = {
  magra_estrema: 'magra estrema',
  magra: 'magra',
  norma: 'nella norma',
  piena: 'piena',
  piena_estrema: 'piena estrema',
  allerta_1: 'soglia 1 — attenzione (piena)',
  allerta_2: 'soglia 2 — pregiudizio (piena)',
  allerta_3: 'soglia 3 — emergenza (piena)',
  osservata: 'nessuna allerta',
  nessuna: 'senza dati recenti',
};

export function classeStazione(s: Station): Classe {
  if (s.classe_soglie) return s.classe_soglie;
  if (s.classe) return s.classe;
  return s.livello_m == null ? 'nessuna' : 'osservata';
}

export function coloreStazione(s: Station): string {
  return COLORI[classeStazione(s)];
}

export function sottoZero(s: Station): boolean {
  return s.livello_m != null && s.livello_m < 0;
}

export function fmtLivello(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${v.toFixed(2)} m`;
}

export function fmtOra(ts: string | null | undefined): string {
  return ts ? ts.replace('T', ' ').replace('Z', ' UTC') : '—';
}
