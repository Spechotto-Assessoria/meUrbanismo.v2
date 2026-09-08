import { brlCents, pctBR } from './viabilidade';
import {
  calcViabilidadeInicial,
  type ViabilidadeInicialInput,
  type ViabilidadeInicialResult,
} from './viabilidade-inicial';
import type {
  AlertaViabilidade,
  DiagnosticoViabilidade,
  SugestaoViabilidade,
} from './viabilidade-diagnostico';

const ITERACOES = 40;
const PRECO_TETO = 1e9;

function calc(input: ViabilidadeInicialInput): ViabilidadeInicialResult {
  return calcViabilidadeInicial(input);
}

function vplOk(r: ViabilidadeInicialResult) {
  return r.vpl >= 0;
}

/** Break-even do simulador global = caixa acumulado simples (não descontado). */
function temBreakEven(r: ViabilidadeInicialResult) {
  return r.mesBreakEven != null && isFinite(r.mesBreakEven);
}

function minimoQuePassa(
  input: ViabilidadeInicialInput,
  chave: 'valorVendaM2' | 'prazoObraMeses' | 'prazoVendasMeses',
  lo: number,
  hi: number,
  ok: (r: ViabilidadeInicialResult) => boolean
) {
  for (let i = 0; i < ITERACOES; i++) {
    const mid = (lo + hi) / 2;
    if (ok(calc({ ...input, [chave]: mid }))) hi = mid;
    else lo = mid;
  }
  return hi;
}

