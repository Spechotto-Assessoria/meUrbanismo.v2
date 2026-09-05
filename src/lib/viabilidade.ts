import {
  irr,
  mesExposicaoMaxima,
  npv,
  paybackDescontado,
  paybackInterpolado,
  taxaMensalEquivalente,
  tirAnualEfetiva,
  tirConfiavelFaixa,
} from './viabilidade-math';

export type LoteVgv = { descricao: string; quantidade: number; area_m2: number; valor_m2: number };

export type ViabilidadeInput = {
  vgv: number;
  custo_terreno: number;
  custo_obra: number;
  custos_indiretos_pct: number;
  comissao_pct: number;
  impostos_pct: number;
  taxa_minima_aa: number;
  prazo_meses: number;
  prazo_vendas_meses: number;
  /** Reajuste mensal das parcelas de venda (IPCA + prêmio), % a.m. */
  reajuste_receita_pct_am?: number;
  /** Projeção do INCC aplicada ao cronograma de obra, % a.m. */
  incc_pct_am?: number;
  entrada_pct?: number;
  parcelas_meses?: number;
};

export const TMA_PADRAO_AA = 12;
export const ENTRADA_PADRAO_PCT = 20;
export const PARCELAS_PADRAO = 36;
export const LINHA_INDIRETOS = /indiret|administrativ/i;

export type FluxoMes = {
  mes: number;
  receita: number;
  despesa: number;
  saida: number;
  entrada: number;
  liquido: number;
  acumulado: number;
};

export type ViabilidadeResult = {
  vgvNominal: number;
  vgvReajustado: number;
  custoObraReajustado: number;
  custosIndiretos: number;
  comissao: number;
  impostos: number;
  custoTotal: number;
  capitalInvestido: number;
  lucro: number;
  margem: number;
  roi: number;
  tirMensal: number | null;
  tirAnual: number | null;
  /** false se a TIR não for única (Norstrom) ou sair da faixa plausível. */
  tirConfiavel: boolean;
  taxaMensalTMA: number;
  vpl: number;
  paybackMeses: number | null;
  paybackDescontadoMeses: number | null;
  fluxo: FluxoMes[];
  exposicaoMaxima: number;
  exposicaoMes: number;
};

export { npv, irr, taxaMensalEquivalente, paybackInterpolado as mesesAtePayback, mesExposicaoMaxima };

export function custoObraDoOrcamento(
  itens: { descricao?: string | null; valor_total?: number | null }[]
) {
  let direto = 0;
  let indiretos = 0;
  for (const i of itens) {
    const v = Number(i.valor_total) || 0;
    if (LINHA_INDIRETOS.test(i.descricao ?? '')) indiretos += v;
    else direto += v;
  }
  return {
    custoObra: Math.max(0, direto),
    indiretos,
    sugeridoPct: direto > 0 ? (indiretos / direto) * 100 : 0,
  };
}

export function vgvDosLotes(lotes: LoteVgv[]): { vgv: number; area: number } {
  let vgv = 0;
  let area = 0;
  for (const l of lotes) {
    const a = (Number(l.quantidade) || 0) * (Number(l.area_m2) || 0);
    area += a;
    vgv += a * (Number(l.valor_m2) || 0);
  }
  return { vgv, area };
}

/** Curva S (gaussiana) de desembolso da obra: pesos normalizados. */
function curvaSPesos(n: number): number[] {
  const pesos: number[] = [];
  let soma = 0;
  for (let m = 1; m <= n; m++) {
    const t = (m - 0.5) / n;
    const w = Math.exp(-Math.pow((t - 0.5) / 0.28, 2) / 2);
    pesos.push(w);
    soma += w;
  }
  return pesos.map((w) => w / soma);
}

/**
 * Fluxo nominal: IPCA inflaciona vendas/parcelas; INCC inflaciona obra/indiretos.
 * A TMA desconta esse fluxo já inflacionado (consistência Fisher — sem deflacionar).
 */
