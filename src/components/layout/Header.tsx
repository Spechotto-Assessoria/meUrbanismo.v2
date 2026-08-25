import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Bell,
  Check,
  Sparkles,
  MapPin
} from 'lucide-react';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    user,
    role,
    obras,
    activeObra,
    setActiveObra,
    switchRole
  } = useAuth();

  const [showObraMenu, setShowObraMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMINISTRADOR':
        return { label: 'ADMIN', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'PROPRIETARIO_INVESTIDOR':
        return { label: 'INVESTIDOR', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'CORRETOR':
        return { label: 'CORRETOR', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'CLIENTE_COMPRADOR':
        return { label: 'CLIENTE', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* LOGO + NOME */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 flex items-center justify-center">
            <img
              src="/logo-meurbanismo.png"
              alt="Logo meUrbanismo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-800">
              me<span className="text-[#3b82f6]">U</span>rbanismo
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Spechotto
            </span>
          </div>
        </div>

        {/* SELETOR DE OBRA ATIVA */}
        <div className="relative">
          <button
            onClick={() => {
              setShowObraMenu(!showObraMenu);
              setShowProfileMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors shadow-xs"
            title="Trocar Obra / Loteamento"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate text-left font-medium">
              {activeObra ? activeObra.nome : 'Selecionar Obra'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showObraMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown de Obras */}
          {showObraMenu && (
            <div className="absolute right-0 sm:left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Selecione o Empreendimento
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {obras.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setActiveObra(o);
                      setShowObraMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${activeObra?.id === o.id
                      ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{o.nome}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-700" /> {o.cidade} - {o.uf} • {o.tipo}
                      </div>
                    </div>
                    {activeObra?.id === o.id && <Check className="w-4 h-4 text-blue-900 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AÇÕES DIREITAS: NOTIFICAÇÕES & SIMULADOR DE PERFIS */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Botão de Notificações com Touch Target de 28px/44px */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                setShowObraMenu(false);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors relative shadow-xs"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
            </button>

            {/* Painel de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fadeIn text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Notificações Recentes</span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">2 novas</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-semibold text-slate-900">Nova Medição de Pavimentação Aprovada</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Medição nº 6 da Pavimentadora Noroeste foi homologada.</div>
                    <div className="text-[9px] text-blue-700 font-medium mt-1">Há 2 horas</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-semibold text-slate-900">Diário de Obra Atualizado</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Eng. Rennan registrou a aplicação da capa asfáltica.</div>
                    <div className="text-[9px] text-blue-700 font-medium mt-1">Hoje, 17:30</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIMULADOR DE PERFIS (RBAC) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowObraMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
              title="Simular / Alternar Perfil RBAC"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300">
                <img
                  src={user.avatar_url || '/logo-meurbanismo.png'}
                  alt={user.nome}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Menu de Troca Rápida de Perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fadeIn text-xs">
                <div className="pb-2.5 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-sm">{user.nome}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    <span className="text-[10px] text-blue-800 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-blue-700" /> Nível Estrito RBAC
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Alternar Perfil de Teste:
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => { switchRole('admin'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${role === 'ADMINISTRADOR' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">1. ADMINISTRADOR</div>
                        <div className="text-[10px] text-slate-500">Acesso irrestrito total, convites e gestão</div>
                      </div>
                      {role === 'ADMINISTRADOR' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>

                    <button
                      onClick={() => { switchRole('investidor'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${role === 'PROPRIETARIO_INVESTIDOR' ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">2. PROPRIETÁRIO / INVESTIDOR</div>
                        <div className="text-[10px] text-slate-500">Orçamento, Cronograma e Viabilidade</div>
                      </div>
                      {role === 'PROPRIETARIO_INVESTIDOR' && <Check className="w-4 h-4 text-blue-800" />}
                    </button>

                    <button
                      onClick={() => { switchRole('corretor'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${role === 'CORRETOR' ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">3. CORRETOR DE IMÓVEIS</div>
                        <div className="text-[10px] text-slate-500">Vendas, Mapa e Andamento (Sem sigilosos)</div>
                      </div>
                      {role === 'CORRETOR' && <Check className="w-4 h-4 text-amber-700" />}
                    </button>

                    <button
                      onClick={() => { switchRole('cliente'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${role === 'CLIENTE_COMPRADOR' ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">4. CLIENTE / COMPRADOR</div>
                        <div className="text-[10px] text-slate-500">Andamento e fotos públicas apenas</div>
                      </div>
                      {role === 'CLIENTE_COMPRADOR' && <Check className="w-4 h-4 text-purple-700" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
