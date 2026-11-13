/// <reference types="vite/client" />
import type { Map as MaplibreMap } from 'maplibre-gl';

declare global {
  interface Window {
    /** handle di debug/test sulla mappa MapLibre (project, queryRenderedFeatures) */
    __map?: MaplibreMap;
  }
}

export {};
