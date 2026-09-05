import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/supabase';
import type { AndamentoEtapa } from '../types';
import { clampPct, progressoPonderado } from '../lib/andamento';

export function useAndamento(obraId?: string) {
  const [etapas, setEtapas] = useState<AndamentoEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!obraId) {
      setEtapas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const data = await apiService.getAndamento(obraId);
      setEtapas(data);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar o andamento.');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const geralRealizado = useMemo(() => progressoPonderado(etapas, 'realizado'), [etapas]);
  const geralPrevisto = useMemo(() => progressoPonderado(etapas, 'previsto'), [etapas]);

  const salvarAvanco = async (id: string, valor: number) => {
    if (!obraId) return;
    const etapa = etapas.find((e) => e.id === id);
    if (!etapa) return;
    const pct = clampPct(valor);
    setSalvandoId(id);
    setErro(null);
    try {
      await apiService.salvarAvanco(obraId, etapa, pct);
      await carregar();
      setSucesso(`Avanço de "${etapa.nome}" salvo.`);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar o avanço.');
    } finally {
      setSalvandoId(null);
    }
  };

  const salvarVisibilidade = async (id: string, visivel: boolean) => {
    setSalvandoId(id);
    setErro(null);
    try {
      await apiService.salvarVisibilidade(id, visivel);
      setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, visivel_convidados: visivel } : e)));
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível alterar a visibilidade.');
    } finally {
      setSalvandoId(null);
    }
  };

  return {
    etapas,
    loading,
    salvandoId,
    erro,
    sucesso,
    setErro,
    setSucesso,
    geralRealizado,
    geralPrevisto,
    salvarAvanco,
    salvarVisibilidade,
    carregar
  };
}
