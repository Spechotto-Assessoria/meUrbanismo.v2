import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ViabilidadeEstudo } from '../../types';
import { apiService } from '../../services/supabase';
import { SkeletonCard } from '../common/SkeletonLoader';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  PieChart, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const ViabilidadeTab: React.FC = () => {
  const { activeObra, canViewFinancials } = useAuth();
  const [viabilidade, setViabilidade] = useState<ViabilidadeEstudo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!activeObra) return;
      setLoading(true);
      const data = await apiService.getViabilidade(activeObra.id);
      setViabilidade(data);
      setLoading(false);
    };
    loadData();
  }, [activeObra?.id]);

  if (!canViewFinancials) {
    return (
      <div className="p-8 text-center bg-navy-900/60 rounded-3xl border border-slate-800 space-y-2">
        <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Acesso Restrito</h3>
        <p className="text-xs text-slate-400">
          O módulo de Viabilidade Financeira é confidencial e exclusivo para Administradores e Investidores.
        </p>
      </div>
    );
  }

  if (loading || !viabilidade) {
    return <SkeletonCard className="h-96" />;
  }

  // Dados para o Gráfico de Composição de Custos e Margem
  const composicaoData = [
    { name: 'Terreno', valor: viabilidade.custo_terreno / 1000000, color: '#0284c7' },
    { name: 'Obras Infra', valor: viabilidade.custo_obras_infra / 1000000, color: '#38bdf8' },
    { name: 'Projetos/Lic.', valor: viabilidade.custo_projetos_licencas / 1000000, color: '#0ea5e9' },
    { name: 'Mkt/Admin', valor: viabilidade.custo_marketing_admin / 1000000, color: '#0369a1' },
    { name: 'Comissões', valor: viabilidade.comissoes_vendas / 1000000, color: '#f59e0b' },
    { name: 'Impostos (RET)', valor: viabilidade.impostos_receita / 1000000, color: '#ef4444' },
    { name: 'Lucro Líquido', valor: viabilidade.lucro_liquido_projetado / 1000000, color: '#10b981' }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* HEADER EXECUTIVO */}
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-brand-400" />
          Estudo de Viabilidade Econômico-Financeira
        </h3>
        <p className="text-xs text-slate-400">
          Projeção consolidada de VGV, custos diretos/indiretos, TIR e Margem Líquida
        </p>
      </div>

      {/* CARDS DE INDICADORES CHAVE (VGV, LUCRO, TIR, ROI) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" /> VGV Bruto
          </div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">
            R$ {(viabilidade.vgv_bruto / 1000000).toFixed(1)} M
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Valor Global de Vendas
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-emerald-500/30 shadow-glow-sm">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Lucro Líquido
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-300 mt-1">
            R$ {(viabilidade.lucro_liquido_projetado / 1000000).toFixed(2)} M
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5 font-semibold">
            Margem: {viabilidade.margem_liquida_percentual}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-cyan-400" /> TIR Anual
          </div>
          <div className="text-lg sm:text-xl font-black text-cyan-300 mt-1">
            {viabilidade.tir_anual_percentual}% a.a.
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Taxa Interna de Retorno
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ROI
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300 mt-1">
            {viabilidade.roi_percentual}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Retorno s/ Investimento
          </div>
        </div>
      </div>

      {/* GRÁFICO DE DISTRIBUIÇÃO DO VGV */}
      <div className="p-4 sm:p-6 rounded-3xl bg-navy-900/90 border border-slate-800 shadow-glass space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          Composição da Receita e Custos (em R$ Milhões)
        </h4>

        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={composicaoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="M" />
              <Tooltip 
                formatter={(val: any) => [`R$ ${Number(val).toFixed(2)} Milhões`, 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#0F2942', 
                  borderColor: '#1e3a5f', 
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="valor" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DEMONSTRATIVO DETALHADO (DRE SIMPLIFICADO) & PONTO DE EQUILÍBRIO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* DRE DO LOTEAMENTO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-white text-sm pb-1 border-b border-slate-800">
            Demonstrativo de Resultado Projetado
          </h4>
          
          <div className="flex justify-between py-1 text-slate-300">
            <span>(+) VGV Bruto:</span>
            <span className="font-bold text-white">R$ {viabilidade.vgv_bruto.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 text-rose-400">
            <span>(-) Comissões de Vendas (5%):</span>
            <span>- R$ {viabilidade.comissoes_vendas.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 text-rose-400">
            <span>(-) Impostos RET (5.9%):</span>
            <span>- R$ {viabilidade.impostos_receita.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 font-bold text-cyan-300 border-t border-b border-slate-800">
            <span>(=) Receita Líquida (VGV Líquido):</span>
            <span>R$ {viabilidade.vgv_liquido.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-400">
            <span>(-) Custo Aquisição Terreno:</span>
            <span>- R$ {viabilidade.custo_terreno.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-400">
            <span>(-) Custo Obras de Infraestrutura:</span>
            <span>- R$ {viabilidade.custo_obras_infra.toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-400">
            <span>(-) Projetos, Licenças e Marketing:</span>
            <span>- R$ {(viabilidade.custo_projetos_licencas + viabilidade.custo_marketing_admin).toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex justify-between py-2 font-black text-sm text-emerald-400 border-t-2 border-slate-700">
            <span>(=) Lucro Líquido Final:</span>
            <span>R$ {viabilidade.lucro_liquido_projetado.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* PONTO DE EQUILÍBRIO (BREAK-EVEN) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3 text-xs">
          <h4 className="font-bold text-white text-sm flex items-center gap-1.5 pb-1 border-b border-slate-800">
            <Target className="w-4 h-4 text-brand-400" />
            Ponto de Equilíbrio (Break-Even)
          </h4>

          <p className="text-slate-400 leading-relaxed">
            Momento em que o faturamento das vendas cobre integralmente todos os custos de aquisição, obras e despesas operacionais.
          </p>

          <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Prazo de Break-Even:</span>
              <span className="font-bold text-amber-400">{viabilidade.ponto_equilibrio_meses} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lotes Necessários:</span>
              <span className="font-bold text-brand-300">{viabilidade.ponto_equilibrio_lotes} lotes vendidos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Prazo Total do Projeto:</span>
              <span className="font-bold text-slate-200">{viabilidade.prazo_meses} meses</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Status Atual: Ponto de equilíbrio já superado (198 lotes vendidos).</span>
          </div>
        </div>

      </div>

    </div>
  );
};
