import type { Lote, MapaImgTransform } from '../types';

export const VIEWBOX_PADRAO = '0 0 1920 1080';

export const TRANSFORM_PADRAO: MapaImgTransform = { scale: 100, offsetX: 0, offsetY: 0 };

export function parseImgTransform(raw?: MapaImgTransform | null): MapaImgTransform {
  if (!raw) return TRANSFORM_PADRAO;
  return {
    scale: Number(raw.scale) || 100,
    offsetX: Number(raw.offsetX) || 0,
    offsetY: Number(raw.offsetY) || 0,
  };
}

export type StatusLote = 'disponivel' | 'reservado' | 'vendido';

export interface LoteFormData {
  quadra: string;
  numero: string;
  area_m2: number;
  valor_total: number;
  valor_m2: number;
  status: StatusLote;
  svg_path: string;
  label_x?: number;
  label_y?: number;
}

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

export function parseViewBox(viewBox?: string | null): {
  width: number;
  height: number;
  cssAspectRatio: string;
} {
  const parts = (viewBox || VIEWBOX_PADRAO).trim().split(/\s+/).map(Number);
  const width = parts[2] > 0 ? parts[2] : 1920;
  const height = parts[3] > 0 ? parts[3] : 1080;
  return { width, height, cssAspectRatio: `${width} / ${height}` };
}

export function validarSvgPath(path?: string): string | null {
  const d = (path || '').trim();
  if (!d) return 'Informe o SVG Path (coordenadas do polígono).';
  if (!/^M/i.test(d)) return 'O path deve começar com M (moveto).';
  if (!/Z/i.test(d)) return 'O path deve terminar com Z (fechar polígono).';
  return null;
}

export function calcularCentroSvgPath(path: string): { label_x: number; label_y: number } {
  const nums = path.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  if (xs.length === 0) return { label_x: 0, label_y: 0 };
  const label_x = Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
  const label_y = Math.round((ys.reduce((a, b) => a + b, 0) / ys.length) * 100) / 100;
  return { label_x, label_y };
}

export function montarLoteFormPayload(
  form: {
    quadra: string;
    numero: string;
    area: string;
    valor: string;
    status: StatusLote;
    svgPath: string;
  }
): { dados: LoteFormData; erro: string | null } {
  const quadra = form.quadra.trim();
  const numero = form.numero.trim();
  const svg_path = form.svgPath.trim();
  const areaNum = Number(form.area.replace(',', '.'));
  const valorNum = Number(form.valor.replace(/\./g, '').replace(',', '.'));

  if (!quadra) return { dados: {} as LoteFormData, erro: 'Informe a quadra.' };
  if (!numero) return { dados: {} as LoteFormData, erro: 'Informe o número do lote.' };
  const pathErro = validarSvgPath(svg_path);
  if (pathErro) return { dados: {} as LoteFormData, erro: pathErro };
  if (!areaNum || areaNum <= 0) return { dados: {} as LoteFormData, erro: 'Informe uma metragem válida.' };
  if (!valorNum || valorNum <= 0) return { dados: {} as LoteFormData, erro: 'Informe um valor válido.' };

  const centro = calcularCentroSvgPath(svg_path);
  const valor_m2 = Math.round((valorNum / areaNum) * 100) / 100;

  return {
    dados: {
      quadra,
      numero,
      area_m2: areaNum,
      valor_total: valorNum,
      valor_m2,
      status: form.status,
      svg_path,
      label_x: centro.label_x,
      label_y: centro.label_y,
    },
    erro: null,
  };
}
