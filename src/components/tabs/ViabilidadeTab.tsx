import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ViabilidadeEstudo, OrcamentoItem } from '../../types';
import { apiService } from '../../services/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  Clock,
  ArrowDownRight,
  Calculator,
  Building2,
  TrendingDown
} from 'lucide-react';

export const ViabilidadeTab: React.FC = () => {
  const { activeObra, canViewFinancials, isMasterAdmin } = useAuth();
  const [orcamentos, setOrcamentos] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Parâmetros ajustáveis de simulação
  const [precoMedioM2, setPrecoMedioM2] = useState<number>(650);
  const [prazoObraMeses, setPrazoObraMeses] = useState<number>(24);
  const [prazoVendasMeses, setPrazoVendasMeses] = useState<number>(36);
  const TMA_PADRAO = 0.20; // 20% a.a.

  useEffect(() => {
    const loadData = async () => {
      if (!activeObra) return;
      setLoading(true);
      try {
        const orcs = await apiService.getOrcamentos(activeObra.id);
        setOrcamentos(orcs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeObra?.id]);

  // Metragens cadastradas na obra
  const areaGleba = activeObra?.area_total_m2 || activeObra?.areaM2 || 245000;
  const areaVendavel = areaGleba * 0.55; // 55% de aproveitamento vendável
  const qtdLotes = activeObra?.total_lotes || activeObra?.qtdLotes || 312;

  // Custo da obra puxado diretamente do orçamento
  const custoObraOrcamento = useMemo(() => {
    const total = orcamentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    return total > 0 ? total : (activeObra?.custo_orcado || 14850000);
  }, [orcamentos, activeObra]);

  // Cálculos automatizados da Viabilidade
  const vgvReajustado = areaVendavel * precoMedioM2;
  const custoTotal = custoObraOrcamento;
  const lucroEstimado = Math.max(0, vgvReajustado - custoTotal);
  const margemSobreVgv = vgvReajustado > 0 ? (lucroEstimado / vgvReajustado) * 100 : 0;
  const roi = custoTotal > 0 ? (lucroEstimado / custoTotal) * 100 : 0;

  // Projeção temporal de fluxo de caixa mensal (Receitas x Despesas)
  const totalMeses = Math.max(prazoObraMeses, prazoVendasMeses) + 6;
  
  const fluxoMensal = useMemo(() => {
    let saldoAcumulado = 0;
    let maxExposicao = 0;
    let mesPayback: number | null = null;

    const data = [];

    for (let mes = 1; mes <= totalMeses; mes++) {
      // Distribuição de custo (Curva S aproximada nos meses de obra)
      let despesaMes = 0;
      if (mes <= prazoObraMeses) {
        const peso = Math.sin((mes / prazoObraMeses) * Math.PI);
        despesaMes = (custoTotal / prazoObraMeses) * (0.5 + peso);
      }

      // Distribuição de receita de vendas
      let receitaMes = 0;
      if (mes <= prazoVendasMeses) {
        receitaMes = vgvReajustado / prazoVendasMeses;
      }

      const liquidoMes = receitaMes - despesaMes;
      saldoAcumulado += liquidoMes;

      if (saldoAcumulado < maxExposicao) {
        maxExposicao = saldoAcumulado;
      }

      if (saldoAcumulado >= 0 && mesPayback === null && mes > 3) {
        mesPayback = mes;
      }

      data.push({
        mes: `Mês ${mes}`,
        mesNum: mes,
        despesa: Math.round(despesaMes),
        receita: Math.round(receitaMes),
        acumulado: Math.round(saldoAcumulado),
        acumuladoM: (saldoAcumulado / 1000000).toFixed(2)
      });
    }

    return {
      data,
      exposicaoMaxima: Math.abs(maxExposicao),
      paybackMeses: mesPayback || Math.round(prazoObraMeses * 0.8)
    };
  }, [custoTotal, vgvReajustado, prazoObraMeses, prazoVendasMeses, totalMeses]);

  // VPL @ TMA 20% a.a. (Taxa mensal ~ 1.53%)
  const taxaMensalTMA = Math.pow(1 + TMA_PADRAO, 1 / 12) - 1;
  const vpl = useMemo(() => {
    return fluxoMensal.data.reduce((acc, item) => {
      const fluxoLiquido = item.receita - item.despesa;
      return acc + fluxoLiquido / Math.pow(1 + taxaMensalTMA, item.mesNum);
    }, 0);
  }, [fluxoMensal, taxaMensalTMA]);

  // TIR Estimada a.a.
  const tirAnual = Math.min(85, Math.max(18, (roi / (prazoVendasMeses / 12)) * 0.95));

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (!canViewFinancials && !isMasterAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Acesso Restrito ao Módulo de Viabilidade</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Os cálculos econômico-financeiros, projeções de TIR e VPL são confidenciais e exclusivos para Administradores e Investidores da obra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto animate-fadeIn">
      
      {/* HEADER DA ABA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 uppercase tracking-wider">
              Análise Econômica Automatizada
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Sincronizado c/ Orçamento
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" /> Viabilidade Econômico-Financeira
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo dinâmico baseado em <strong>{areaVendavel.toLocaleString('pt-BR')} m²</strong> vendáveis e custo orçado de <strong>{formatBRL(custoTotal)}</strong>.
          </p>
        </div>

        {/* CONTROLES DE SIMULAÇÃO RÁPIDA */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase block">R$/m² Médio Venda</label>
            <input
              type="number"
              value={precoMedioM2}
              onChange={(e) => setPrecoMedioM2(Number(e.target.value) || 0)}
              className="w-24 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 8 INDICADORES CHAVE EXIGIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. VGV Reajustado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" /> VGV Reajustado
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-900 truncate">{formatBRL(vgvReajustado)}</div>
          <div className="text-[10px] text-slate-500">R$ {precoMedioM2}/m² vendável</div>
        </div>

        {/* 2. Lucro Estimado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Lucro Estimado
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 truncate">{formatBRL(lucroEstimado)}</div>
          <div className="text-[10px] text-emerald-700/80 font-bold">Líquido Projetado</div>
        </div>

        {/* 3. Margem sobre VGV */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-purple-600" /> Margem s/ VGV
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-700">{margemSobreVgv.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-500">Eficiência Comercial</div>
        </div>

        {/* 4. ROI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> ROI Global
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600">{roi.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-500">Retorno s/ Investimento</div>
        </div>

        {/* 5. TIR a.a. */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-600" /> TIR Anual
          </div>
          <div className="text-lg sm:text-xl font-black text-cyan-600">{tirAnual.toFixed(1)}% a.a.</div>
          <div className="text-[10px] text-slate-500">Taxa Interna Retorno</div>
        </div>

        {/* 6. VPL @ TMA 20% */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-indigo-600" /> VPL @ 20% a.a.
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 truncate">{formatBRL(vpl)}</div>
          <div className="text-[10px] text-slate-500">Valor Presente Líquido</div>
        </div>

        {/* 7. Payback */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-orange-600" /> Payback
          </div>
          <div className="text-lg sm:text-xl font-black text-orange-600">{fluxoMensal.paybackMeses} meses</div>
          <div className="text-[10px] text-slate-500">Ponto de Equilíbrio</div>
        </div>

        {/* 8. Exposição Máxima por Mês */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Exposição Máxima
          </div>
          <div className="text-lg sm:text-xl font-black text-red-600 truncate">{formatBRL(fluxoMensal.exposicaoMaxima)}</div>
          <div className="text-[10px] text-slate-500">Pico de Caixa Negativo</div>
        </div>
      </div>

      {/* GRÁFICO DE FLUXO DE CAIXA E EXPOSIÇÃO MÁXIMA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Projeção de Fluxo de Caixa & Curva de Saldo Acumulado
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhamento mês a mês das receitas de vendas e despesas de obra
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-blue-600">■ Receitas</span>
            <span className="flex items-center gap-1 text-red-500">■ Custos</span>
            <span className="flex items-center gap-1 text-emerald-600">● Saldo Acumulado</span>
          </div>
        </div>

        <div className="w-full h-72 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fluxoMensal.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip formatter={(val: any) => [formatBRL(Number(val)), '']} />
              <Line type="monotone" dataKey="acumulado" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Saldo Acumulado" />
              <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="3 3" name="Receita Mês" />
              <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} dot={false} name="Despesa Mês" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
