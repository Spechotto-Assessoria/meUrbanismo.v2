import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/supabase';
import type { OrcamentoItem } from '../types';
import type { ParsedEtapa } from '../lib/budget-parser';

export function useOrcamento(obraId?: string) {
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!obraId) {
      setItens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.getOrcamentos(obraId);
      setItens(data);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar o orçamento.');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const importar = async (etapas: ParsedEtapa[]) => {
    if (!obraId) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiService.importarEtapasOrcamento(obraId, etapas);
      await carregar();
      setSucesso(`${etapas.length} etapa(s) importada(s).`);
    } catch (e: any) {
      setErro(e?.message || 'Falha na importação.');
      throw e;
    } finally {
      setSalvando(false);
    }
  };

  const salvarEtapa = async (payload: Partial<OrcamentoItem> & { descricao: string; valor_total: number }) => {
    if (!obraId) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiService.saveOrcamento({
        ...payload,
        obra_id: obraId,
        unidade: 'vb',
        quantidade: 1,
        valor_unitario: payload.valor_total,
        categoria: payload.descricao
      });
      await carregar();
      setSucesso('Etapa salva.');
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar a etapa.');
      throw e;
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    if (!window.confirm('Excluir esta etapa do orçamento?')) return;
    setErro(null);
    try {
      await apiService.deleteOrcamento(id);
      await carregar();
      setSucesso('Etapa excluída.');
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível excluir.');
    }
  };

  return {
    itens,
    loading,
    salvando,
    erro,
    sucesso,
    setErro,
    setSucesso,
    carregar,
    importar,
    salvarEtapa,
    excluir
  };
}
