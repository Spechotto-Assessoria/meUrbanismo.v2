export type ChartSize = { width: number; height: number; pad: number };

export function escalaLinear(valor: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((valor - min) / (max - min)) * (outMax - outMin);
}

export function maxValor(vals: number[]): number {
  const m = Math.max(...vals, 0);
  return m > 0 ? m : 1;
}
