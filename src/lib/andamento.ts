import type { AndamentoEtapa } from '../types';

export const clampPct = (n: number) => Math.max(0, Math.min(100, n));

export function progressoPonderado(
  etapas: AndamentoEtapa[],
  campo: 'realizado' | 'previsto'
): number {
  if (etapas.length === 0) return 0;
  const somaValor = etapas.reduce((a, e) => a + (Number(e.valor_total) || 0), 0);
  if (somaValor > 0) {
    const acc = etapas.reduce(
      (a, e) => a + ((Number(e[campo]) || 0) / 100) * (Number(e.valor_total) || 0),
      0
    );
    return (acc / somaValor) * 100;
  }
  const somaPeso = etapas.reduce((a, e) => a + (Number(e.peso_fracao) || 0), 0);
  if (somaPeso > 0) {
    return etapas.reduce((a, e) => a + (Number(e[campo]) || 0) * (Number(e.peso_fracao) || 0), 0);
  }
  return etapas.reduce((a, e) => a + (Number(e[campo]) || 0), 0) / etapas.length;
}
