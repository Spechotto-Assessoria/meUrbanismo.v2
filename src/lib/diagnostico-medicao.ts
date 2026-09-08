import type { PontoPdf } from '../types/diagnostico';

export function distanciaPontos(a: PontoPdf, b: PontoPdf): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function comprimentoPolyline(pontos: PontoPdf[]): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    total += distanciaPontos(pontos[i - 1], pontos[i]);
  }
  return total;
}

/** Área pelo método do laço (shoelace), em unidades² do PDF. */
export function areaPoligono(pontos: PontoPdf[]): number {
  if (pontos.length < 3) return 0;
  let soma = 0;
  const n = pontos.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    soma += pontos[i].x * pontos[j].y - pontos[j].x * pontos[i].y;
  }
  return Math.abs(soma) / 2;
}

export function metrosLineares(pontos: PontoPdf[], metrosPorUnidade: number): number {
  return comprimentoPolyline(pontos) * metrosPorUnidade;
}

export function metrosQuadrados(pontos: PontoPdf[], metrosPorUnidade: number): number {
  return areaPoligono(pontos) * metrosPorUnidade * metrosPorUnidade;
}

export function formatarMedida(valor: number, unidade: 'm' | 'm²', casas = 2): string {
  if (!Number.isFinite(valor)) return '—';
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  })} ${unidade}`;
}

export function idMedicao(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
