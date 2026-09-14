import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import { useRelatoriosObra } from '../../hooks/useRelatoriosObra';
import { podeAcessarRelatorios, podeExcluirRelatorio } from '../../lib/relatorios/acesso';
import type { RelatorioTipo } from '../../types';
import { RelatorioAcessoRestrito } from '../relatorios/RelatorioAcessoRestrito';
import { RelatorioTipoGrid } from '../relatorios/RelatorioTipoGrid';
import { RelatorioConfigDialog } from '../relatorios/RelatorioConfigDialog';
import { RelatorioHistorico } from '../relatorios/RelatorioHistorico';

export const RelatoriosTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeObra, user, empresas, isMasterAdmin, getRoleForObra } = useAuth();
  const { canViewFinancials } = useObraAccess();
  const [tipoSelecionado, setTipoSelecionado] = useState<RelatorioTipo | null>(null);

  const obraRole = activeObra ? getRoleForObra(activeObra.id) : 'CLIENTE_COMPRADOR';
  const podeAcessar = podeAcessarRelatorios(user?.email, isMasterAdmin, obraRole);
  const podeExcluir = podeExcluirRelatorio(user?.email);

  const empresa = useMemo(
    () => empresas.find((e) => e.id === (activeObra?.empresa_id || activeObra?.empresaId)),
    [empresas, activeObra]
  );

  const {
    relatorios,
    loading,
    gerar,
    excluir,
    excluindo
  } = useRelatoriosObra(activeObra?.id || '');

  if (!activeObra) return null;

  if (!podeAcessar) {
    return <RelatorioAcessoRestrito />;
  }

  const handleGerar = (params: Parameters<typeof gerar>[0]) => {
    setTipoSelecionado(null);

    const promise = gerar({
      ...params,
      obra: activeObra,
      logoEmpresaUrl: empresa?.logo_url,
      empresaNome: empresa?.nome || activeObra.empresa_nome || activeObra.empresaNome
    });

    toast.promise(promise, {
      loading: 'Seu relatório está sendo gerado em segundo plano. Você pode continuar navegando...',
      success: (registro) => ({
        message: 'Relatório gerado com sucesso!',
        action: {
          label: 'Abrir PDF',
          onClick: () => window.open(registro.arquivo_url, '_blank', 'noopener,noreferrer'),
        },
      }),
      error: 'Erro ao processar os dados do relatório. Tente novamente.',
    });

    void promise.finally(() => {
      void queryClient.invalidateQueries({ queryKey: ['relatorios', activeObra.id] });
    });
  };

  return (
    <div className="space-y-8 pb-20 max-w-full overflow-x-hidden">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-400" />
          Dashboard de Relatórios Executivos
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Geração, visualização e arquivamento de PDFs para diretoria e investidores
        </p>
      </div>

      <RelatorioTipoGrid onSelecionar={setTipoSelecionado} />

      <RelatorioHistorico
        relatorios={relatorios}
        loading={loading}
        podeExcluir={podeExcluir}
        onExcluir={excluir}
        excluindo={excluindo}
        obraNome={activeObra.nome}
      />

      <RelatorioConfigDialog
        open={Boolean(tipoSelecionado)}
        tipo={tipoSelecionado}
        onClose={() => setTipoSelecionado(null)}
        onGerar={handleGerar}
        userEmail={user?.email}
        isMasterAdmin={isMasterAdmin}
        canViewFinancials={canViewFinancials}
      />
    </div>
  );
};
