import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Plus,
  Calculator,
  Send,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onSelectObra?: () => void;
  onSelectAdmin?: () => void;
  onNavigateToNovaEmpresa?: () => void;
  onNavigateToNovaObra?: () => void;
}

export const DashboardTab: React.FC<DashboardProps> = ({
  onSelectObra,
  onSelectAdmin,
  onNavigateToNovaEmpresa,
  onNavigateToNovaObra
}) => {
  const { obras, empresas, setActiveObra } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">

      {/* BOAS-VINDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Olá, Spechotto 👋</h1>
          <p className="text-xs text-slate-500">Visão geral de todas as obras administradas.</p>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Obras</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{obras.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Em Andamento</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{obras.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sob Gestão</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">R$ 39.221.779</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Empresas</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{empresas.length}</div>
        </div>
      </div>

      {/* ACESSOS RÁPIDOS & GESTÃO */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acessos Rápidos & Gestão</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onNavigateToNovaEmpresa}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Nova Empresa</div>
              <div className="text-[10px] text-slate-500">Cadastrar central</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToNovaObra}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Nova Obra</div>
              <div className="text-[10px] text-slate-500">Vincular e gerenciar</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onSelectAdmin}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Enviar Convites</div>
              <div className="text-[10px] text-slate-500">Links de acessos</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => alert('Estudo de Viabilidade em breve')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Estudo Viabilidade</div>
              <div className="text-[10px] text-slate-500">Calculadora VGV</div>
            </div>
          </button>
        </div>
      </div>

      {/* OBRAS ADMINISTRADAS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Obras Administradas</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {obras.map(o => (
            <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 uppercase">
                    {o.tipo}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1">{o.nome}</h3>
                  <p className="text-xs text-slate-500">{o.cidade} - {o.uf}</p>
                  <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Empresa: {o.empresaNome}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveObra(o);
                    if (onSelectObra) onSelectObra();
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors cursor-pointer border border-slate-200 shrink-0"
                  title="Abrir Empreendimento"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Evolução Física: <strong className="text-slate-800">64.5%</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveObra(o);
                    if (onSelectObra) onSelectObra();
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                >
                  Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};