import {
  brlCents,
  calcViabilidade,
  pctBR,
  type ViabilidadeInput,
  type ViabilidadeResult,
} from './viabilidade';

export type AlertaViabilidade = 'vpl_negativo' | 'lucro_negativo' | 'payback_nao_atingido';

export type SugestaoViabilidade = {
  id: 'preco' | 'custo_obra' | 'fluxo';
  titulo: string;
  texto: string;
};

export type DiagnosticoViabilidade = {
  alertas: AlertaViabilidade[];
  sugestoes: SugestaoViabilidade[];
};

export const ROTULO_ALERTA: Record<AlertaViabilidade, string> = {
  vpl_negativo: 'VPL negativo',
  lucro_negativo: 'Lucro/margem negativos',
  payback_nao_atingido: 'Payback não atingido',
};

const ITERACOES = 40;
const VGV_TETO = 1e12;

function temPayback(r: ViabilidadeResult) {
  return r.paybackDescontadoMeses != null && isFinite(r.paybackDescontadoMeses);
}

function vplOk(r: ViabilidadeResult) {
  return r.vpl >= 0;
}

/** Mínimo de `chave` em (lo, hi] que satisfaz o predicado. `lo` falha, `hi` passa. */
function minimoQuePassa(
  input: ViabilidadeInput,
  chave: 'vgv' | 'entrada_pct',
  lo: number,
  hi: number,
  ok: (r: ViabilidadeResult) => boolean
) {
  for (let i = 0; i < ITERACOES; i++) {
    const mid = (lo + hi) / 2;
    if (ok(calcViabilidade({ ...input, [chave]: mid }))) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Máximo de `custo_obra` em [lo, hi) que ainda zera o VPL. `lo` passa, `hi` falha. */
function maximoCustoQuePassa(input: ViabilidadeInput, lo: number, hi: number) {
  for (let i = 0; i < ITERACOES; i++) {
    const mid = (lo + hi) / 2;
    if (vplOk(calcViabilidade({ ...input, custo_obra: mid }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

function vgvParaVplZero(input: ViabilidadeInput): number | null {
  if (vplOk(calcViabilidade(input))) return null;
  let hi = Math.max(input.vgv * 2, (input.custo_obra + input.custo_terreno) * 2, 1);
  for (let i = 0; i < 20; i++) {
    if (vplOk(calcViabilidade({ ...input, vgv: hi }))) break;
    hi *= 2;
    if (hi > VGV_TETO) return null;
  }
  if (!vplOk(calcViabilidade({ ...input, vgv: hi }))) return null;
  return minimoQuePassa(input, 'vgv', Math.max(0, input.vgv), hi, vplOk);
}

function custoObraParaVplZero(input: ViabilidadeInput): number | null {
  if (input.custo_obra <= 0 || vplOk(calcViabilidade(input))) return null;
  if (!vplOk(calcViabilidade({ ...input, custo_obra: 0 }))) return null;
  return maximoCustoQuePassa(input, 0, input.custo_obra);
}

function entradaParaPayback(input: ViabilidadeInput): number | null {
  const atual = Math.min(100, Math.max(0, input.entrada_pct ?? 0));
  if (temPayback(calcViabilidade(input))) return null;
  if (!temPayback(calcViabilidade({ ...input, entrada_pct: 100 }))) return null;
  return minimoQuePassa(input, 'entrada_pct', atual, 100, temPayback);
}

function sugestaoPreco(
  input: ViabilidadeInput,
  vgvAlvo: number,
  precoM2: number,
  areaM2: number,
  fonteVgv: 'lotes' | 'm2'
): SugestaoViabilidade | null {
  if (!(vgvAlvo > input.vgv + 1)) return null;
  const tma = pctBR(input.taxa_minima_aa, 0);
  if (areaM2 > 0 && precoM2 >= 0) {
    const precoAlvo = vgvAlvo / areaM2;
    const alta = precoM2 > 0 ? ((precoAlvo - precoM2) / precoM2) * 100 : null;
    const delta = alta != null ? ` (+${pctBR(alta, 0)})` : '';
    const onde =
      fonteVgv === 'lotes'
        ? 'Revise a tabela de preços dos lotes para elevar o m² médio'
        : 'Reajuste o preço médio de venda no campo R$/m² desta aba';
    return {
      id: 'preco',
      titulo: 'VGV / preço de venda abaixo da TMA',
      texto: `${onde}, de ${brlCents(precoM2)}/m² para ${brlCents(precoAlvo)}/m²${delta}, para zerar o VPL na TMA de ${tma} a.a.`,
    };
  }
  const alta = input.vgv > 0 ? ((vgvAlvo - input.vgv) / input.vgv) * 100 : null;
  const delta = alta != null ? ` (+${pctBR(alta, 0)})` : '';
  return {
    id: 'preco',
    titulo: 'VGV / preço de venda abaixo da TMA',
    texto: `Eleve o VGV de ${brlCents(input.vgv)} para ${brlCents(vgvAlvo)}${delta}, para zerar o VPL na TMA de ${tma} a.a.`,
  };
}

function sugestaoCusto(input: ViabilidadeInput, custoAlvo: number): SugestaoViabilidade | null {
  const corte = input.custo_obra - custoAlvo;
  if (corte < input.custo_obra * 0.01 && corte < 1000) return null;
  const pctCorte = input.custo_obra > 0 ? (corte / input.custo_obra) * 100 : 0;
  return {
    id: 'custo_obra',
    titulo: 'Custo da obra elevado',
    texto: `O orçamento de infraestrutura está pesando no retorno. Uma redução de ${pctBR(pctCorte, 0)} — de ${brlCents(input.custo_obra)} para ${brlCents(custoAlvo)} — zera o VPL na TMA. Otimize custos de infraestrutura ou revise o orçamento global da obra.`,
  };
}

function sugestaoFluxo(input: ViabilidadeInput, entradaAlvo: number): SugestaoViabilidade {
  const atual = input.entrada_pct ?? 0;
  const prazo = Math.max(1, Math.round(input.prazo_meses) || 1);
  return {
    id: 'fluxo',
    titulo: 'Fluxo de caixa / payback estourado',
    texto: `O caixa descontado não vira positivo no horizonte simulado. Aumente a entrada na venda de ${pctBR(atual, 0)} para pelo menos ${pctBR(entradaAlvo, 0)} e/ou reduza o prazo de execução da obra (hoje ${prazo} meses) na Auditoria de premissas, para antecipar recebimentos.`,
  };
}

export function diagnosticarViabilidade(opts: {
  input: ViabilidadeInput;
  resultado: ViabilidadeResult;
  precoM2: number;
  areaM2: number;
  fonteVgv: 'lotes' | 'm2';
}): DiagnosticoViabilidade {
  const { input, resultado, precoM2, areaM2, fonteVgv } = opts;
  const alertas: AlertaViabilidade[] = [];
  if (resultado.vpl < 0) alertas.push('vpl_negativo');
  if (resultado.lucro < 0 || resultado.margem < 0) alertas.push('lucro_negativo');
  if (!temPayback(resultado)) alertas.push('payback_nao_atingido');

  if (alertas.length === 0) return { alertas, sugestoes: [] };

  const sugestoes: SugestaoViabilidade[] = [];
  const precisaRetorno = alertas.includes('vpl_negativo') || alertas.includes('lucro_negativo');

  if (precisaRetorno) {
    const vgvAlvo = vgvParaVplZero(input);
    if (vgvAlvo != null) {
      const s = sugestaoPreco(input, vgvAlvo, precoM2, areaM2, fonteVgv);
      if (s) sugestoes.push(s);
    }
    const custoAlvo = custoObraParaVplZero(input);
    if (custoAlvo != null) {
      const s = sugestaoCusto(input, custoAlvo);
      if (s) sugestoes.push(s);
    }
  }

  const timing =
    alertas.includes('payback_nao_atingido') ||
    (resultado.vpl < 0 && resultado.lucro >= 0);
  if (timing) {
    const entradaAlvo = entradaParaPayback(input);
    if (entradaAlvo != null) sugestoes.push(sugestaoFluxo(input, entradaAlvo));
  }

  return { alertas, sugestoes: sugestoes.slice(0, 3) };
}
