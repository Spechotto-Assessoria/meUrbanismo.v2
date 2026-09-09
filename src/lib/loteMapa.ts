import type { Lote } from '../types';

export const VIEWBOX_PADRAO = '0 0 1200 800';

export type StatusLote = 'disponivel' | 'reservado' | 'vendido';

export function normalizeStatus(status?: string): StatusLote {
  const s = (status || 'disponivel').toLowerCase();
  if (s === 'reservado') return 'reservado';
  if (s === 'vendido') return 'vendido';
  return 'disponivel';
}

export interface CoresLote {
  fill: string;
  stroke: string;
  fillHover: string;
  label: string;
  badgeClass: string;
}

export function coresLotePorStatus(status?: string): CoresLote {
  switch (normalizeStatus(status)) {
    case 'reservado':
      return {
        fill: 'rgba(245, 158, 11, 0.45)',
        stroke: '#d97706',
        fillHover: 'rgba(245, 158, 11, 0.62)',
        label: 'Reservado',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'vendido':
      return {
        fill: 'rgba(220, 38, 38, 0.45)',
        stroke: '#b91c1c',
        fillHover: 'rgba(220, 38, 38, 0.62)',
        label: 'Vendido',
        badgeClass: 'bg-red-50 text-red-800 border-red-200',
      };
    default:
      return {
        fill: 'rgba(16, 185, 129, 0.45)',
        stroke: '#059669',
        fillHover: 'rgba(16, 185, 129, 0.62)',
        label: 'Disponível',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
  }
}

export function formatBRL(valor?: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export function lotesComSvg(lotes: Lote[]): Lote[] {
  return lotes.filter((l) => Boolean(l.svg_path?.trim()));
}

export function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().includes('.pdf');
}
