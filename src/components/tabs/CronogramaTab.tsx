import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import { useCronograma } from '../../hooks/useCronograma';
import { CronogramaCurvaS } from '../cronograma/CronogramaCurvaS';
import { CronogramaMatriz } from '../cronograma/CronogramaMatriz';
import { CronogramaGantt } from '../cronograma/CronogramaGantt';
import { ImportCronogramaModal } from '../cronograma/ImportCronogramaModal';
import { SkeletonTable } from '../common/SkeletonLoader';
import {
  Calendar,
  Activity,
  Layers,
  UploadCloud,
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Save,
  Loader2
} from 'lucide-react';

export const CronogramaTab: React.FC = () => {
  const { activeObra, isAdmin, role } = useAuth();
  const { isMasterAdmin, canViewFinancials } = useObraAccess();
  const podeVer = isAdmin || role === 'PROPRIETARIO_INVESTIDOR' || role === 'INVESTIDOR';
  const ocultarFinanceiro = !canViewFinancials;

  const dataInicio = activeObra?.data_inicio || activeObra?.dataInicio || null;
  const dataFim = activeObra?.data_previsao || activeObra?.dataEntrega || null;

  const crono = useCronograma(activeObra?.id, dataInicio, dataFim);
  const [viewMode, setViewMode] = useState<'grafico' | 'matriz'>('grafico');
  const [showImportModal, setShowImportModal] = useState(false);

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (!podeVer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto mt-10">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-xs text-slate-500">O cronograma é visível apenas para administrador e proprietário/investidor.</p>
      </div>
    );
  }

  const prazoMeses = crono.months.length;
  const moneyLabel = ocultarFinanceiro ? '' : ` (${formatBRL(crono.totalObra)})`;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-fadeIn">
      {crono.sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between">
          <span>{crono.sucesso}</span>
          <button type="button" onClick={() => crono.setSucesso(null)}>×</button>
        </div>
      )}
      {crono.erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between">
          <span>{crono.erro}</span>
          <button type="button" onClick={() => crono.setErro(null)}>×</button>
        </div>
      )}

      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Planejamento Temporal
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 uppercase tracking-wider">
              {canViewFinancials ? 'Curva S Físico-Financeira' : 'Curva S Físico'}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {canViewFinancials ? 'Cronograma Físico-Financeiro' : 'Cronograma Físico de Obras'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {canViewFinancials
              ? `Distribuição orçamentária ao longo de ${prazoMeses || '—'} meses${moneyLabel}`
              : `Avanço físico previsto e executado ao longo de ${prazoMeses || '—'} meses`}
          </p>
        </div>

        {canViewFinancials && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => crono.gerarBase()}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  crono.modoDistribuicao === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-purple-600" /> Auto Curva S
              </button>
              <button
                type="button"
                onClick={() => crono.setModoDistribuicao('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  crono.modoDistribuicao === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Personalizado
              </button>
            </div>

            {isMasterAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Importar Planilha
                </button>
                <button
                  type="button"
                  disabled={!crono.dirty || crono.salvando}
                  onClick={() => void crono.salvar()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {crono.salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {crono.loading ? (
        <SkeletonTable rows={6} />
      ) : crono.etapas.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Sem etapas para cronogramar</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Importe primeiro o orçamento na aba anterior.</p>
        </div>
      ) : prazoMeses === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Defina as datas da obra no cadastro para gerar o cronograma mensal.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Preencha data de início e data de entrega prevista no cadastro da obra.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grafico')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grafico'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Gráfico Curva S
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matriz')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'matriz'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Matriz Mês a Mês
              </button>
            </div>
          </div>

          {viewMode === 'grafico' ? (
            <div className="space-y-6">
              <CronogramaCurvaS data={crono.chartData} canViewFinancials={canViewFinancials} />
              <CronogramaGantt
                rows={crono.etapas.map((e) => ({ id: e.id, nome: e.nome }))}
                months={crono.months}
                grid={crono.grid}
                onChange={crono.aplicarGrid}
                disabled={!isAdmin}
              />
            </div>
          ) : (
            <CronogramaMatriz
              etapas={crono.etapas}
              months={crono.months}
              grid={crono.grid}
              chartData={crono.chartData}
              totalObra={crono.totalObra}
              canEdit={isAdmin}
              ocultarFinanceiro={ocultarFinanceiro}
              rowTotal={crono.rowTotal}
              onCell={crono.setCell}
            />
          )}
        </>
      )}

      {showImportModal && isMasterAdmin && (
        <ImportCronogramaModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          etapas={crono.etapas}
          months={crono.months}
          onConfirm={crono.aplicarGrid}
        />
      )}
    </div>
  );
};
