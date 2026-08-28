import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TabId, UserRole } from '../../types';
import {
  Building2,
  ChevronDown,
  UserCheck,
  LogOut,
  ShieldAlert,
  Briefcase,
  User as UserIcon,
  Users
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    user,
    activeObra,
    setActiveObra,
    obras,
    role,
    switchRole,
    logout
  } = useAuth();

  const [showObrasDropdown, setShowObrasDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setShowProfileDropdown(false);
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-md shadow-brand-500/20">
            ME
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight hidden sm:inline">
            me<span className="text-brand-400">urbanismo</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* SELETOR DE EMPREENDIMENTO */}
        <div className="relative">
          <button
            onClick={() => setShowObrasDropdown(!showObrasDropdown)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-colors text-xs font-semibold text-slate-200"
          >
            <Building2 className="w-4 h-4 text-brand-400" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">
              {activeObra?.nome || 'Selecionar Empreendimento'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showObrasDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Seus Empreendimentos
              </div>
              {obras.map((obra) => (
                <button
                  key={obra.id}
                  onClick={() => {
                    setActiveObra(obra);
                    setShowObrasDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${activeObra?.id === obra.id ? 'text-brand-400 font-bold bg-slate-800/50' : 'text-slate-300'}`}
                >
                  <span className="truncate">{obra.nome}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{obra.cidade}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PERFIL E SELETOR DE FUNÇÃO (ROLE) */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-500/30">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-white leading-tight">{user?.nome || 'Usuário'}</div>
              <div className="text-[10px] font-medium text-brand-400 uppercase tracking-wider">{role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileDropdown && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                Simular Visão como:
              </div>

              <button
                onClick={() => handleRoleChange('ADMINISTRADOR')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${role === 'ADMINISTRADOR' ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Administrador
              </button>

              <button
                onClick={() => handleRoleChange('PROPRIETARIO_INVESTIDOR')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${role === 'PROPRIETARIO_INVESTIDOR' ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
              >
                <Briefcase className="w-4 h-4 text-cyan-400" />
                Investidor / Sócio
              </button>

              <button
                onClick={() => handleRoleChange('CORRETOR')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${role === 'CORRETOR' ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                Corretor de Vendas
              </button>

              <button
                onClick={() => handleRoleChange('CLIENTE_COMPRADOR')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${role === 'CLIENTE_COMPRADOR' ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
              >
                <UserIcon className="w-4 h-4 text-amber-400" />
                Cliente Comprador
              </button>

              <div className="border-t border-slate-800 mt-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-rose-400 hover:bg-slate-800 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};