import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  Bell,
  Check,
  MapPin,
  User as UserIcon,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  onLogoClick?: () => void;
  onNavigateAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick, onNavigateAdmin }) => {
  const {
    user,
    role,
    obras,
    activeObra,
    setActiveObra,
    switchRole
  } = useAuth();

  const [showObraMenu, setShowObraMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(user.nome || '');
  const [email] = useState(user.email || '');
  const [telefone, setTelefone] = useState('(17) 99999-8888');
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditing(false);
    }, 2000);
  };

  const handleLogoPress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setShowObraMenu(false);
    setShowNotifications(false);
    setShowProfileDropdown(false);

    if (onLogoClick) {
      onLogoClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1">

        {/* LOGO DO APP */}
        <div
          onClick={handleLogoPress}
          className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity text-left cursor-pointer select-none"
          title="Voltar ao Dashboard Inicial"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
            <img
              src="/logo-meurbanismo.png"
              alt="Logo meUrbanismo"
              className="h-full w-full object-contain pointer-events-none"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-800">
              me<span className="text-[#3b82f6]">U</span>rbanismo
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Spechotto
            </span>
          </div>
        </div>

        {/* SELETOR DE OBRA */}
        <div className="relative flex-1 min-w-0 max-w-[140px] sm:max-w-[220px] mx-1">
          <button
            type="button"
            onClick={() => {
              setShowObraMenu(!showObraMenu);
              setShowNotifications(false);
              setShowProfileDropdown(false);
            }}
            className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs overflow-hidden cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span className="truncate text-left font-medium text-slate-700 text-[11px] sm:text-xs">
              {activeObra ? activeObra.nome : 'Selecionar Obra'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-500 shrink-0 transition-transform ${showObraMenu ? 'rotate-180' : ''}`} />
          </button>

          {showObraMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Selecione o Empreendimento
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {obras.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setActiveObra(o as any);
                      setShowObraMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${activeObra?.id === o.id
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

        {/* NOTIFICAÇÕES E PERFIL */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowObraMenu(false);
                setShowProfileDropdown(false);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors relative shadow-xs cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fadeIn text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Notificações Recentes</span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">2 novas</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-semibold text-slate-900">Nova Medição Aprovada</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Medição nº 6 da Pavimentação homologada.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowObraMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 shrink-0">
                <img
                  src={user.avatar_url || '/logo-meurbanismo.png'}
                  alt={user.nome}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-500 shrink-0 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-84 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-fadeIn text-xs max-h-[80vh] overflow-y-auto">

                <div className="pb-3 border-b border-slate-100">
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {user.nome}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{email}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <span className="text-[10px] text-blue-800 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> Nível Estrito RBAC
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      {isEditing ? 'Cancelar' : 'Editar Dados'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <form onSubmit={handleSaveProfile} className="mt-3 space-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" /> Alterar Dados Cadastrais
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">Nome</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">Telefone</label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </button>
                    {savedSuccess && (
                      <p className="text-[10px] text-emerald-600 font-bold text-center">Salvo com sucesso!</p>
                    )}
                  </form>
                )}

                {role !== 'ADMINISTRADOR' && (
                  <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] text-emerald-900 font-semibold">Modo Simulador Ativo</span>
                    <button
                      type="button"
                      onClick={() => { switchRole('admin'); setShowProfileDropdown(false); }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Voltar p/ Admin
                    </button>
                  </div>
                )}

                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ALTERNAR PERFIL DE TESTE:
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => { switchRole('admin'); setShowProfileDropdown(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${role === 'ADMINISTRADOR'
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">1. ADMINISTRADOR</div>
                        <div className="text-[10px] text-slate-500">Acesso irrestrito total, convites e gestão</div>
                      </div>
                      {role === 'ADMINISTRADOR' && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchRole('investidor'); setShowProfileDropdown(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${role === 'PROPRIETARIO_INVESTIDOR'
                          ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">2. PROPRIETÁRIO / INVESTIDOR</div>
                        <div className="text-[10px] text-slate-500">Orçamento, Cronograma e Viabilidade</div>
                      </div>
                      {role === 'PROPRIETARIO_INVESTIDOR' && <Check className="w-4 h-4 text-blue-800 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchRole('corretor'); setShowProfileDropdown(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${role === 'CORRETOR'
                          ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">3. CORRETOR DE IMÓVEIS</div>
                        <div className="text-[10px] text-slate-500">Vendas, Mapa e Andamento (Sem sigilosos)</div>
                      </div>
                      {role === 'CORRETOR' && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchRole('cliente'); setShowProfileDropdown(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${role === 'CLIENTE_COMPRADOR'
                          ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold">4. CLIENTE / COMPRADOR</div>
                        <div className="text-[10px] text-slate-500">Andamento e fotos públicas apenas</div>
                      </div>
                      {role === 'CLIENTE_COMPRADOR' && <Check className="w-4 h-4 text-purple-700 shrink-0" />}
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