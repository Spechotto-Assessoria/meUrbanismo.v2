import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/supabase';
import type { CronogramaMes } from '../types';
import {
  calcularCurvaS,
  gerarCronogramaBase,
  monthsBetween,
  type EtapaCrono,
  type Grid
} from '../lib/cronograma';

function etapasDeOrcamento(
  itens: { id: string; descricao: string; valor_total?: number; data_atualizacao?: string }[]
): EtapaCrono[] {
  return [...itens]
    .sort((a, b) => (a.data_atualizacao || '').localeCompare(b.data_atualizacao || '') || a.descricao.localeCompare(b.descricao))
    .map((i) => ({ id: i.id, nome: i.descricao, valor_total: Number(i.valor_total) || 0 }));
}

function gridVazio(etapas: EtapaCrono[], months: string[]): Grid {
  const g: Grid = {};
  for (const e of etapas) g[e.id] = Object.fromEntries(months.map((m) => [m, 0]));
  return g;
}

export function useCronograma(obraId?: string, dataInicio?: string | null, dataFim?: string | null) {
  const [etapas, setEtapas] = useState<EtapaCrono[]>([]);
  const [mesesDb, setMesesDb] = useState<CronogramaMes[]>([]);
  const [grid, setGrid] = useState<Grid>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [modoDistribuicao, setModoDistribuicao] = useState<'auto' | 'custom'>('auto');

  const months = useMemo(
    () => (dataInicio && dataFim ? monthsBetween(dataInicio, dataFim) : []),
    [dataInicio, dataFim]
  );

  const carregar = useCallback(async () => {
    if (!obraId) {
      setEtapas([]);
      setMesesDb([]);
      setGrid({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const orc = await apiService.getOrcamentos(obraId);
      const ets = etapasDeOrcamento(orc);
      setEtapas(ets);
      const ids = ets.map((e) => e.id);
      const db = ids.length ? await apiService.getCronogramaMeses(ids) : [];
      setMesesDb(db);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar o cronograma.');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (loading) return;
    const ms = months;
    const g = gridVazio(etapas, ms);
    for (const m of mesesDb) {
      const k = String(m.ano_mes).slice(0, 10);
      if (!g[m.etapa_id]) g[m.etapa_id] = {};
      g[m.etapa_id][k] = Number(m.percentual_previsto) || 0;
    }
    if (mesesDb.length === 0 && ms.length > 0 && etapas.length > 0) {
      setGrid(gerarCronogramaBase(etapas, ms));
      setModoDistribuicao('auto');
      setDirty(true);
      return;
    }
    setGrid(g);
    setModoDistribuicao(mesesDb.length > 0 ? 'custom' : 'auto');
    setDirty(false);
  }, [etapas, mesesDb, months, loading]);

  const chartData = useMemo(() => calcularCurvaS(etapas, months, grid), [etapas, months, grid]);
  const totalObra = useMemo(
    () => etapas.reduce((a, e) => a + (Number(e.valor_total) || 0), 0),
    [etapas]
  );

  const setCell = (etapaId: string, month: string, v: string) => {
    const n = Math.max(0, Math.min(100, Number(String(v).replace(',', '.')) || 0));
    setGrid((prev) => ({ ...prev, [etapaId]: { ...(prev[etapaId] ?? {}), [month]: n } }));
    setDirty(true);
    setModoDistribuicao('custom');
  };

  const aplicarGrid = (g: Grid) => {
    setGrid(g);
    setDirty(true);
    setModoDistribuicao('custom');
  };

  const gerarBase = () => {
    if (etapas.length === 0 || months.length === 0) return;
    setGrid(gerarCronogramaBase(etapas, months));
    setDirty(true);
    setModoDistribuicao('auto');
  };

  const salvar = async () => {
    if (etapas.length === 0) return;
    setSalvando(true);
    setErro(null);
    try {
      const ids = etapas.map((e) => e.id);
      const rows: Omit<CronogramaMes, 'id'>[] = [];
      for (const e of etapas) {
        for (const m of months) {
          const existing = mesesDb.find((x) => x.etapa_id === e.id && String(x.ano_mes).slice(0, 10) === m);
          rows.push({
            etapa_id: e.id,
            ano_mes: m,
            percentual_previsto: grid[e.id]?.[m] ?? 0,
            percentual_realizado: existing ? Number(existing.percentual_realizado) : 0
          });
        }
      }
      await apiService.salvarCronogramaMeses(ids, rows);
      setMesesDb(rows);
      setDirty(false);
      setSucesso('Cronograma salvo.');
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar o cronograma.');
      throw e;
    } finally {
      setSalvando(false);
    }
  };

  const rowTotal = (etapaId: string) => months.reduce((a, m) => a + (grid[etapaId]?.[m] ?? 0), 0);

  return {
    etapas,
    months,
    grid,
    chartData,
    totalObra,
    dirty,
    loading,
    salvando,
    erro,
    sucesso,
    setErro,
    setSucesso,
    modoDistribuicao,
    setModoDistribuicao,
    setCell,
    aplicarGrid,
    gerarBase,
    salvar,
    rowTotal,
    carregar
  };
}
