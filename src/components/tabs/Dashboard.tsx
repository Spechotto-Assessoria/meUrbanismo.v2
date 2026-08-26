import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Plus,
  UserPlus,
  Calculator,
  Briefcase,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface DashboardTabProps {
  onSelectObra?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onSelectObra }) => {
  const { user, role, obras, setActiveObra } = useAuth();

  const isAdmin = role === 'ADMINISTRADOR';
  const totalObras = obras.length;
  const valorSobGestao = 'R$ 39.221.779';

  const handleCardClick = (obra: any) => {
    setActiveObra(obra);
    if (onSelectObra) {
      onSelectObra(); // Muda a aba para 'andamento' imediatamente
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Cabeçalho de Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Olá, {user?.nome || 'Utilizador'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Visão geral consolidada de todas as obras administradas'
              : 'Acesso rápido às suas obras e acompanhamento de loteamentos'}
          </p>
        </div>
        <div className="shrink-0">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isAdmin ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
            Perfil: {role}
          </span>
        </div>
      </div>

      {/* 2. Resumo de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase">Total Obras</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalObras}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase">Em Andamento</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalObras}</div>
        </div>

        {isAdmin && (
          <>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Calculator className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold uppercase">Sob Gestão</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{valorSobGestao}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold uppercase">Empresas</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">2</div>
            </div>
          </>
        )}
      </div>

      {/* 3. Acessos Rápidos */}
      {isAdmin && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Acessos Rápidos & Gestão
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => alert('Em breve: Cadastro de Nova Empresa')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2.5 font-medium text-xs text-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                <Plus className="w-4 h-4" />
              </div>
              <span>Nova Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Em breve: Criação de Nova Obra')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2.5 font-medium text-xs text-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Nova Obra</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Em breve: Gestão de Convites')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2.5 font-medium text-xs text-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <UserPlus className="w-4 h-4" />
              </div>
              <span>Enviar Convites</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Em breve: Calculadora de Viabilidade')}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 flex items-center gap-2.5 font-medium text-xs text-blue-900 shadow-xs transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-bold">Estudo Viabilidade</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Lista de Obras Administradas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {isAdmin ? 'Obras Administradas' : 'Minhas Obras Associadas'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {obras.map((obra) => (
            <div
              key={obra.id}
              onClick={() => handleCardClick(obra)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {obra.tipo}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                    {obra.nome}
                  </h3>
                  <p className="text-xs text-slate-500">{obra.cidade} - {obra.uf}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Evolução Física: <strong className="text-slate-900">64.5%</strong></span>
                <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">Ver Detalhes →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};