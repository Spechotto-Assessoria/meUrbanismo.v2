import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_MACRO_ETAPAS } from '../../services/mockData';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Compass, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const AndamentoTab: React.FC = () => {
  const { activeObra } = useAuth();

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-slate-400">
        Nenhum empreendimento selecionado.
      </div>
    );
  }

  // Cálculos de datas e prazos
  const dataInicio = new Date(activeObra.data_inicio);
  const dataPrevisao = new Date(activeObra.data_previsao);
  const hoje = new Date();
  const totalDias = Math.max(1, Math.round((dataPrevisao.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
  const diasDecorridos = Math.max(0, Math.round((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.max(0, Math.round((dataPrevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
  const percTempo = Math.min(100, Math.round((diasDecorridos / totalDias) * 100));

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* CARD PRINCIPAL DE DESTAQUE COM GRADIENTE MEURBANISMO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-[#0c243b] border border-brand-500/30 p-5 sm:p-7 shadow-glass">
        {/* Glow decorativo de fundo */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Compass className="w-3.5 h-3.5 text-brand-400" />
                {activeObra.tipo}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                {activeObra.nome}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                {activeObra.cidade} - {activeObra.uf} • {activeObra.area_total_m2.toLocaleString('pt-BR')} m²
              </p>
            </div>

            {/* Badge de Status da Obra */}
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                {activeObra.status}
              </span>
            </div>
          </div>

          {/* INDICADOR DE EVOLUÇÃO GERAL */}
          <div className="mt-6 p-4 rounded-2xl bg-navy-950/70 border border-slate-700/60">
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Evolução Física Global
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-1 mt-0.5">
                  {activeObra.percentual_concluido}%
                  <span className="text-xs font-normal text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> no cronograma
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                Meta prevista: <span className="font-bold text-white">64.0%</span>
              </div>
            </div>

            {/* Barra de Progresso com Gradiente */}
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400 shadow-glow transition-all duration-1000"
                style={{ width: `${activeObra.percentual_concluido}%` }}
              ></div>
            </div>
          </div>

          {/* KPIS RÁPIDOS EM GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-navy-950/50 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-400" /> Início da Obra
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {new Date(activeObra.data_inicio).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/50 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Previsão Entrega
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {new Date(activeObra.data_previsao).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/50 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" /> Prazo Decorrido
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {percTempo}% ({diasRestantes} dias restantes)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/50 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Lotes Vendidos
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {activeObra.lotes_vendidos} de {activeObra.total_lotes} ({Math.round((activeObra.lotes_vendidos / activeObra.total_lotes) * 100)}%)
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DETALHAMENTO POR MACRO-ETAPAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Progresso por Disciplina Construtiva
          </h3>
          <span className="text-xs text-slate-400 font-medium">7 macro-etapas</span>
        </div>

        <div className="space-y-2.5">
          {MOCK_MACRO_ETAPAS.map((etapa) => {
            const isFinished = etapa.percentual_realizado >= 100;
            return (
              <div 
                key={etapa.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-navy-900/80 border border-slate-800/80 hover:border-brand-500/30 transition-all"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center border border-slate-700">
                      {etapa.ordem}
                    </span>
                    <span className="font-semibold text-white">{etapa.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Peso: {etapa.peso_orcamento}%
                    </span>
                    <span className={`font-black ${isFinished ? 'text-emerald-400' : 'text-brand-300'}`}>
                      {etapa.percentual_realizado}%
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso com Marcação Previsto x Realizado */}
                <div className="mt-2.5 space-y-1">
                  <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFinished ? 'bg-emerald-500' : 'bg-brand-400'
                      }`}
                      style={{ width: `${etapa.percentual_realizado}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>Executado: {etapa.percentual_realizado}%</span>
                    <span>Meta Prevista: {etapa.percentual_previsto}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
