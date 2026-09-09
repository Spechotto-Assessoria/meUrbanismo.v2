import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/supabase';
import { deleteMapaMasterplan, uploadMapaMasterplan } from '../lib/storage';
import type { Lote, Obra } from '../types';
import type { LoteFormData } from '../lib/loteMapa';

function invalidateLotes(queryClient: ReturnType<typeof useQueryClient>, obraId: string) {
  void queryClient.invalidateQueries({ queryKey: ['lotes', obraId] });
  void queryClient.invalidateQueries({ queryKey: ['obras'] });
}

export function useLotesObra() {
  const { activeObra, setActiveObra } = useAuth();
  const obraId = activeObra?.id || '';
  const queryClient = useQueryClient();

  const lotesQuery = useQuery({
    queryKey: ['lotes', obraId],
    queryFn: () => apiService.getLotes(obraId),
    enabled: Boolean(obraId),
  });

  const syncObra = (obraAtualizada: Obra) => {
    if (activeObra) {
      setActiveObra({ ...activeObra, ...obraAtualizada } as Obra);
    }
  };

  const uploadMasterplanMutation = useMutation({
    mutationFn: async ({ file, viewBox }: { file: File; viewBox: string }) => {
      const url = await uploadMapaMasterplan(file, obraId);
      return apiService.updateObraMapa(obraId, {
        mapa_masterplan_url: url,
        mapa_viewbox: viewBox,
      });
    },
    onSuccess: (obraAtualizada) => {
      syncObra(obraAtualizada);
      invalidateLotes(queryClient, obraId);
    },
  });

  const deleteMasterplanMutation = useMutation({
    mutationFn: async (url: string) => {
      if (url) await deleteMapaMasterplan(url);
      return apiService.updateObraMapa(obraId, {
        mapa_masterplan_url: null,
        mapa_viewbox: null,
      });
    },
    onSuccess: (obraAtualizada) => {
      syncObra(obraAtualizada);
      invalidateLotes(queryClient, obraId);
    },
  });

  const updateMapaMutation = useMutation({
    mutationFn: (dados: { mapa_masterplan_url?: string | null; mapa_viewbox?: string | null }) =>
      apiService.updateObraMapa(obraId, dados),
    onSuccess: (obraAtualizada) => {
      syncObra(obraAtualizada);
      invalidateLotes(queryClient, obraId);
    },
  });

  const createLoteMutation = useMutation({
    mutationFn: (dados: LoteFormData) => apiService.createLote(obraId, dados),
    onSuccess: () => invalidateLotes(queryClient, obraId),
  });

  const updateLoteMutation = useMutation({
    mutationFn: ({ loteId, dados }: { loteId: string; dados: LoteFormData }) =>
      apiService.updateLote(loteId, dados),
    onSuccess: () => invalidateLotes(queryClient, obraId),
  });

  const deleteLoteMutation = useMutation({
    mutationFn: (loteId: string) => apiService.deleteLote(loteId),
    onSuccess: () => invalidateLotes(queryClient, obraId),
  });

  return {
    obraId,
    activeObra,
    lotes: lotesQuery.data ?? [],
    isLoading: lotesQuery.isLoading,
    isError: lotesQuery.isError,
    error: lotesQuery.error,
    refetch: lotesQuery.refetch,
    uploadMasterplan: uploadMasterplanMutation.mutateAsync,
    isUploadingMasterplan: uploadMasterplanMutation.isPending,
    deleteMasterplan: deleteMasterplanMutation.mutateAsync,
    isDeletingMasterplan: deleteMasterplanMutation.isPending,
    updateMapa: updateMapaMutation.mutateAsync,
    isUpdatingMapa: updateMapaMutation.isPending,
    createLote: createLoteMutation.mutateAsync,
    isCreatingLote: createLoteMutation.isPending,
    updateLote: updateLoteMutation.mutateAsync,
    isUpdatingLote: updateLoteMutation.isPending,
    deleteLote: deleteLoteMutation.mutateAsync,
    isDeletingLote: deleteLoteMutation.isPending,
  };
}
