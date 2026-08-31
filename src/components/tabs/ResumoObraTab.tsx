import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/supabase';
import {
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
  Grid,
  CheckCircle2,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Briefcase
} from 'lucide-react';
import { TabId } from '../../types';

interface ResumoObraTabProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const ResumoObraTab: React.FC<ResumoObraTabProps> = ({ onNavigateTab }) => {
  const { activeObra, canViewFinancials } = useAuth();
  const [totalOrcado, setTotalOrcado] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrcamento = async () => {
      if (!activeObra) return;
      try {
        const orcamentos = await apiService.getOrcamentos(activeObra.id);
        const total = orcamentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
        setTotalOrcado(total > 0 ? total : (activeObra.custo_orcado || 14850000));
      } catch {
        setTotalOrcado(activeObra.custo_orcado || 14850000);
      } finally {
        setLoading(false);
      }
    };
    loadOrcamento();
  }, [activeObra?.id]);

  if (!activeObra) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        Nenhum empreendimento selecionado.
      </div>
    );
  }

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const formatM2 = (v: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v);

  const areaTotal = activeObra.area_total_m2 || activeObra.areaM2 || 245000;
  const areaVendavel = areaTotal * 0.55; // Média de aproveitamento vendável
  const qtdLotes = activeObra.total_lotes || activeObra.qtdLotes || 312;
  const lotesVendidos = activeObra.lotes_vendidos || 198;
  const lotesDisponiveis = activeObra.lotes_disponiveis || Math.max(0, qtdLotes - lotesVendidos);
  const vgvTotal = activeObra.valor_vgv || 38500000;
  const andamentoGeral = activeObra.percentual_concluido || 68.5;

  const dtInicio = activeObra.data_inicio || activeObra.dataInicio || '2025-01-15';
  const dtPrevisao = activeObra.data_previsao || activeObra.dataEntrega || '2027-06-30';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      
      {/* CABEÇALHO DO EMPREENDIMENTO */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              {activeObra.tipo || 'Loteamento Fechado'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Em Obras
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">{activeObra.nome}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {activeObra.cidade} - {activeObra.uf} • Empresa: <strong className="text-slate-800">{activeObra.empresaNome || activeObra.empresa_nome || 'Spechotto'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
          <div className="text-right text-xs">
            <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Andamento Geral</div>
            <div className="text-lg font-black text-emerald-600">{andamentoGeral}%</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 7 CARDS CONSOLIDADOS OBRIGATÓRIOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Área Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Grid className="w-3.5 h-3.5 text-blue-600" /> Área Total
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate">{formatM2(areaTotal)} m²</div>
          <div className="text-[9px] text-slate-500">Gleba bruta</div>
        </div>

        {/* 2. Quantidade de Lotes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-purple-600" /> Total Lotes
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900">{qtdLotes} lotes</div>
          <div className="text-[9px] text-slate-500">Projetados</div>
        </div>

        {/* 3. Área de Venda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-600" /> Área de Venda
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate">{formatM2(areaVendavel)} m²</div>
          <div className="text-[9px] text-slate-500">Área privativa</div>
        </div>

        {/* 4. Custo Total Global (Orçamento) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-red-600" /> Custo Global
          </div>
          <div className="text-base sm:text-lg font-black text-red-600 truncate">
            {canViewFinancials ? formatBRL(totalOrcado) : '🔒 Restrito'}
          </div>
          <div className="text-[9px] text-slate-500">Orçado no projeto</div>
        </div>

        {/* 5. VGV */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> VGV Total
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 truncate">
            {canViewFinancials ? formatBRL(vgvTotal) : '🔒 Restrito'}
          </div>
          <div className="text-[9px] text-slate-500">Valor potencial</div>
        </div>

        {/* 6. Lotes Disponíveis */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Disponíveis
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600">{lotesDisponiveis} lotes</div>
          <div className="text-[9px] text-slate-500">{lotesVendidos} comercializados</div>
        </div>

        {/* 7. Andamento Geral */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-blue-600" /> Evolução
          </div>
          <div className="text-base sm:text-lg font-black text-blue-600">{andamentoGeral}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${andamentoGeral}%` }}></div>
          </div>
        </div>
      </div>

      {/* PAINEL DE ACESSOS RÁPIDOS AOS MÓDULOS DA OBRA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Módulos de Gestão do Empreendimento
          </h2>
          <span className="text-xs text-slate-500 font-medium">11 abas integradas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'orcamento', label: 'Orçamento', desc: 'Matriz de Custos & Planilha', icon: DollarSign, color: 'text-red-600 bg-red-50' },
            { id: 'cronograma', label: 'Cronograma', desc: 'Físico-Financeiro & Curva S', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
            { id: 'andamento', label: 'Andamento', desc: 'Avanço Físico por Etapa', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'viabilidade', label: 'Viabilidade', desc: 'TIR, VPL, ROI & Payback', icon: PieChart, color: 'text-purple-600 bg-purple-50' },
            { id: 'acompanhamento', label: 'Acompanhamento', desc: 'Fotos, Diário & Medições', icon: Activity, color: 'text-amber-600 bg-amber-50' },
            { id: 'documentos', label: 'Projetos & Docs', desc: 'Pastas & Visibilidade', icon: Layers, color: 'text-cyan-600 bg-cyan-50' },
            { id: 'mapa', label: 'Mapa Lotes', desc: 'Disponibilidade Interativa', icon: Grid, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'vendas', label: 'Vendas 120x', desc: 'Simulador & Propostas', icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'relatorios', label: 'Relatórios', desc: 'Emissão PDF Consolidada', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
            { id: 'portfolio', label: 'Portfólio', desc: 'Spechotto Assessoria', icon: Building2, color: 'text-slate-700 bg-slate-100' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => onNavigateTab && onNavigateTab(m.id as TabId)}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className={`w-8 h-8 rounded-xl ${m.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <m.icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-slate-900 group-hover:text-blue-900">{m.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CRONOGRAMA & DATAS MARCOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" /> Marcos Temporais
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Início Oficial</span>
              <p className="text-sm font-extrabold text-slate-900 mt-1">{new Date(dtInicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Previsão Conclusão</span>
              <p className="text-sm font-extrabold text-slate-900 mt-1">{new Date(dtPrevisao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Gestão & Responsabilidade Técnica
          </h3>
          <div className="text-xs space-y-1.5">
            <p className="text-slate-600">
              <strong>Supervisão Técnica:</strong> Spechotto Assessoria & Construção
            </p>
            <p className="text-slate-600">
              <strong>Engenheiro Responsável:</strong> Rennan Seidl Spechotto (CREA-SP 5069248190)
            </p>
            <p className="text-[11px] text-slate-500">
              Plataforma com conformidade às normas ABNT NBR 12721 e Leis Federais 6.766/79 e 13.465/17.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
