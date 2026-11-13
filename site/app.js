// Idrogramma — mappa delle stazioni + pannello con grafico Plotly.
// Legge SOLO site/data/*.json, mai le API pubbliche.

const COLORI = {
  magra_estrema: "#b2182b",
  magra: "#ef8a62",
  norma: "#66c2a5",
  piena: "#67a9cf",
  piena_estrema: "#2166ac",
  allerta_1: "#fecc5c",   // ambra gialla: ben distinta dal salmone di "magra"
  allerta_2: "#d95f02",
  allerta_3: "#7f0000",
  osservata: "#7f8c8d",      // ha dati, nessuna allerta, percentili ancora mancano
  nessuna: "#cfd8dc",        // davvero senza dati recenti
};

const ETICHETTE = {
  magra_estrema: "magra estrema", magra: "magra", norma: "nella norma",
  piena: "piena", piena_estrema: "piena estrema",
  allerta_1: "soglia 1 — attenzione (piena)",
  allerta_2: "soglia 2 — pregiudizio (piena)",
  allerta_3: "soglia 3 — emergenza (piena)",
  osservata: "nessuna allerta",
  nessuna: "senza dati recenti",
};

function classeStazione(s) {
  if (s.classe_soglie) return s.classe_soglie;
  if (s.classe) return s.classe;
  return s.livello_m == null ? "nessuna" : "osservata";
}

function coloreStazione(s) {
  return COLORI[classeStazione(s)];
}

function fmtLivello(v) {
  return v === null || v === undefined ? "—" : `${v.toFixed(2)} m`;
}

function fmtOra(ts) {
  return ts ? ts.replace("T", " ").replace("Z", " UTC") : "mai";
}

// oggetti stazione VERI per id: al click le proprietà delle feature MapLibre
// arrivano serializzate a stringa (array -> testo), inutilizzabili per il pannello
const STAZIONI = new Map();

// Bottone "legenda" come control della mappa (stesso stile degli zoom)
class LegendaControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    const btn = document.createElement("button");
    btn.className = "maplibregl-ctrl-legenda";
    btn.type = "button";
    btn.title = "Legenda";
    btn.setAttribute("aria-label", "Legenda");
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">' +
      '<circle cx="5" cy="5" r="3" fill="#b2182b"/>' +
      '<circle cx="5" cy="10" r="3" fill="#66c2a5"/>' +
      '<circle cx="5" cy="15" r="3" fill="#2166ac"/>' +
      '<rect x="10" y="3.5" width="8" height="3" rx="1.5" fill="#666"/>' +
      '<rect x="10" y="8.5" width="8" height="3" rx="1.5" fill="#666"/>' +
      '<rect x="10" y="13.5" width="8" height="3" rx="1.5" fill="#666"/></svg>';
    btn.onclick = () =>
      document.getElementById("legenda").classList.toggle("aperta");
    this._container.appendChild(btn);
    return this._container;
  }
  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

