import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/supabase';
import type { Lote, Obra } from '../types';

export function useLotesObra() {
  const { activeObra, setActiveObra } = useAuth();
  const obraId = activeObra?.id || '';
  const queryClient = useQueryClient();

  const lotesQuery = useQuery({
    queryKey: ['lotes', obraId],
    queryFn: () => apiService.getLotes(obraId),
    enabled: Boolean(obraId),
  });

  const updateLoteMutation = useMutation({
    mutationFn: ({
      loteId,
      dados,
    }: {
      loteId: string;
      dados: Pick<Lote, 'status' | 'area_m2' | 'valor_total' | 'valor_m2'>;
    }) => apiService.updateLote(loteId, dados),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lotes', obraId] });
      void queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  const updateMapaMutation = useMutation({
    mutationFn: (dados: { mapa_masterplan_url?: string | null; mapa_viewbox?: string | null }) =>
      apiService.updateObraMapa(obraId, dados),
    onSuccess: (obraAtualizada) => {
      if (activeObra) {
        setActiveObra({ ...activeObra, ...obraAtualizada } as Obra);
      }
      void queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  return {
    obraId,
    activeObra,
    lotes: lotesQuery.data ?? [],
    isLoading: lotesQuery.isLoading,
    isError: lotesQuery.isError,
    error: lotesQuery.error,
    refetch: lotesQuery.refetch,
    updateLote: updateLoteMutation.mutateAsync,
    isUpdatingLote: updateLoteMutation.isPending,
    updateMapa: updateMapaMutation.mutateAsync,
    isUpdatingMapa: updateMapaMutation.isPending,
  };
}
