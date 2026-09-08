export const TIPOS_EMPREENDIMENTO = [
  'Condomínio Horizontal Fechado',
  'Loteamento Aberto',
  'Outros Empreendimentos',
] as const;

export type TipoEmpreendimentoObra = (typeof TIPOS_EMPREENDIMENTO)[number];

export function isTipoOutros(tipo: string): boolean {
  return tipo === 'Outros Empreendimentos';
}

export function normalizarTipo(tipo?: string): TipoEmpreendimentoObra {
  if (tipo === 'Loteamento Aberto') return 'Loteamento Aberto';
  if (
    tipo === 'Condomínio Horizontal Fechado' ||
    tipo === 'Loteamento Fechado' ||
    tipo === 'Condomínio de Casas'
  ) {
    return 'Condomínio Horizontal Fechado';
  }
  if (!tipo) return 'Condomínio Horizontal Fechado';
  return 'Outros Empreendimentos';
}

export function parseCidadeUf(label: string, ufAtual = 'SP'): { cidade: string; uf: string } {
  const trimmed = label.trim();
  const match = trimmed.match(/^(.*)\s-\s([A-Za-z]{2})$/);
  if (match) {
    return { cidade: match[1].trim(), uf: match[2].toUpperCase() };
  }
  return { cidade: trimmed, uf: (ufAtual || 'SP').toUpperCase().slice(0, 2) };
}

export function labelCidadeUf(cidade: string, uf: string): string {
  if (!cidade) return '';
  return uf ? `${cidade} - ${uf}` : cidade;
}

export function campoObra(obra: object | null | undefined, ...keys: string[]): string {
  if (!obra) return '';
  const rec = obra as Record<string, unknown>;
  for (const key of keys) {
    const value = rec[key];
    if (value !== undefined && value !== null && String(value) !== '') {
      return String(value);
    }
  }
  return '';
}

export function hidratarDecimal(raw: string): string {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function hidratarInteiro(raw: string): string {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n === 0) return '';
  return Math.round(n).toLocaleString('pt-BR');
}

export function maskInteiro(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('pt-BR');
}

export function areaVendavelDivergente(qtd: number, media: number, vendavel: number): boolean {
  if (vendavel <= 0 || qtd <= 0 || media <= 0) return false;
  return Math.abs(vendavel - qtd * media) > 0.05;
}
