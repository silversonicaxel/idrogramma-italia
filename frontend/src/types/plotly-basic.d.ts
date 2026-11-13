// Il bundle plotly.js-basic-dist-min non include tipi: dichiariamo solo
// l'API che usiamo (scatter via newPlot/react + purge).
declare module 'plotly.js-basic-dist-min' {
  export interface PlotlyStatic {
    newPlot(
      gd: unknown,
      data: unknown[],
      layout?: Record<string, unknown>,
      config?: Record<string, unknown>
    ): unknown;
    react(
      gd: unknown,
      data: unknown[],
      layout?: Record<string, unknown>,
      config?: Record<string, unknown>
    ): unknown;
    purge(gd: unknown): void;
  }
  const Plotly: PlotlyStatic;
  export default Plotly;
}
