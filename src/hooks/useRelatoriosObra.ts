import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/supabase';
import { uploadRelatorioPdf, deleteRelatorioPdf } from '../lib/storage';
import type { GerarRelatorioParams } from '../lib/relatorios/tipos';
import type { RelatorioObra } from '../types';
import { supabase } from '../lib/supabaseClient';

function relatoriosKey(obraId: string) {
  return ['relatorios', obraId] as const;
}

export function useRelatoriosObra(obraId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: relatoriosKey(obraId),
    queryFn: () => apiService.getRelatoriosObra(obraId),
    enabled: Boolean(obraId)
  });

  const gerarMutation = useMutation({
    mutationFn: async (params: GerarRelatorioParams) => {
      const { buildRelatorioPdf } = await import('../lib/relatorios/buildRelatorioPdf');
      const blob = await buildRelatorioPdf(params);
      const url = await uploadRelatorioPdf(blob, params.obra.id);
      const { data: authData } = await supabase.auth.getUser();
      const registro = await apiService.createRelatorioObra({
        obra_id: params.obra.id,
        tipo: params.tipo,
        titulo: params.titulo,
        periodo_inicio: `${params.periodoInicio}-01`,
        periodo_fim: `${params.periodoFim}-01`,
        inclui_financeiro: params.incluiFinanceiro,
        arquivo_url: url,
        tamanho_bytes: blob.size,
        gerado_por: authData.user?.id || user?.id || null,
        gerado_por_nome: user?.nome || user?.email || 'Usuário'
      });
      return registro;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: relatoriosKey(obraId) });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (relatorio: RelatorioObra) => {
      await deleteRelatorioPdf(relatorio.arquivo_url);
      await apiService.deleteRelatorioObra(relatorio.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: relatoriosKey(obraId) });
    }
  });

  return {
    relatorios: query.data || [],
    loading: query.isLoading,
    erro: query.error instanceof Error ? query.error.message : null,
    gerar: gerarMutation.mutateAsync,
    gerando: gerarMutation.isPending,
    erroGeracao: gerarMutation.error instanceof Error ? gerarMutation.error.message : null,
    excluir: excluirMutation.mutateAsync,
    excluindo: excluirMutation.isPending
  };
}
