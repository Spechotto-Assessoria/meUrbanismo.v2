import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  Camera, 
  Calendar 
} from 'lucide-react';
import { MOCK_MACRO_ETAPAS } from '../../services/mockData';

export const RelatoriosTab: React.FC = () => {
  const { activeObra, user } = useAuth();
  const { canViewFinancials } = useObraAccess();

  if (!activeObra) {
    return null;
  }

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* BARRA DE AÇÕES DO RELATÓRIO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Relatório Executivo Consolidado
          </h3>
          <p className="text-xs text-slate-400">
            Síntese do avanço físico, financeiro e fotográfico para diretoria e investidores
          </p>
        </div>

        <button
          onClick={handleImprimir}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-xs font-bold text-white shadow-glow transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Exportar PDF
        </button>
      </div>

      {/* DOCUMENTO DO RELATÓRIO EXECUTIVO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-6 shadow-glass text-slate-200">
        
        {/* CABEÇALHO DO RELATÓRIO */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-meurbanismo.png" alt="meUrbanismo" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="text-xl font-extrabold text-white">meUrbanismo</h2>
              <p className="text-xs text-brand-300 font-semibold">RELATÓRIO MENSAL DE EVOLUÇÃO DE OBRA</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block">Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
            <span className="text-brand-300 font-bold">Spechotto Assessoria & Construção</span>
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO EMPREENDIMENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-navy-950 p-4 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Empreendimento:</span>
            <strong className="text-white text-sm">{activeObra.nome}</strong>
            <span className="block text-slate-400">{activeObra.cidade} - {activeObra.uf} • {activeObra.tipo}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Status Construtivo:</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {activeObra.status} ({activeObra.percentual_concluido}% concluído)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Engenheiro Responsável:</span>
            <strong className="text-slate-200">Eng. Rennan Spechotto</strong>
            <span className="block text-slate-400">CREA-SP 5069248190</span>
          </div>
        </div>

        {/* RESUMO EXECUTIVO DE INDICADORES */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            1. Indicadores Físico-Financeiros
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-navy-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Avanço Físico Global</span>
              <span className="text-lg font-black text-brand-300 mt-1 block">
                {activeObra.percentual_concluido}%
              </span>
            </div>

            <div className="p-3 bg-navy-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Custo Total Realizado</span>
              <span className="text-lg font-black text-white mt-1 block">
                {canViewFinancials ? `R$ ${(activeObra.custo_realizado / 1000000).toFixed(2)} M` : '🔒 Restrito'}
              </span>
            </div>

            <div className="p-3 bg-navy-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Orçamento Aprovado</span>
              <span className="text-lg font-black text-slate-300 mt-1 block">
                {canViewFinancials ? `R$ ${(activeObra.custo_orcado / 1000000).toFixed(2)} M` : '🔒 Restrito'}
              </span>
            </div>

            <div className="p-3 bg-navy-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Vendas Concluídas</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">
                {activeObra.lotes_vendidos} / {activeObra.total_lotes} lotes
              </span>
            </div>
          </div>
        </div>

        {/* TABELA DE AVANÇO POR MACRO-ETAPA */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            2. Detalhamento do Avanço por Macro-Etapa
          </h4>

          <div className="space-y-2 text-xs">
            {MOCK_MACRO_ETAPAS.map(etapa => (
              <div key={etapa.id} className="p-3 rounded-xl bg-navy-950 border border-slate-850 flex items-center justify-between">
                <span className="font-semibold text-white">{etapa.ordem}. {etapa.nome}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Meta: {etapa.percentual_previsto}%</span>
                  <span className="font-bold text-brand-300">{etapa.percentual_realizado}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PARECER CONCLUSIVO DA ENGENHARIA */}
        <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2 text-xs">
          <h5 className="font-bold text-white uppercase tracking-wider">
            3. Parecer Técnico e Próximos Passos
          </h5>
          <p className="text-slate-300 leading-relaxed">
            As obras do {activeObra.nome} seguem em ritmo acelerado e rigorosamente aderentes ao cronograma base. Os serviços de drenagem pluvial e rede de água encontram-se em fase conclusiva, liberando as frentes de trabalho para a finalização da capa asfáltica (CBUQ) e início da instalação dos postes de iluminação pública em LED.
          </p>
        </div>

        {/* ASSINATURA */}
        <div className="pt-8 flex flex-col items-center justify-center text-center text-xs space-y-1">
          <div className="w-56 border-t border-slate-700"></div>
          <span className="font-bold text-white mt-1">Eng. Rennan Spechotto</span>
          <span className="text-slate-400">Responsável Técnico • CREA-SP 5069248190</span>
          <span className="text-[10px] text-brand-400">Spechotto Assessoria & Construção</span>
        </div>

      </div>

    </div>
  );
};
