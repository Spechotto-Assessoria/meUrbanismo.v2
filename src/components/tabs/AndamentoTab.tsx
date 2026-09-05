import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAndamento } from '../../hooks/useAndamento';
import { ProgressoBar } from '../andamento/ProgressoBar';
import { LinhaEtapa } from '../andamento/LinhaEtapa';
import { SkeletonTable } from '../common/SkeletonLoader';
import { MapPin, Layers, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const AndamentoTab: React.FC = () => {
  const { activeObra, isAdmin } = useAuth();
  const and = useAndamento(activeObra?.id);

  if (!activeObra) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        Nenhum empreendimento selecionado.
      </div>
    );
  }

  const progressoGlobal = parseFloat(and.geralRealizado.toFixed(1));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {and.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {and.sucesso}
          </div>
          <button type="button" onClick={() => and.setSucesso(null)}>×</button>
        </div>
      )}
      {and.erro && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{and.erro}</span>
          <button type="button" onClick={() => and.setErro(null)}>×</button>
        </div>
      )}

      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Evolução Construtiva
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              {activeObra.tipo || 'Loteamento'}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">{activeObra.nome}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> {activeObra.cidade} - {activeObra.uf}
          </p>
        </div>
      </div>

      {and.loading ? (
        <SkeletonTable rows={5} />
      ) : and.etapas.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Sem etapas para acompanhar</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Importe primeiro o orçamento na aba Orçamento.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avanço Físico Global</span>
                <h2 className="text-3xl font-black text-slate-900">{progressoGlobal}% Concluído</h2>
              </div>
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <span>Previsto no cronograma: <strong>{and.geralPrevisto.toFixed(0)}%</strong></span>
                <p className="text-[11px] text-slate-400">Spechotto Assessoria Técnica</p>
              </div>
            </div>
            <ProgressoBar valor={and.geralRealizado} previsto={and.geralPrevisto} />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Detalhamento por Macro Etapa
              </h3>
              <span className="text-xs text-slate-500">{and.etapas.length} etapas ativas</span>
            </div>
            <div className="space-y-4">
              {and.etapas.map((etapa) => (
                <LinhaEtapa
                  key={etapa.id}
                  etapa={etapa}
                  canEdit={isAdmin}
                  saving={and.salvandoId === etapa.id}
                  onSave={(id, valor) => void and.salvarAvanco(id, valor)}
                  onToggle={(id, visivel) => void and.salvarVisibilidade(id, visivel)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
