// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Map as MaplibreMap } from 'maplibre-gl';

declare global {
  interface Window {
    /** handle di debug/test sulla mappa MapLibre (project, queryRenderedFeatures) */
    __map?: MaplibreMap;
  }
}

export {};
