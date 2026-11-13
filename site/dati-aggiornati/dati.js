// Pagina "Dati aggiornati": stato delle fonti + tabella stazioni con filtro.
// Legge SOLO site/data/*.json (percorsi relativi: funziona anche in sottocartelle).

const COLORI = {
  magra_estrema: "#b2182b", magra: "#ef8a62", norma: "#66c2a5",
  piena: "#67a9cf", piena_estrema: "#2166ac",
  allerta_1: "#fecc5c", allerta_2: "#d95f02", allerta_3: "#7f0000",
};
const ETICHETTE = {
  magra_estrema: "magra estrema", magra: "magra", norma: "nella norma",
  piena: "piena", piena_estrema: "piena estrema",
  allerta_1: "soglia 1", allerta_2: "soglia 2", allerta_3: "soglia 3",
};

const fmtOra = (ts) => (ts ? ts.replace("T", " ").replace("Z", " UTC") : "—");
const fmtLiv = (v) => (v === null || v === undefined ? "—" : v.toFixed(2));

function badge(s) {
  const classe = s.classe_soglie || s.classe;
  if (classe) {
    return `<span class="badge" style="background:${COLORI[classe]}">` +
           `${ETICHETTE[classe] || classe}</span>`;
  }
  const secca = s.livello_m != null && s.livello_m < 0
    ? ' <span class="badge" style="background:#b2182b">sotto lo zero</span>'
    : "";
  return s.livello_m == null
    ? '<span style="color:#999">senza dati recenti</span>'
    : `<span class="badge" style="background:#7f8c8d">nessuna allerta</span>${secca}`;
}

async function init() {
  const [sourcesRes, stationsRes] = await Promise.all([
    fetch("../data/sources.json"),
    fetch("../data/stations.json"),
  ]);
  const fonti = await sourcesRes.json();
  const { stazioni } = await stationsRes.json();

  document.querySelector("#t-fonti tbody").innerHTML = fonti.map((f) => `
    <tr>
      <td>${f.source}</td>
      <td>${fmtOra(f.last_run)}</td>
      <td>${fmtOra(f.last_reading_ts)}</td>
      <td class="num">${f.n_readings ?? "—"}</td>
      <td>${f.error
        ? `<span class="badge" style="background:#7f0000">⚠ ${f.error}</span>`
        : '<span class="badge" style="background:#2e7d32">ok</span>'}</td>
    </tr>`).join("");

  const tbody = document.querySelector("#t-stazioni tbody");
  const righe = (filtro = "") => stazioni
    .filter((s) => s.nome.toLowerCase().includes(filtro.toLowerCase()))
    .map((s) => `
      <tr>
        <td>${s.nome}</td>
        <td class="num">${fmtLiv(s.livello_m)}</td>
        <td>${fmtOra(s.ts)}</td>
        <td>${badge(s)}</td>
        <td>${(s.soglie || []).map((v) => (v === null ? "—" : v)).join(" / ")}</td>
        <td>${s.source}</td>
      </tr>`).join("");
  tbody.innerHTML = righe();

  document.getElementById("filtro").addEventListener("input", (e) => {
    tbody.innerHTML = righe(e.target.value);
  });
}

init();
