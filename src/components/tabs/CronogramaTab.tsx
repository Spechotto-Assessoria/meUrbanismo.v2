import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import { CronogramaItem } from '../../types';
import { apiService } from '../../services/supabase';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  CheckCircle2,
  Activity,
  Layers,
  UploadCloud,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

export const CronogramaTab: React.FC = () => {
  const { activeObra } = useAuth();
  const { isMasterAdmin, canViewFinancials, isCliente, isCorretor } = useObraAccess();

  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grafico' | 'matriz'>('grafico');
  const [modoDistribuicao, setModoDistribuicao] = useState<'auto' | 'custom'>('auto');
  const [prazoMeses, setPrazoMeses] = useState<number>(24);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const custoTotalObra = activeObra?.custo_orcado || 14850000;

  // Geração automática de Curva S proporcional padrão de mercado
  const autoCronograma = useMemo(() => {
    const meses = prazoMeses;
    const items: any[] = [];
    let acumuladoPerc = 0;
    let acumuladoValor = 0;

    for (let m = 1; m <= meses; m++) {
      const t = m / meses;
      const pesoMensal = Math.sin(t * Math.PI) * (1.5 / meses);
      const percMes = Math.min(100 - acumuladoPerc, m === meses ? 100 - acumuladoPerc : parseFloat((pesoMensal * 100).toFixed(2)));
      acumuladoPerc = Math.min(100, parseFloat((acumuladoPerc + percMes).toFixed(2)));
      
      const valorMes = (custoTotalObra * percMes) / 100;
      acumuladoValor += valorMes;

      const ano = 2025 + Math.floor((m - 1) / 12);
      const mesNum = ((m - 1) % 12) + 1;
      const mesNome = new Date(ano, mesNum - 1).toLocaleString('pt-BR', { month: 'short' });

      items.push({
        id: `crono-auto-${m}`,
        mes: `Mês ${m}`,
        mes_label: `${mesNome.toUpperCase()}/${String(ano).slice(2)}`,
        percentual_previsto_mes: percMes,
        percentual_previsto_acumulado: acumuladoPerc,
        percentual_realizado_acumulado: m <= 6 ? Math.min(100, acumuladoPerc * 0.95) : null,
        valor_previsto_mes: valorMes,
        valor_previsto_acumulado: acumuladoValor,
        valor_realizado_mes: m <= 6 ? valorMes * 0.95 : null,
        status: m <= 6 ? 'Executado' : 'Previsto'
      });
    }
    return items;
  }, [prazoMeses, custoTotalObra]);

  const dadosAtuais = modoDistribuicao === 'auto' ? autoCronograma : cronograma;

  const chartData = dadosAtuais.map((item: any) => {
    const base: any = {
      name: item.mes_label || item.mes,
      'Previsto Acumulado (%)': item.percentual_previsto_acumulado,
      'Realizado Acumulado (%)': item.percentual_realizado_acumulado,
      status: item.status
    };
    if (canViewFinancials) {
      base['Previsto Mensal (R$ mil)'] = Math.round((item.valor_previsto_mes || 0) / 1000);
      base['Realizado Mensal (R$ mil)'] = item.valor_realizado_mes ? Math.round(item.valor_realizado_mes / 1000) : null;
    }
    return base;
  });

  const handleSimularImportacao = () => {
    setImportStatus('Lendo colunas de meses e etapas da planilha...');
    setTimeout(() => {
      setImportStatus('Curva S recalculada com base nos dados do arquivo.');
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setModoDistribuicao('custom');
      }, 1000);
    }, 1200);
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-fadeIn">
      
      {/* HEADER DO CRONOGRAMA */}
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
              ? `Distribuição orçamentária ao longo de ${prazoMeses} meses (${formatBRL(custoTotalObra)})`
              : `Avanço físico previsto e executado ao longo de ${prazoMeses} meses`}
          </p>
        </div>

        {/* MODO DE DISTRIBUIÇÃO E IMPORTAÇÃO (APENAS INVESTIDOR / ADMIN) */}
        {canViewFinancials && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModoDistribuicao('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoDistribuicao === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-purple-600" /> Auto Curva S
              </button>
              <button
                type="button"
                onClick={() => setModoDistribuicao('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoDistribuicao === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Personalizado
              </button>
            </div>

            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Importar Planilha
              </button>
            )}
          </div>
        )}
      </div>

      {/* SELETOR DE VISUALIZAÇÃO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
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

      {/* VISUALIZAÇÃO GRÁFICA */}
      {viewMode === 'grafico' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Curva S de Evolução
              </h3>
              <p className="text-xs text-slate-500">
                {canViewFinancials
                  ? 'Acompanhamento das linhas acumuladas de avanço e barras de desembolso mensal'
                  : 'Acompanhamento do percentual de avanço físico planejado vs realizado'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-blue-600">● Previsto Acumulado (%)</span>
              <span className="flex items-center gap-1 text-emerald-600">● Realizado Acumulado (%)</span>
              {canViewFinancials && (
                <span className="flex items-center gap-1 text-slate-400">■ Desembolso (R$ mil)</span>
              )}
            </div>
          </div>

          <div className="w-full h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {canViewFinancials ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} unit="k" />
                  <Tooltip formatter={(val: any) => [val, '']} />
                  <Bar yAxisId="right" dataKey="Previsto Mensal (R$ mil)" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Desembolso Mensal (R$ mil)" />
                  <Line yAxisId="left" type="monotone" dataKey="Previsto Acumulado (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} name="Previsto Acumulado (%)" />
                  <Line yAxisId="left" type="monotone" dataKey="Realizado Acumulado (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Realizado Acumulado (%)" />
                </ComposedChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(val: any) => [`${val}%`, '']} />
                  <Line type="monotone" dataKey="Previsto Acumulado (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} name="Previsto Acumulado (%)" />
                  <Line type="monotone" dataKey="Realizado Acumulado (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Realizado Acumulado (%)" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM MATRIZ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3.5">Mês Referência</th>
                  <th className="p-3.5 text-right">% Previsto Mês</th>
                  <th className="p-3.5 text-right">% Acumulado</th>
                  {canViewFinancials && (
                    <>
                      <th className="p-3.5 text-right">Desembolso Previsto</th>
                      <th className="p-3.5 text-right">Desembolso Acumulado</th>
                    </>
                  )}
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dadosAtuais.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800">{item.mes_label || item.mes}</td>
                    <td className="p-3.5 text-right font-medium text-slate-600">{item.percentual_previsto_mes}%</td>
                    <td className="p-3.5 text-right font-black text-blue-600">{item.percentual_previsto_acumulado}%</td>
                    {canViewFinancials && (
                      <>
                        <td className="p-3.5 text-right font-semibold text-slate-800">{formatBRL(item.valor_previsto_mes || 0)}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900">{formatBRL(item.valor_previsto_acumulado || 0)}</td>
                      </>
                    )}
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        item.status === 'Executado'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status || 'Previsto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO DE CRONOGRAMA */}
      {showImportModal && isMasterAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Importar Cronograma Personalizado
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione o arquivo Excel/CSV contendo a distribuição mensal das etapas para recalcular a Curva S automaticamente.
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50">
              <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-700 block">Clique para selecionar a planilha</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Formatos suportados: .xlsx, .csv</span>
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                {importStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSimularImportacao}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                Processar e Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