async function init() {
  const [stationsRes, sourcesRes] = await Promise.all([
    fetch("data/stations.json"),
    fetch("data/sources.json"),
  ]);
  const { generato, stazioni } = await stationsRes.json();
  const fonti = await sourcesRes.json();
  stazioni.forEach((s) => STAZIONI.set(`${s.source}:${s.id}`, s));

  // footer: stato di salute delle fonti + citazione
  document.getElementById("fonti").textContent =
    `Dati aggiornati: ${fmtOra(generato)} · Fonti: ` +
    fonti.map((f) =>
      `${f.source} ${f.error ? "⚠ in errore" : "ok (ultima lettura " + fmtOra(f.last_reading_ts) + ")"}`
    ).join(" · ") +
    " · Dati Arpae/AllertaMeteo Regione Emilia-Romagna";

  const map = new maplibregl.Map({
    container: "mappa",
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: [11.3, 44.5],
    zoom: 7.5,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
  map.addControl(new LegendaControl());
  window.__map = map;   // handle per test/debug (project, queryRenderedFeatures)

  // MapLibre non richiama funzioni JS nelle espressioni: proprietà precalcolate
  const geojson = {
    type: "FeatureCollection",
    features: stazioni.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        ...s,
        colore: coloreStazione(s),
        sottozero: s.livello_m != null && s.livello_m < 0,
      },
    })),
  };

  map.on("load", () => {
    map.addSource("stazioni", { type: "geojson", data: geojson });
    map.addLayer({
      id: "cerchi",
      type: "circle",
      source: "stazioni",
      paint: {
        "circle-color": ["get", "colore"],
        "circle-radius": 7,
        // anello rosso per le stazioni sotto lo zero idrometrico (secca oggettiva)
        // NB: match() qui non accetta booleani, serve case/==
        "circle-stroke-width": [
          "case", ["==", ["get", "sottozero"], true], 2.5, 1,
        ],
        "circle-stroke-color": [
          "case", ["==", ["get", "sottozero"], true], "#b2182b", "#fff",
        ],
      },
    });

    map.on("click", "cerchi", (e) => {
      const p = e.features[0].properties;
      const stazione = STAZIONI.get(`${p.source}:${p.id}`);
      if (stazione) apriPannello(stazione);   // oggetto vero, non le proprietà serializzate
    });
    map.on("mouseenter", "cerchi", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "cerchi", () => {
      map.getCanvas().style.cursor = "";
    });
  });
}

function apriPannello(s) {
  const panel = document.getElementById("pannello");
  panel.hidden = false;
  document.getElementById("p-nome").textContent = s.nome;

  const classe = classeStazione(s);
  const dettaglio = classe === "osservata" && s.soglie && s.soglie[0] !== null
    ? ` — livello sotto la soglia 1 di piena (${s.soglie[0]} m)` : "";
  const secca = s.livello_m != null && s.livello_m < 0
    ? `<div style="margin-top:6px"><b style="color:#b2182b">⚠ sotto lo zero idrometrico ` +
      `(${s.livello_m.toFixed(2)} m)</b> — livello più basso del riferimento fisso ` +
      `della stazione: secca oggettiva</div>`
    : "";
  document.getElementById("p-info").innerHTML =
    `<b style="color:${coloreStazione(s)}">${ETICHETTE[classe] || classe}${dettaglio}</b><br>` +
    `Livello: <b>${fmtLivello(s.livello_m)}</b> · aggiornato ${fmtOra(s.ts)}<br>` +
    `Soglie regionali: ${(s.soglie || []).map((v) => v === null ? "—" : v).join(" / ") || "—"} m<br>` +
    (s.banda_storica
      ? `Banda storica oggi: p10 ${s.banda_storica.p10} · p50 ${s.banda_storica.p50} · p90 ${s.banda_storica.p90} m`
      : "Banda storica: non ancora disponibile (serve il backfill)") + secca;

  const serie = s.serie || [];
  const tracce = [{
    x: serie.map((p) => p.ts),
    y: serie.map((p) => p.level_m),
    type: "scatter",
    mode: "lines+markers",   // col singolo punto di adesso la linea non esiste ancora
    name: "livello",
    line: { color: "#2166ac", width: 2 },
    marker: { size: 7 },
  }];
  if (s.banda_storica && serie.length) {
    tracce.push({
      x: serie.map((p) => p.ts),
      y: serie.map(() => s.banda_storica.p50),
      type: "scatter", mode: "lines", name: "mediana storica",
      line: { color: "#66c2a5", dash: "dot" },
    });
  }

  try {
    Plotly.newPlot(
      "p-grafico",
      tracce,
      {
        margin: { t: 8, r: 8, b: 36, l: 42 },
        yaxis: { title: "livello (m)" },
        showlegend: false,
      },
      { responsive: true }
    );
  } catch (err) {   // il grafico non deve mai svuotare il pannello
    document.getElementById("p-grafico").textContent =
      "grafico non disponibile: " + err.message;
  }
}

document.getElementById("chiudi").onclick = () => {
  document.getElementById("pannello").hidden = true;
};

init();
