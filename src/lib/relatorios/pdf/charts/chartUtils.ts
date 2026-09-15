export type ChartSize = { width: number; height: number; pad: number };

export function escalaLinear(valor: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((valor - min) / (max - min)) * (outMax - outMin);
}

export function maxValor(vals: number[]): number {
  const m = Math.max(...vals, 0);
  return m > 0 ? m : 1;
}

export function arcoDonut(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number
): string {
  const x1o = cx + rOuter * Math.cos(start);
  const y1o = cy + rOuter * Math.sin(start);
  const x2o = cx + rOuter * Math.cos(end);
  const y2o = cy + rOuter * Math.sin(end);
  const x1i = cx + rInner * Math.cos(end);
  const y1i = cy + rInner * Math.sin(end);
  const x2i = cx + rInner * Math.cos(start);
  const y2i = cy + rInner * Math.sin(start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i} Z`;
}

export function calloutDonut(
  cx: number,
  cy: number,
  rOuter: number,
  midAngle: number,
  extensao: number,
  distTexto: number
) {
  const xBorda = cx + rOuter * Math.cos(midAngle);
  const yBorda = cy + rOuter * Math.sin(midAngle);
  const xFim = cx + (rOuter + extensao) * Math.cos(midAngle);
  const yFim = cy + (rOuter + extensao) * Math.sin(midAngle);
  const xTexto = cx + (rOuter + distTexto) * Math.cos(midAngle);
  const yTexto = cy + (rOuter + distTexto) * Math.sin(midAngle);
  return { xBorda, yBorda, xFim, yFim, xTexto, yTexto };
}