export function calcViabilidade(i: ViabilidadeInput): ViabilidadeResult {
  const rReceita = (i.reajuste_receita_pct_am ?? 0) / 100;
  const rIncc = (i.incc_pct_am ?? 0) / 100;
  const entradaPct = Math.min(100, Math.max(0, i.entrada_pct ?? ENTRADA_PADRAO_PCT)) / 100;
  const nParcelas = Math.max(1, Math.round(i.parcelas_meses ?? PARCELAS_PADRAO));
  const nObra = Math.max(1, Math.round(i.prazo_meses) || 1);
  const nVendas = Math.max(1, Math.round(i.prazo_vendas_meses) || 1);
  const horizonte = Math.max(nObra, nVendas + nParcelas);

  const pesosObra = curvaSPesos(nObra);
  const indiretosTotal = (i.custo_obra * i.custos_indiretos_pct) / 100;
  const vendaMes = i.vgv / nVendas;

  const recebimentos = new Array<number>(horizonte + 1).fill(0);
  for (let v = 1; v <= nVendas; v++) {
    const valorVenda = vendaMes * Math.pow(1 + rReceita, v);
    const entrada = valorVenda * entradaPct;
    const parcela = (valorVenda - entrada) / nParcelas;
    if (v <= horizonte) recebimentos[v] += entrada;
    for (let p = 1; p <= nParcelas; p++) {
      const m = v + p;
      if (m <= horizonte) recebimentos[m] += parcela * Math.pow(1 + rReceita, p);
    }
  }

  const fluxo: FluxoMes[] = [];
  const flows: number[] = [-i.custo_terreno];
  let acumulado = -i.custo_terreno;
  fluxo.push({
    mes: 0,
    receita: 0,
    despesa: i.custo_terreno,
    saida: i.custo_terreno,
    entrada: 0,
    liquido: -i.custo_terreno,
    acumulado,
  });

  let vgvReajustado = 0;
  let custoObraReajustado = 0;
  let custosIndiretos = 0;
  let comissao = 0;
  let impostos = 0;

  for (let m = 1; m <= horizonte; m++) {
    const receita = recebimentos[m] ?? 0;
    const peso = m <= nObra ? pesosObra[m - 1] : 0;
    const obraMes = i.custo_obra * peso * Math.pow(1 + rIncc, m);
    const indiretosMes = indiretosTotal * peso * Math.pow(1 + rIncc, m);
    const comissaoMes =
      m <= nVendas ? (vendaMes * Math.pow(1 + rReceita, m) * i.comissao_pct) / 100 : 0;
    const impostosMes = (receita * i.impostos_pct) / 100;
    const despesa = obraMes + indiretosMes + comissaoMes + impostosMes;

    vgvReajustado += receita;
    custoObraReajustado += obraMes;
    custosIndiretos += indiretosMes;
    comissao += comissaoMes;
    impostos += impostosMes;

    const liquido = receita - despesa;
    acumulado += liquido;
    flows.push(liquido);
    fluxo.push({ mes: m, receita, despesa, saida: despesa, entrada: receita, liquido, acumulado });
  }

  const capitalInvestido = i.custo_terreno + custoObraReajustado + custosIndiretos;
  const custoTotal = capitalInvestido + comissao + impostos;
  const lucro = vgvReajustado - custoTotal;
  const margem = vgvReajustado > 0 ? (lucro / vgvReajustado) * 100 : 0;
  const roi = capitalInvestido > 0 ? (lucro / capitalInvestido) * 100 : 0;

  const taxaMensal = taxaMensalEquivalente(i.taxa_minima_aa);
  const vpl = npv(taxaMensal, flows);
  const tirMensal = irr(flows);
  const tirAnual = tirMensal != null ? tirAnualEfetiva(tirMensal) : null;
  const pior = mesExposicaoMaxima(fluxo);

  return {
    vgvNominal: i.vgv,
    vgvReajustado,
    custoObraReajustado,
    custosIndiretos,
    comissao,
    impostos,
    custoTotal,
    capitalInvestido,
    lucro,
    margem,
    roi,
    tirMensal: tirMensal != null ? tirMensal * 100 : null,
    tirAnual,
    tirConfiavel: tirConfiavelFaixa(tirMensal, flows),
    taxaMensalTMA: taxaMensal * 100,
    vpl,
    paybackMeses: paybackInterpolado(fluxo),
    paybackDescontadoMeses: paybackDescontado(flows, taxaMensal),
    fluxo,
    exposicaoMaxima: pior.acumulado,
    exposicaoMes: pior.mes,
  };
}

export const pctBR = (n: number | null | undefined, casas = 2) =>
  n == null || !isFinite(n)
    ? '—'
    : `${n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export const mesesBR = (n: number | null | undefined) =>
  n == null || !isFinite(n)
    ? '—'
    : `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} meses`;

export const brlCents = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const brlShort = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1_000_000) {
    return `${s}R$ ${(a / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: a >= 10_000_000 ? 0 : 1 })}M`;
  }
  if (a >= 1_000) return `${s}R$ ${Math.round(a / 1_000)}k`;
  return `${s}R$ ${Math.round(a)}`;
};
