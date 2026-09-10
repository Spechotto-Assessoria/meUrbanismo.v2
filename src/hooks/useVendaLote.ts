import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useObraAccess } from './useObraAccess';
import { lerLoteIdDaUrl, limparLoteIdDaUrl } from './useNavegacaoVendas';
import { normalizeStatus } from '../lib/loteMapa';
import { apiService } from '../services/supabase';
import type { Lote } from '../types';

export function useVendaLote() {
  const { activeObra } = useAuth();
  const { isMasterAdmin, isCorretor, isInvestidor } = useObraAccess();
  const obraId = activeObra?.id || '';
  const queryClient = useQueryClient();

  const [loteIdUrl] = useState(() => lerLoteIdDaUrl());
  const [loteIdManual, setLoteIdManual] = useState<string | undefined>(undefined);
  const [propostaAberta, setPropostaAberta] = useState(false);

  const loteIdAtivo = loteIdUrl || loteIdManual;

  const lotesQuery = useQuery({
    queryKey: ['lotes', obraId],
    queryFn: () => apiService.getLotes(obraId),
    enabled: Boolean(obraId),
  });

  const loteQuery = useQuery({
    queryKey: ['lote', loteIdAtivo],
    queryFn: () => apiService.getLoteById(loteIdAtivo!),
    enabled: Boolean(loteIdAtivo),
  });

  const lotesDisponiveis = useMemo(
    () => (lotesQuery.data ?? []).filter((l) => normalizeStatus(l.status) === 'disponivel'),
    [lotesQuery.data]
  );

  const loteSelecionado: Lote | null = loteQuery.data ?? null;

  const podeReservar = isMasterAdmin || isCorretor || isInvestidor;
  const loteDisponivel = loteSelecionado
    ? normalizeStatus(loteSelecionado.status) === 'disponivel'
    : false;

  const reservarMutation = useMutation({
    mutationFn: (loteId: string) => apiService.updateLoteStatus(loteId, 'reservado'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lotes', obraId] });
      if (loteIdAtivo) {
        void queryClient.invalidateQueries({ queryKey: ['lote', loteIdAtivo] });
      }
      setPropostaAberta(true);
    },
  });

  const selecionarLote = useCallback((loteId: string) => {
    limparLoteIdDaUrl();
    setLoteIdManual(loteId);
  }, []);

  const gerarPropostaEReservar = useCallback(async () => {
    if (!loteSelecionado || !loteDisponivel) return;
    const label = `Quadra ${loteSelecionado.quadra} - Lote ${loteSelecionado.numero}`;
    const ok = confirm(
      `Confirmar reserva do ${label}?\n\nO lote será marcado como "Reservado" no mapa de disponibilidade.`
    );
    if (!ok) return;
    await reservarMutation.mutateAsync(loteSelecionado.id);
  }, [loteSelecionado, loteDisponivel, reservarMutation]);

  useEffect(() => {
    if (!loteIdUrl && lotesDisponiveis.length === 1 && !loteIdManual) {
      setLoteIdManual(lotesDisponiveis[0].id);
    }
  }, [loteIdUrl, lotesDisponiveis, loteIdManual]);

  return {
    obraId,
    activeObra,
    loteIdUrl,
    loteSelecionado,
    lotesDisponiveis,
    isLoadingLote: loteQuery.isLoading || lotesQuery.isLoading,
    selecionarLote,
    podeReservar,
    loteDisponivel,
    gerarPropostaEReservar,
    isReservando: reservarMutation.isPending,
    erroReserva: reservarMutation.error,
    propostaAberta,
    setPropostaAberta,
  };
}
