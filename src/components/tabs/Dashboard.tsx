import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/supabase';
import { TabId, MacroEtapa, Lote } from '../../types';
import {
  Building2,
  TrendingUp,
  DollarSign,
  HardHat,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

export interface DashboardProps {
  onNavigate?: (tab: TabId) => void;
  onSelectTab?: (tab: TabId) => void;
}

export const DashboardTab: React.FC<DashboardProps> = ({ onNavigate, onSelectTab }) => {
  const { activeObra, isPublicView } = useAuth();
  const [etapas, setEtapas] = useState<MacroEtapa[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNavigate = (tab: TabId) => {
    if (onNavigate) onNavigate(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  useEffect(() => {
    if (activeObra) {
      carregarDados();
    }
  }, [activeObra]);

  const carregarDados = async () => {
    if (!activeObra) return;
    setLoading(true);
    try {
      const [etapasData, lotesData] = await Promise.all([
        apiService.getMacroEtapas(),
        apiService.getLotes(activeObra.id)
      ]);
      setEtapas(etapasData);
      setLotes(lotesData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const lotesVendidos = lotes.filter(l => l.status === 'vendido' || l.status === 'Vendido').length;
  const lotesReservados = lotes.filter(l => l.status === 'reservado' || l.status === 'Reservado').length;
  const totalLotes = lotes.length || activeObra?.total_lotes || 1;
  const percentualVendas = Math.round(((lotesVendidos + lotesReservados) / totalLotes) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER DO DASHBOARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Painel Executivo</span>
          <h1 className="text-2xl font-black text-white mt-1">{activeObra?.nome || 'Empreendimento'}</h1>
          <p className="text-slate-400 text-xs mt-1">
            {activeObra?.cidade} - {activeObra?.uf} | {activeObra?.tipo}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-2xl text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Status Atual</div>
            <div className="text-sm font-extrabold text-emerald-400">{activeObra?.status || 'Em Andamento'}</div>
          </div>
        </div>
      </div>

      {/* CARDS KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleNavigate('cronograma')}
          className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Avanço Físico</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{activeObra?.percentual_concluido || 0}%</div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Progresso da Infraestrutura</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-brand-400 transition-colors" />
          </div>
        </div>

        <div
          onClick={() => handleNavigate('mapa')}
          className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Comercialização</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{percentualVendas}%</div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>{lotesVendidos} de {totalLotes} lotes vendidos</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>

        <div
          onClick={() => handleNavigate('orcamento')}
          className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Custo Realizado</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            R$ {((activeObra?.custo_realizado || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Orçado: R$ {((activeObra?.custo_orcado || 0) / 1000000).toFixed(1)}M</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" />
          </div>
        </div>

        <div
          onClick={() => handleNavigate('viabilidade')}
          className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">VGV Total</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            R$ {((activeObra?.valor_vgv || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Estudo de Viabilidade</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* MACRO ETAPAS RESUMO */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4">Avanço por Macro Etapas</h3>
        <div className="space-y-3">
          {etapas.map((etapa) => (
            <div key={etapa.id} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{etapa.nome}</span>
                <span className="text-brand-400">{etapa.percentual_realizado || 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${etapa.percentual_realizado || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};