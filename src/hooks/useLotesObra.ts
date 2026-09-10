import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/supabase';
import { deleteMapaMasterplan, uploadMapaMasterplan } from '../lib/storage';
import type { Lote, MapaImgTransform, Obra } from '../types';
import type { LoteFormData } from '../lib/loteMapa';
import type { PoligonoDxf } from '../lib/dxfImport';

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
        mapa_img_transform: null,
      });
    },
    onSuccess: (obraAtualizada) => {
      syncObra(obraAtualizada);
      invalidateLotes(queryClient, obraId);
    },
  });

  const updateMapaMutation = useMutation({
    mutationFn: (dados: {
      mapa_masterplan_url?: string | null;
      mapa_viewbox?: string | null;
      mapa_img_transform?: MapaImgTransform | null;
    }) => apiService.updateObraMapa(obraId, dados),
    onSuccess: (obraAtualizada) => {
      syncObra(obraAtualizada);
      invalidateLotes(queryClient, obraId);
    },
  });

  const salvarLoteamentoMutation = useMutation({
    mutationFn: async ({
      imagem,
      viewBox,
      transform,
      poligonos,
    }: {
      imagem: File;
      viewBox: string;
      transform: MapaImgTransform;
      poligonos: PoligonoDxf[];
    }) => {
      const url = await uploadMapaMasterplan(imagem, obraId);
      const obraAtualizada = await apiService.updateObraMapa(obraId, {
        mapa_masterplan_url: url,
        mapa_viewbox: viewBox,
        mapa_img_transform: transform,
      });
      const lotesPayload = poligonos.map((p, i) => ({
        quadra: 'Importado',
        numero: String(i + 1).padStart(2, '0'),
        area_m2: 0,
        valor_total: 0,
        valor_m2: 0,
        status: 'disponivel',
        svg_path: p.svg_path,
        label_x: p.label_x,
        label_y: p.label_y,
      }));
      await apiService.createLotesBatch(obraId, lotesPayload);
      return obraAtualizada;
    },
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
    salvarLoteamento: salvarLoteamentoMutation.mutateAsync,
    isSalvandoLoteamento: salvarLoteamentoMutation.isPending,
    createLote: createLoteMutation.mutateAsync,
    isCreatingLote: createLoteMutation.isPending,
    updateLote: updateLoteMutation.mutateAsync,
    isUpdatingLote: updateLoteMutation.isPending,
    deleteLote: deleteLoteMutation.mutateAsync,
    isDeletingLote: deleteLoteMutation.isPending,
  };
}
