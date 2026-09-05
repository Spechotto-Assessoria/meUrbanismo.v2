import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/supabase';
import type { Obra } from '../types';
import {
  calcViabilidade,
  custoObraDoOrcamento,
  ENTRADA_PADRAO_PCT,
  PARCELAS_PADRAO,
  TMA_PADRAO_AA,
  vgvDosLotes,
  type ViabilidadeResult,
} from '../lib/viabilidade';

export type PremissasObra = {
  preco_m2: number;
  custo_terreno: number;
  custos_indiretos_pct: number;
  comissao_pct: number;
  impostos_pct: number;
  taxa_minima_aa: number;
  prazo_meses: number;
  prazo_vendas_meses: number;
  reajuste_receita_pct_am: number;
  incc_pct_am: number;
  entrada_pct: number;
  parcelas_meses: number;
};

export const PREMISSAS_DEFAULT: PremissasObra = {
  preco_m2: 650,
  custo_terreno: 0,
  custos_indiretos_pct: 10,
  comissao_pct: 5,
  impostos_pct: 6,
  taxa_minima_aa: TMA_PADRAO_AA,
  prazo_meses: 24,
  prazo_vendas_meses: 60,
  reajuste_receita_pct_am: 0.4,
  incc_pct_am: 0.5,
  entrada_pct: ENTRADA_PADRAO_PCT,
  parcelas_meses: PARCELAS_PADRAO,
};

function lerNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parsePremissas(raw: unknown): Partial<PremissasObra> {
  if (!raw || typeof raw !== 'object') return {};
  const p = raw as Record<string, unknown>;
  const out: Partial<PremissasObra> = {};
  (Object.keys(PREMISSAS_DEFAULT) as (keyof PremissasObra)[]).forEach((k) => {
    if (p[k] != null && Number.isFinite(Number(p[k]))) out[k] = Number(p[k]);
  });
  return out;
}

export function useViabilidadeObra(obraId?: string, obra?: Obra | null) {
  const [form, setForm] = useState<PremissasObra>(PREMISSAS_DEFAULT);
  const [orcamento, setOrcamento] = useState({ custoObra: 0, indiretos: 0, sugeridoPct: 0 });
  const [vgvLotes, setVgvLotes] = useState(0);
  const [areaLotes, setAreaLotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const areaGleba = obra?.area_total_m2 || obra?.areaM2 || 0;
  const areaVendavel = areaGleba > 0 ? areaGleba * 0.55 : 0;
  const qtdLotes = obra?.total_lotes || obra?.qtdLotes || 0;

  const carregar = useCallback(async () => {
    if (!obraId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const [orcs, row, lotes] = await Promise.all([
        apiService.getOrcamentos(obraId),
        apiService.getViabilidade(obraId),
        apiService.getLotes(obraId),
      ]);
      const orc = custoObraDoOrcamento(orcs);
      setOrcamento(orc);

      const calc = vgvDosLotes(
        (lotes || []).map((l) => ({
          descricao: `${l.quadra ?? ''}-${l.numero ?? ''}`,
          quantidade: 1,
          area_m2: Number(l.area_m2) || 0,
          valor_m2: Number(l.valor_m2) || 0,
        }))
      );
      setVgvLotes(calc.vgv);
      setAreaLotes(calc.area);

      const saved = parsePremissas(row?.premissas);
      const next: PremissasObra = { ...PREMISSAS_DEFAULT, ...saved };
      if (saved.custos_indiretos_pct == null && orc.sugeridoPct > 0) {
        next.custos_indiretos_pct = Number(orc.sugeridoPct.toFixed(2));
      }
      if (saved.custo_terreno == null && row?.custo_terreno) {
        next.custo_terreno = lerNum(row.custo_terreno, 0);
      }
      setForm(next);
      setDirty(false);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar a viabilidade.');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const vgv = vgvLotes > 0 ? vgvLotes : areaVendavel * form.preco_m2;
  const fonteVgv: 'lotes' | 'm2' = vgvLotes > 0 ? 'lotes' : 'm2';
  const precoEfetivoM2 =
    fonteVgv === 'lotes' && areaLotes > 0 ? vgvLotes / areaLotes : form.preco_m2;

  const resultado: ViabilidadeResult = useMemo(
    () =>
      calcViabilidade({
        ...form,
        vgv,
        custo_obra: orcamento.custoObra,
      }),
    [form, vgv, orcamento.custoObra]
  );

  const setPremissa = (key: keyof PremissasObra, value: number) => {
    setForm((f) => ({ ...f, [key]: Number.isFinite(value) ? value : 0 }));
    setDirty(true);
    setSucesso(null);
  };

  const aplicarIndiretosSugeridos = () => {
    setPremissa('custos_indiretos_pct', Number(orcamento.sugeridoPct.toFixed(2)));
  };

  const salvar = async () => {
    if (!obraId) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiService.saveViabilidade({
        obra_id: obraId,
        premissas: form,
        area_total: areaVendavel || areaLotes || undefined,
        quantidade_lotes: qtdLotes || undefined,
        vgv_bruto: resultado.vgvNominal,
        vgv_liquido: resultado.vgvReajustado,
        custo_terreno: form.custo_terreno,
        custo_obras_infra: resultado.custoObraReajustado,
        custo_marketing_admin: resultado.custosIndiretos,
        comissoes_vendas: resultado.comissao,
        impostos_receita: resultado.impostos,
        custo_total: resultado.custoTotal,
        lucro_liquido_projetado: resultado.lucro,
        margem_liquida_percentual: resultado.margem,
        roi_percentual: resultado.roi,
        tir_anual_percentual: resultado.tirAnual ?? undefined,
        prazo_meses: form.prazo_meses,
        ponto_equilibrio_meses: resultado.paybackMeses ?? undefined,
      });
      setDirty(false);
      setSucesso('Estudo de viabilidade salvo.');
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return {
    form,
    resultado,
    orcamento,
    vgv,
    fonteVgv,
    precoEfetivoM2,
    areaVendavel,
    areaLotes,
    qtdLotes,
    loading,
    salvando,
    dirty,
    erro,
    sucesso,
    setErro,
    setSucesso,
    setPremissa,
    aplicarIndiretosSugeridos,
    salvar,
  };
}
