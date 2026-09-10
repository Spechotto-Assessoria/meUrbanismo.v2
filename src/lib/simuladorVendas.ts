/** Taxa embutida mensal fixa para Tabela Price (0,5% a.m.). */
export const TAXA_EMBUTIDA_MENSAL = 0.005;

export const PRAZO_PADRAO = 120;
export const PRAZO_MAXIMO = 144;
export const ENTRADA_PADRAO_PCT = 10;

export const OPCOES_ENTRADA = [10, 15, 20, 30] as const;
export const OPCOES_BALOES = [0, 2, 4, 8, 10] as const;

export const OPCOES_CORRECAO = [
  'IPCA + 0.5% a.m.',
  'INCC + 0.5% a.m.',
] as const;

export type IndiceCorrecao = (typeof OPCOES_CORRECAO)[number];

export interface ParametrosSimulacao {
  valorLote: number;
  percEntrada: number;
  prazo: number;
  qtdBaloes: number;
  valorBalao: number;
}

export interface ResultadoSimulacao {
  valorEntrada: number;
  totalBaloes: number;
  saldoFinanciar: number;
  parcelaMensal: number;
}

/** Fator da Tabela Price para taxa e prazo informados. */
export function fatorPrice(taxaMensal: number, prazo: number): number {
  if (prazo <= 0) return 0;
  if (taxaMensal <= 0) return 1 / prazo;
  const base = 1 + taxaMensal;
  const potencia = Math.pow(base, prazo);
  return (taxaMensal * potencia) / (potencia - 1);
}

/** Calcula entrada, saldo e parcela mensal via Tabela Price. */
export function calcularSimulacao(params: ParametrosSimulacao): ResultadoSimulacao {
  const valorLote = Math.max(0, params.valorLote);
  const valorEntrada = (valorLote * params.percEntrada) / 100;
  const totalBaloes = params.qtdBaloes * Math.max(0, params.valorBalao);
  const saldoFinanciar = Math.max(0, valorLote - valorEntrada - totalBaloes);
  const prazo = Math.min(PRAZO_MAXIMO, Math.max(1, params.prazo));
  const parcelaMensal = saldoFinanciar > 0
    ? Math.round(saldoFinanciar * fatorPrice(TAXA_EMBUTIDA_MENSAL, prazo))
    : 0;

  return { valorEntrada, totalBaloes, saldoFinanciar, parcelaMensal };
}

export function labelLote(quadra?: string, numero?: string): string {
  const q = quadra?.trim() || '—';
  const n = numero?.trim() || '—';
  return `Lote ${q}-${n}`;
}
