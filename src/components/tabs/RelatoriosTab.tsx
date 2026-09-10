import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
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
  const { activeObra, user, empresas, isMasterAdmin, getRoleForObra } = useAuth();
  const { canViewFinancials } = useObraAccess();
  const [tipoSelecionado, setTipoSelecionado] = useState<RelatorioTipo | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
    gerando,
    erroGeracao,
    excluir,
    excluindo
  } = useRelatoriosObra(activeObra?.id || '');

  if (!activeObra) return null;

  if (!podeAcessar) {
    return <RelatorioAcessoRestrito />;
  }

  const handleGerar = async (params: Parameters<typeof gerar>[0]) => {
    await gerar({
      ...params,
      obra: activeObra,
      logoEmpresaUrl: empresa?.logo_url,
      empresaNome: empresa?.nome || activeObra.empresa_nome || activeObra.empresaNome
    });
    setTipoSelecionado(null);
    setSucesso('Relatório gerado e arquivado com sucesso.');
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

      {sucesso && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex justify-between">
          <span>{sucesso}</span>
          <button type="button" onClick={() => setSucesso(null)} className="text-emerald-400">×</button>
        </div>
      )}

      {erroGeracao && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-2xl text-xs font-semibold">
          {erroGeracao}
        </div>
      )}

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
        gerando={gerando}
        userEmail={user?.email}
        isMasterAdmin={isMasterAdmin}
        canViewFinancials={canViewFinancials}
      />
    </div>
  );
};
