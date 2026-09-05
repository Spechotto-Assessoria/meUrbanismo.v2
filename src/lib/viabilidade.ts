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
  /** Entrada paga no ato da venda, % do valor do lote (padrão 20%). */
  entrada_pct?: number;
  /** Número de parcelas do saldo após a entrada (padrão 36). */
  parcelas_meses?: number;
};

/** TMA padrão de mercado para desconto do VPL (% a.a.). */
export const TMA_PADRAO_AA = 12;
/** Entrada padrão (% do valor da venda). */
export const ENTRADA_PADRAO_PCT = 20;
/** Parcelamento padrão do saldo (meses). */
export const PARCELAS_PADRAO = 36;

/** Linhas do orçamento que não entram no custo direto da obra. */
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
  lucro: number;
  margem: number;
  roi: number;
  tirMensal: number | null;
  tirAnual: number | null;
  /** false quando a TIR fica fora de faixa plausível (fluxo degenerado). */
  tirConfiavel: boolean;
  taxaMensalTMA: number;
  vpl: number;
  paybackMeses: number | null;
  fluxo: FluxoMes[];
  exposicaoMaxima: number;
  exposicaoMes: number;
};

/** Soma o orçamento excluindo custos indiretos/administrativos e sugere o %. */
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

/** VGV a partir da tabela de lotes (quantidade × área × valor por m²). */
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

/** Valor presente líquido de uma série mensal (índice 0 = mês 0). */
export function npv(rate: number, flows: number[]): number {
  return flows.reduce((acc, f, i) => acc + f / Math.pow(1 + rate, i), 0);
}

/** TIR por bisseção sobre o fluxo mensal. Retorna null se não convergir. */
export function irr(flows: number[]): number | null {
  const f = (r: number) => npv(r, flows);
  let lo = -0.9999;
  let hi = 1;
  let flo = f(lo);
  let fhi = f(hi);

  let tentativas = 0;
  while (isFinite(flo) && isFinite(fhi) && flo * fhi > 0 && tentativas < 40) {
    hi *= 2;
    fhi = f(hi);
    tentativas++;
  }

  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) {
    let prevR = -0.99;
    let prevV = f(prevR);
    for (let r = -0.98; r <= 10; r += 0.01) {
      const v = f(r);
      if (isFinite(prevV) && isFinite(v) && prevV * v <= 0) {
        lo = prevR;
        hi = r;
        flo = prevV;
        fhi = v;
        break;
      }
      prevR = r;
      prevV = v;
    }
  }
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (!isFinite(fm)) return null;
    if (Math.abs(fm) < 1e-7) return mid;
    if (flo * fm <= 0) {
      hi = mid;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  const r = (lo + hi) / 2;
  return isFinite(r) ? r : null;
}

export function mesesAtePayback(fluxo: FluxoMes[]): number | null {
  return fluxo.find((f) => f.acumulado >= 0 && f.mes > 0)?.mes ?? null;
}

export function mesExposicaoMaxima(fluxo: FluxoMes[]): FluxoMes {
  return fluxo.reduce((a, b) => (b.acumulado < a.acumulado ? b : a), fluxo[0]);
}

/** Curva S (logística) de desembolso da obra: pesos normalizados por mês. */
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

  const custoTotal = i.custo_terreno + custoObraReajustado + custosIndiretos + comissao + impostos;
  const lucro = vgvReajustado - custoTotal;
  const margem = vgvReajustado > 0 ? (lucro / vgvReajustado) * 100 : 0;
  const roi = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  const taxaMensal = Math.pow(1 + i.taxa_minima_aa / 100, 1 / 12) - 1;
  const vpl = npv(taxaMensal, flows);
  const tirMensal = irr(flows);
  const tirAnual = tirMensal != null ? (Math.pow(1 + tirMensal, 12) - 1) * 100 : null;
  const tirConfiavel = tirMensal != null && tirMensal > -0.99 && tirMensal < 0.5;
  const payback = mesesAtePayback(fluxo);
  const pior = mesExposicaoMaxima(fluxo);

  return {
    vgvNominal: i.vgv,
    vgvReajustado,
    custoObraReajustado,
    custosIndiretos,
    comissao,
    impostos,
    custoTotal,
    lucro,
    margem,
    roi,
    tirMensal: tirMensal != null ? tirMensal * 100 : null,
    tirAnual,
    tirConfiavel,
    taxaMensalTMA: taxaMensal * 100,
    vpl,
    paybackMeses: payback,
    fluxo,
    exposicaoMaxima: pior.acumulado,
    exposicaoMes: pior.mes,
  };
}

/** Percentual pt-BR com 2 casas decimais e vírgula: 57,25% */
export const pctBR = (n: number | null | undefined, casas = 2) =>
  n == null || !isFinite(n)
    ? '—'
    : `${n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

/** Moeda BRL sempre com centavos: R$ 40.384.512,00 */
export const brlCents = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Moeda compacta para eixos de gráfico: R$ 15M / R$ 800k */
export const brlShort = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1_000_000) {
    return `${s}R$ ${(a / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: a >= 10_000_000 ? 0 : 1 })}M`;
  }
  if (a >= 1_000) return `${s}R$ ${Math.round(a / 1_000)}k`;
  return `${s}R$ ${Math.round(a)}`;
};
