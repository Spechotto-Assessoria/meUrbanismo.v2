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
        return { label: 'ADMIN', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'PROPRIETARIO_INVESTIDOR':
        return { label: 'INVESTIDOR', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'CORRETOR':
        return { label: 'CORRETOR', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'CLIENTE_COMPRADOR':
        return { label: 'CLIENTE', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-40 bg-navy-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        
        {/* LOGO + NOME (32px de altura conforme especificação) */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-navy-900 border border-brand-400/30 shadow-glow-sm">
            <img 
              src="/logo-meurbanismo.png" 
              alt="Logo meUrbanismo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white leading-none">
              me<span className="text-brand-400">Urbanismo</span>
            </span>
            <span className="text-[9px] font-semibold text-brand-300/80 uppercase tracking-wider">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900/90 hover:bg-navy-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors shadow-inner"
            title="Trocar Obra / Loteamento"
          >
            <Building2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate text-left">
              {activeObra ? activeObra.nome : 'Selecionar Obra'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showObraMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown de Obras */}
          {showObraMenu && (
            <div className="absolute right-0 sm:left-0 mt-2 w-72 rounded-2xl bg-navy-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      activeObra?.id === o.id
                        ? 'bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{o.nome}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-brand-400" /> {o.cidade} - {o.uf} • {o.tipo}
                      </div>
                    </div>
                    {activeObra?.id === o.id && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
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
              className="w-8 h-8 rounded-lg bg-navy-900 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-400 ring-2 ring-navy-950 animate-pulse"></span>
            </button>

            {/* Painel de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-navy-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-fadeIn text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Notificações Recentes</span>
                  <span className="text-[10px] text-brand-400 font-semibold">2 novas</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <div className="font-semibold text-slate-200">Nova Medição de Pavimentação Aprovada</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Medição nº 6 da Pavimentadora Noroeste foi homologada.</div>
                    <div className="text-[9px] text-brand-400 mt-1">Há 2 horas</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <div className="font-semibold text-slate-200">Diário de Obra Atualizado</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Eng. Rennan registrou a aplicação da capa asfáltica.</div>
                    <div className="text-[9px] text-brand-400 mt-1">Hoje, 17:30</div>
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
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-navy-900/90 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Simular / Alternar Perfil RBAC"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-400/40">
                <img 
                  src={user.avatar_url || '/logo-meurbanismo.png'} 
                  alt={user.nome} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`hidden sm:inline-flex text-[10px] font-black px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Menu de Troca Rápida de Perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-navy-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-fadeIn text-xs">
                <div className="pb-2.5 border-b border-slate-800">
                  <div className="font-bold text-white text-sm">{user.nome}</div>
                  <div className="text-[11px] text-slate-400">{user.email}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    <span className="text-[10px] text-brand-400 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Nível Estrito RBAC
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Alternar Perfil de Teste:
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => { switchRole('admin'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        role === 'ADMINISTRADOR' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">1. ADMINISTRADOR</div>
                        <div className="text-[10px] text-slate-400">Acesso irrestrito total, convites e gestão</div>
                      </div>
                      {role === 'ADMINISTRADOR' && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => { switchRole('investidor'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        role === 'PROPRIETARIO_INVESTIDOR' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">2. PROPRIETÁRIO / INVESTIDOR</div>
                        <div className="text-[10px] text-slate-400">Orçamento, Cronograma e Viabilidade</div>
                      </div>
                      {role === 'PROPRIETARIO_INVESTIDOR' && <Check className="w-4 h-4 text-blue-400" />}
                    </button>

                    <button
                      onClick={() => { switchRole('corretor'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        role === 'CORRETOR' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">3. CORRETOR DE IMÓVEIS</div>
                        <div className="text-[10px] text-slate-400">Vendas, Mapa e Andamento (Sem sigilosos)</div>
                      </div>
                      {role === 'CORRETOR' && <Check className="w-4 h-4 text-amber-400" />}
                    </button>

                    <button
                      onClick={() => { switchRole('cliente'); setShowProfileMenu(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        role === 'CLIENTE_COMPRADOR' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">4. CLIENTE / COMPRADOR</div>
                        <div className="text-[10px] text-slate-400">Andamento e fotos públicas apenas</div>
                      </div>
                      {role === 'CLIENTE_COMPRADOR' && <Check className="w-4 h-4 text-purple-400" />}
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
