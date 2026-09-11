import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/supabase';
import type { Obra } from '../types';

export interface GestaoTecnicaFormData {
  supervisao_tecnica: string;
  engenheiro_responsavel: string;
  crea_responsavel: string;
}

export function useGestaoTecnicaObra() {
  const { activeObra, setActiveObra, refreshObras } = useAuth();
  const obraId = activeObra?.id || '';
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dados: GestaoTecnicaFormData) =>
      apiService.updateObraGestaoTecnica(obraId, dados),
    onSuccess: (obraAtualizada) => {
      if (activeObra) {
        setActiveObra({ ...activeObra, ...obraAtualizada } as Obra);
      }
      void refreshObras();
      void queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  return {
    salvar: mutation.mutateAsync,
    salvando: mutation.isPending,
    erro: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
