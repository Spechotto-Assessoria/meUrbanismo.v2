import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export const AndamentoTab: React.FC = () => {
  const { activeObra } = useAuth();

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum empreendimento selecionado.
      </div>
    );
  }

  const dtInicio = activeObra.data_inicio || activeObra.dataInicio || '2025-01-01';
  const dtPrevisao = activeObra.data_previsao || activeObra.dataEntrega || '2027-12-31';

  const dataInicioFormatted = new Date(dtInicio).toLocaleDateString('pt-BR');
  const dataPrevisaoFormatted = new Date(dtPrevisao).toLocaleDateString('pt-BR');

  const percentual = activeObra.percentual_concluido ?? 64.5;
  const areaTotal = activeObra.area_total_m2 || activeObra.areaM2 || 0;
  const lotesVendidos = activeObra.lotes_vendidos ?? 120;
  const totalLotes = activeObra.total_lotes || activeObra.qtdLotes || 186;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 uppercase">
              {activeObra.tipo}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{activeObra.nome}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {activeObra.cidade} - {activeObra.uf} • {areaTotal.toLocaleString('pt-BR')} m²
            </p>
          </div>
        </div>
      </div>

      {/* CARDS MÉTIRCAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Progresso Físico</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {percentual}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Início da Obra</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">
            {dataInicioFormatted}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Previsão de Entrega</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">
            {dataPrevisaoFormatted}
          </div>
        </div>
      </div>

      {/* RESUMO DE VENDAS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Comercialização do Loteamento</h2>
        <p className="text-xs text-slate-600">
          Lotes comercializados: <strong className="text-slate-900">{lotesVendidos} de {totalLotes}</strong> ({Math.round((lotesVendidos / (totalLotes || 1)) * 100)}%)
        </p>
      </div>
    </div>
  );
};