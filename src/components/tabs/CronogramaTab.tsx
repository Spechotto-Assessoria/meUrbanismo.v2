import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CronogramaItem } from '../../types';
import { apiService } from '../../services/supabase';
import { SkeletonCard } from '../common/SkeletonLoader';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  History, 
  Activity,
  Layers
} from 'lucide-react';

export const CronogramaTab: React.FC = () => {
  const { activeObra } = useAuth();
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grafico' | 'matriz'>('grafico');

  const loadData = async () => {
    if (!activeObra) return;
    setLoading(true);
    const data = await apiService.getCronograma(activeObra.id);
    setCronograma(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id]);

  // Preparação de dados para o gráfico da Curva S
  const chartData = cronograma.map(item => ({
    name: item.mes_label,
    'Previsto Acumulado (%)': item.percentual_previsto_acumulado,
    'Realizado Acumulado (%)': item.status === 'Futuro' ? null : item.percentual_realizado_acumulado,
    'Previsto Mensal (R$ mil)': Math.round(item.valor_previsto_mes / 1000),
    'Realizado Mensal (R$ mil)': item.status === 'Futuro' ? null : Math.round(item.valor_realizado_mes / 1000),
    status: item.status
  }));

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* SELETOR DE VISUALIZAÇÃO (GRÁFICO CURVA S vs MATRIZ MOBILE) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grafico')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'grafico'
                ? 'bg-brand-500 text-white shadow-glow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Curva S (Recharts)
          </button>
          <button
            onClick={() => setViewMode('matriz')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'matriz'
                ? 'bg-brand-500 text-white shadow-glow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Matriz Físico-Financeira
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          {cronograma.length} meses projetados
        </span>
      </div>

      {loading ? (
        <SkeletonCard className="h-80" />
      ) : viewMode === 'grafico' ? (
        /* VISUALIZAÇÃO GRÁFICA DA CURVA S */
        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-navy-900/90 border border-slate-800 shadow-glass space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  Curva S Físico-Financeira
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparativo de Avanço Físico Previsto (%) vs Realizado (%) e Desembolso Mensal
                </p>
              </div>
            </div>

            {/* Container Responsivo do Recharts */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={{ stroke: '#334155' }}
                    unit="%"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    unit="k"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F2942', 
                      borderColor: '#1e3a5f', 
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  
                  {/* Desembolso Mensal (Barras) */}
                  <Bar yAxisId="right" dataKey="Previsto Mensal (R$ mil)" fill="#1e40af" opacity={0.4} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Realizado Mensal (R$ mil)" fill="#0284c7" opacity={0.8} radius={[4, 4, 0, 0]} />

                  {/* Curva S Acumulada (Linhas) */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Previsto Acumulado (%)" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#94a3b8', r: 3 }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Realizado Acumulado (%)" 
                    stroke="#38bdf8" 
                    strokeWidth={3.5}
                    dot={{ fill: '#38bdf8', r: 4, strokeWidth: 2, stroke: '#0F2942' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda Explicativa de Engenharia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
                <span>Linha Cinza: Meta Prevista</span>
              </div>
              <div className="flex items-center gap-2 text-brand-300 font-semibold">
                <span className="w-3 h-1 bg-brand-400 rounded-full inline-block"></span>
                <span>Linha Azul: Realizado</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2.5 h-2.5 bg-blue-900/60 rounded inline-block"></span>
                <span>Barra: Custo Mensal</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Desvio Atual: +0.5% (Adiantado)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO MATRIZ VERTICAL MOBILE-FIRST */
        <div className="space-y-3">
          {cronograma.map((mes) => {
            const isConcluido = mes.status === 'Concluído';
            const isAndamento = mes.status === 'Em Andamento';

            return (
              <div
                key={mes.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isAndamento 
                    ? 'bg-gradient-to-r from-navy-900 to-brand-950/40 border-brand-500/50 shadow-glow-sm'
                    : isConcluido
                    ? 'bg-navy-900/80 border-slate-800'
                    : 'bg-navy-950/60 border-slate-850 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isAndamento ? 'text-brand-400 animate-pulse' : isConcluido ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-white text-sm">{mes.mes_label}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isConcluido 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isAndamento
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {mes.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Previsto no Mês</span>
                    <span className="font-semibold text-slate-300">
                      {mes.percentual_previsto_mes}% (R$ {(mes.valor_previsto_mes / 1000).toFixed(0)}k)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Realizado no Mês</span>
                    <span className="font-bold text-brand-300">
                      {mes.status === 'Futuro' ? '-' : `${mes.percentual_realizado_mes}% (R$ ${(mes.valor_realizado_mes / 1000).toFixed(0)}k)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Previsto Acumulado</span>
                    <span className="font-semibold text-slate-300">
                      {mes.percentual_previsto_acumulado}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Realizado Acumulado</span>
                    <span className={`font-black ${isConcluido || isAndamento ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {mes.status === 'Futuro' ? '-' : `${mes.percentual_realizado_acumulado}%`}
                    </span>
                  </div>
                </div>

                {/* Mini Barra de Progresso Acumulado */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full rounded-full ${isConcluido ? 'bg-emerald-400' : isAndamento ? 'bg-brand-400' : 'bg-slate-700'}`}
                    style={{ width: `${mes.status === 'Futuro' ? mes.percentual_previsto_acumulado : mes.percentual_realizado_acumulado}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SNAPSHOTS HISTÓRICOS */}
      <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <span>Último snapshot gerado automaticamente após a Medição nº 6.</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">25/08/2024</span>
      </div>

    </div>
  );
};
