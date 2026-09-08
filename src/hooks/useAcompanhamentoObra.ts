import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useObraAccess } from './useObraAccess';
import { apiService } from '../services/supabase';
import type { DiarioObra, FotoObra, MedicaoItem } from '../types';
import type { SubAbaAcompanhamento } from '../lib/acompanhamento-constants';

export function useAcompanhamentoObra(focoInicial: SubAbaAcompanhamento = 'fotos') {
  const { activeObra, user, isMasterAdmin } = useAuth();
  const access = useObraAccess();

  const [subAba, setSubAba] = useState<SubAbaAcompanhamento>(focoInicial);
  const [fotos, setFotos] = useState<FotoObra[]>([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const podeVerTodasSubAbas = access.canViewFinancials;
  const podeGerenciar = isMasterAdmin;
  const autorNome = user?.nome || 'Administrador';

  const loadData = useCallback(async () => {
    if (!activeObra?.id) return;
    setLoading(true);
    setErro(null);
    try {
      const [f, d, m] = await Promise.all([
        apiService.getFotos(activeObra.id),
        podeVerTodasSubAbas ? apiService.getDiarios(activeObra.id) : Promise.resolve([]),
        podeVerTodasSubAbas ? apiService.getMedicoes(activeObra.id) : Promise.resolve([]),
      ]);
      setFotos(f);
      setDiarios(d);
      setMedicoes(m);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar acompanhamento.');
    } finally {
      setLoading(false);
    }
  }, [activeObra?.id, podeVerTodasSubAbas]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSubAba(focoInicial);
  }, [focoInicial, activeObra?.id]);

  useEffect(() => {
    if (!podeVerTodasSubAbas && subAba !== 'fotos') {
      setSubAba('fotos');
    }
  }, [podeVerTodasSubAbas, subAba]);

  const ultimoDiario = diarios[0] ?? null;

  return {
    activeObra,
    subAba,
    setSubAba,
    fotos,
    diarios,
    medicoes,
    loading,
    erro,
    setErro,
    loadData,
    podeVerTodasSubAbas,
    podeGerenciar,
    autorNome,
    ultimoDiario,
    isClienteOuCorretor: access.isCliente || access.isCorretor,
  };
}
