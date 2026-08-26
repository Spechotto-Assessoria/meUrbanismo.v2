import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  Bell,
  Check,
  Sparkles,
  MapPin,
  User as UserIcon,
  X,
  Save,
  Eye
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Estados para edição do cadastro
  const [nome, setNome] = useState(user.nome || '');
  const [email] = useState(user.email || '');
  const [telefone, setTelefone] = useState('(17) 99999-8888'); // Exemplo
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdmin = user.role === 'ADMINISTRADOR' || role === 'ADMINISTRADOR';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1">

        {/* LOGO */}
        <button
          type="button"
          onClick={() => {
            if (onLogoClick) onLogoClick();
          }}
          className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity text-left cursor-pointer border-0 bg-transparent p-0"
          title="Voltar ao Dashboard Inicial"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
            <img
              src="/logo-meurbanismo.png"
              alt="Logo meUrbanismo"
              className="h-full w-full object-contain"
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
        </button>

        {/* SELETOR DE OBRA */}
        <div className="relative flex-1 min-w-0 max-w-[140px] sm:max-w-[220px] mx-1">
          <button
            type="button"
            onClick={() => setShowObraMenu(!showObraMenu)}
            className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-xs overflow-hidden cursor-pointer"
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
                      setActiveObra(o);
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

          {/* Notificações */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowObraMenu(false);
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

          {/* BOTÃO DO PERFIL */}
          <button
            type="button"
            onClick={() => {
              setShowProfileModal(true);
              setShowObraMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Meu Perfil"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 shrink-0">
              <img
                src={user.avatar_url || '/logo-meurbanismo.png'}
                alt={user.nome}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800">
              Meu Perfil
            </span>
          </button>
        </div>

      </div>

      {/* MODAL DE DADOS CADASTRAIS + SIMULADOR (ADMIN) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-fadeIn max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <img src={user.avatar_url || '/logo-meurbanismo.png'} alt={user.nome} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{user.nome}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  Acesso: {role}
                </span>
              </div>
            </div>

            {/* FORMULÁRIO DE DADOS CADASTRAIS */}
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-blue-600" /> Meus Dados Cadastrais
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>

              {savedSuccess && (
                <p className="text-[11px] text-emerald-600 font-bold text-center">Dados cadastrais atualizados com sucesso!</p>
              )}
            </form>

            {/* PAINEL DE SIMULAÇÃO DE PERFIL (EXCLUSIVO PARA O ADMINISTRADOR) */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-600" /> Modo de Visualização (Admin)
                  </h4>
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                    Simulador
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Alterne abaixo para conferir o que cada perfil visualiza no app:
                </p>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => switchRole('admin')}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${role === 'ADMINISTRADOR'
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>1. Visão Administrador (Total)</span>
                    {role === 'ADMINISTRADOR' && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchRole('investidor')}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${role === 'PROPRIETARIO_INVESTIDOR'
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>2. Visão Proprietário / Investidor</span>
                    {role === 'PROPRIETARIO_INVESTIDOR' && <Check className="w-4 h-4 text-blue-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchRole('corretor')}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${role === 'CORRETOR'
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>3. Visão Corretor de Imóveis</span>
                    {role === 'CORRETOR' && <Check className="w-4 h-4 text-amber-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchRole('cliente')}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${role === 'CLIENTE_COMPRADOR'
                        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>4. Visão Cliente / Comprador</span>
                    {role === 'CLIENTE_COMPRADOR' && <Check className="w-4 h-4 text-purple-700" />}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </header>
  );
};