function maximoCustoQuePassa(input: ViabilidadeInicialInput, lo: number, hi: number) {
  for (let i = 0; i < ITERACOES; i++) {
    const mid = (lo + hi) / 2;
    if (vplOk(calc({ ...input, custoM2Privativo: mid }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

function valorVendaParaVplZero(input: ViabilidadeInicialInput): number | null {
  if (vplOk(calc(input))) return null;
  let hi = Math.max(input.valorVendaM2 * 2, 1);
  for (let i = 0; i < 20; i++) {
    if (vplOk(calc({ ...input, valorVendaM2: hi }))) break;
    hi *= 2;
    if (hi > PRECO_TETO) return null;
  }
  if (!vplOk(calc({ ...input, valorVendaM2: hi }))) return null;
  return minimoQuePassa(input, 'valorVendaM2', Math.max(0, input.valorVendaM2), hi, vplOk);
}

function custoM2ParaVplZero(input: ViabilidadeInicialInput): number | null {
  if (input.custoM2Privativo <= 0 || vplOk(calc(input))) return null;
  if (!vplOk(calc({ ...input, custoM2Privativo: 0 }))) return null;
  return maximoCustoQuePassa(input, 0, input.custoM2Privativo);
}

function prazoObraParaBreakEven(input: ViabilidadeInicialInput): number | null {
  const atual = Math.max(1, Math.round(input.prazoObraMeses) || 1);
  if (temBreakEven(calc(input))) return null;
  if (!temBreakEven(calc({ ...input, prazoObraMeses: 1 }))) return null;
  return minimoQuePassa(input, 'prazoObraMeses', 1, atual, temBreakEven);
}

function prazoVendasParaBreakEven(input: ViabilidadeInicialInput): number | null {
  const atual = Math.max(1, Math.round(input.prazoVendasMeses) || 1);
  if (temBreakEven(calc(input))) return null;
  if (!temBreakEven(calc({ ...input, prazoVendasMeses: 1 }))) return null;
  return minimoQuePassa(input, 'prazoVendasMeses', 1, atual, temBreakEven);
}

function sugestaoPreco(input: ViabilidadeInicialInput, precoAlvo: number): SugestaoViabilidade | null {
  if (!(precoAlvo > input.valorVendaM2 + 0.01)) return null;
  const tma = pctBR(input.taxaDescontoAA, 0);
  const alta =
    input.valorVendaM2 > 0
      ? ((precoAlvo - input.valorVendaM2) / input.valorVendaM2) * 100
      : null;
  const delta = alta != null ? ` (+${pctBR(alta, 0)})` : '';
  return {
    id: 'preco',
    titulo: 'VGV / preço de venda abaixo da TMA',
    texto: `Reajuste o valor de venda por m² privativo (card Financeiro), de ${brlCents(input.valorVendaM2)}/m² para ${brlCents(precoAlvo)}/m²${delta}, para zerar o VPL na TMA de ${tma} a.a.`,
  };
}

function sugestaoCusto(input: ViabilidadeInicialInput, custoAlvo: number): SugestaoViabilidade | null {
  const corte = input.custoM2Privativo - custoAlvo;
  if (corte < input.custoM2Privativo * 0.01 && corte < 1) return null;
  const pctCorte = input.custoM2Privativo > 0 ? (corte / input.custoM2Privativo) * 100 : 0;
  const tma = pctBR(input.taxaDescontoAA, 0);
  return {
    id: 'custo_obra',
    titulo: 'Custo da obra elevado',
    texto: `Reduza o custo por m² privativo (card Financeiro) em ${pctBR(pctCorte, 0)} — de ${brlCents(input.custoM2Privativo)}/m² para ${brlCents(custoAlvo)}/m² — para zerar o VPL na TMA de ${tma} a.a. Otimize a infraestrutura ou revise o orçamento global.`,
  };
}

function sugestaoFluxo(
  input: ViabilidadeInicialInput,
  prazoObraAlvo: number | null,
  prazoVendasAlvo: number | null
): SugestaoViabilidade | null {
  const partes: string[] = [];
  const prazoObraAtual = Math.max(1, Math.round(input.prazoObraMeses) || 1);
  const prazoVendasAtual = Math.max(1, Math.round(input.prazoVendasMeses) || 1);

  if (prazoObraAlvo != null && prazoObraAlvo < prazoObraAtual) {
    partes.push(
      `reduza o prazo da obra (card Projeção temporal) de ${prazoObraAtual} para até ${Math.ceil(prazoObraAlvo)} meses`
    );
  }
  if (prazoVendasAlvo != null && prazoVendasAlvo < prazoVendasAtual) {
    partes.push(
      `antecipe as vendas reduzindo o prazo de comercialização de ${prazoVendasAtual} para até ${Math.ceil(prazoVendasAlvo)} meses`
    );
  }
  if (partes.length === 0) return null;

  return {
    id: 'fluxo',
    titulo: 'Fluxo de caixa / payback estourado',
    texto: `O caixa acumulado não atinge break-even no horizonte simulado. ${partes.join(' e/ou ')}, para melhorar o retorno ao longo do fluxo.`,
  };
}

export function diagnosticarViabilidadeInicial(opts: {
  input: ViabilidadeInicialInput;
  resultado: ViabilidadeInicialResult;
}): DiagnosticoViabilidade {
  const { input, resultado } = opts;
  const alertas: AlertaViabilidade[] = [];

  if (resultado.vpl < 0) alertas.push('vpl_negativo');
  if (resultado.margemBruta < 0 || resultado.margemPct < 0) alertas.push('lucro_negativo');
  if (!temBreakEven(resultado)) alertas.push('payback_nao_atingido');

  if (alertas.length === 0) return { alertas, sugestoes: [] };

  const sugestoes: SugestaoViabilidade[] = [];
  const precisaRetorno = alertas.includes('vpl_negativo') || alertas.includes('lucro_negativo');

  if (precisaRetorno) {
    const precoAlvo = valorVendaParaVplZero(input);
    if (precoAlvo != null) {
      const s = sugestaoPreco(input, precoAlvo);
      if (s) sugestoes.push(s);
    }
    const custoAlvo = custoM2ParaVplZero(input);
    if (custoAlvo != null) {
      const s = sugestaoCusto(input, custoAlvo);
      if (s) sugestoes.push(s);
    }
  }

  const timing =
    alertas.includes('payback_nao_atingido') ||
    (resultado.vpl < 0 && resultado.margemBruta >= 0);
  if (timing) {
    const s = sugestaoFluxo(
      input,
      prazoObraParaBreakEven(input),
      prazoVendasParaBreakEven(input)
    );
    if (s) sugestoes.push(s);
  }

  return { alertas, sugestoes: sugestoes.slice(0, 3) };
}
