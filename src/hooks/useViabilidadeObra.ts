import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/supabase';
import type { Obra } from '../types';
import { buscarIndicesEconomicos, INCC_FALLBACK_AM, IPCA_FALLBACK_AM } from '../lib/indices-economicos';
import {
  calcViabilidade,
  custoObraDoOrcamento,
  ENTRADA_PADRAO_PCT,
  PARCELAS_PADRAO,
  PRAZO_OBRA_PADRAO,
  PRAZO_VENDAS_PADRAO,
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
  prazo_meses: PRAZO_OBRA_PADRAO,
  prazo_vendas_meses: PRAZO_VENDAS_PADRAO,
  reajuste_receita_pct_am: IPCA_FALLBACK_AM,
  incc_pct_am: INCC_FALLBACK_AM,
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
  const areaVendavelSalva = Number(obra?.area_vendavel_m2) || 0;
  const areaVendavel = areaVendavelSalva > 0 ? areaVendavelSalva : (areaGleba > 0 ? areaGleba * 0.55 : 0);
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

      if (saved.reajuste_receita_pct_am == null || saved.incc_pct_am == null) {
        void buscarIndicesEconomicos()
          .then((indices) => {
            setForm((f) => ({
              ...f,
              reajuste_receita_pct_am:
                saved.reajuste_receita_pct_am == null &&
                f.reajuste_receita_pct_am === PREMISSAS_DEFAULT.reajuste_receita_pct_am
                  ? indices.ipcaAm
                  : f.reajuste_receita_pct_am,
              incc_pct_am:
                saved.incc_pct_am == null && f.incc_pct_am === PREMISSAS_DEFAULT.incc_pct_am
                  ? indices.inccAm
                  : f.incc_pct_am,
            }));
          })
          .catch(() => undefined);
      }
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

  const aplicarPremissas = (next: PremissasObra) => {
    setForm(next);
    setDirty(true);
    setSucesso(null);
  };

  const salvar = async (premissas?: PremissasObra) => {
    if (!obraId) return false;
    const p = premissas ?? form;
    const vgvEfetivo = vgvLotes > 0 ? vgvLotes : areaVendavel * p.preco_m2;
    const res = premissas
      ? calcViabilidade({ ...p, vgv: vgvEfetivo, custo_obra: orcamento.custoObra })
      : resultado;
    setSalvando(true);
    setErro(null);
    try {
      await apiService.saveViabilidade({
        obra_id: obraId,
        premissas: p,
        area_total: areaVendavel || areaLotes || undefined,
        quantidade_lotes: qtdLotes || undefined,
        vgv_bruto: res.vgvNominal,
        vgv_liquido: res.vgvReajustado,
        custo_terreno: p.custo_terreno,
        custo_obras_infra: res.custoObraReajustado,
        custo_marketing_admin: res.custosIndiretos,
        comissoes_vendas: res.comissao,
        impostos_receita: res.impostos,
        custo_total: res.custoTotal,
        lucro_liquido_projetado: res.lucro,
        margem_liquida_percentual: res.margem,
        roi_percentual: res.roi,
        tir_anual_percentual: res.tirAnual ?? undefined,
        prazo_meses: p.prazo_meses,
        ponto_equilibrio_meses:
          res.paybackMeses != null ? Math.round(res.paybackMeses) : undefined,
      });
      setForm(p);
      setDirty(false);
      setSucesso('Estudo de viabilidade salvo.');
      return true;
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
      return false;
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
    aplicarPremissas,
    aplicarIndiretosSugeridos,
    salvar,
  };
}
