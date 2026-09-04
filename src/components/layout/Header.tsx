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
  Save,
  LogOut,
  Camera,
  FileText,
  TrendingUp,
  BookOpen,
  Ruler
} from 'lucide-react';
import { TabId, UserRole } from '../../types';
import { tabDestinoNotificacao, tempoRelativo, useNotificacoes } from '../../hooks/useNotificacoes';

interface HeaderProps {
  onLogoClick?: () => void;
  onNavigateAdmin?: () => void;
  onAbrirNotificacao?: (tab: TabId, obraId: string, tipo?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick, onNavigateAdmin, onAbrirNotificacao }) => {
  const {
    user,
    role,
    activeObra,
    setActiveObra,
    getUserObras,
    obras,
    isMasterAdmin,
    logout
  } = useAuth();

  const { itens: notificacoes, naoLidas, marcarLida, marcarTodas, pedirPermissaoPush } = useNotificacoes(
    user?.email,
    role,
    isMasterAdmin
  );

  const [showObraMenu, setShowObraMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [email] = useState(user?.email || '');
  const [telefone, setTelefone] = useState('(17) 99999-8888');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userObras = getUserObras();

  const getRoleBadge = (r: UserRole) => {
    if (isMasterAdmin) {
      return { label: 'MASTER ADMIN', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    }
    switch (r) {
      case 'ADMINISTRADOR':
        return { label: 'ADMIN', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'PROPRIETARIO_INVESTIDOR':
      case 'INVESTIDOR':
        return { label: 'INVESTIDOR', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'CORRETOR':
        return { label: 'CORRETOR', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'CLIENTE_COMPRADOR':
        return { label: 'CLIENTE', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'CONVIDADO', color: 'bg-slate-50 text-slate-700 border-slate-200' };
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

  const fecharMenus = () => {
    setShowObraMenu(false);
    setShowNotifications(false);
    setShowProfileDropdown(false);
  };

  const handleLogoPress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fecharMenus();
    onLogoClick?.();
  };

  const abrirNotificacao = (n: (typeof notificacoes)[number]) => {
    void marcarLida(n.id);
    fecharMenus();
    const obra =
      obras.find(o => o.id === n.obra_id) ||
      getUserObras().find(o => o.id === n.obra_id);
    if (obra) setActiveObra(obra);
    onAbrirNotificacao?.(tabDestinoNotificacao(n.tipo), n.obra_id, n.tipo);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 flex items-center gap-2">

        {/* LOGO DO APP — altura alinhada ao seletor de obra e ao avatar */}
        <button
          type="button"
          onClick={handleLogoPress}
          className="shrink-0 hover:opacity-80 transition-opacity cursor-pointer select-none"
          title="Voltar ao Painel Geral"
        >
          <div className="h-12 w-12 flex items-center justify-center">
            <img
              src="/logo-meurbanismo.png"
              alt="Logo meUrbanismo"
              className="h-full w-full object-contain pointer-events-none"
            />
          </div>
        </button>

        {/* SELETOR DE OBRA — ocupa o espaço horizontal liberado */}
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              setShowObraMenu(!showObraMenu);
              setShowNotifications(false);
              setShowProfileDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs overflow-hidden cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-blue-900 shrink-0" />
            <span className="truncate flex-1 text-left font-bold text-slate-800 text-xs sm:text-sm">
              {activeObra && activeObra.nome ? activeObra.nome : 'Selecionar Obra'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${showObraMenu ? 'rotate-180' : ''}`} />
          </button>

          {showObraMenu && (
            <div className="absolute left-0 right-0 sm:right-auto mt-2 w-full sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Obras Vinculadas</span>
                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {userObras.length} liberadas
                </span>
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {userObras.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum empreendimento vinculado ao seu convite.
                  </div>
                ) : (
                  userObras.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setActiveObra(o as any);
                        setShowObraMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeObra?.id === o.id
                          ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{o.nome}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {o.cidade} - {o.uf} • {o.tipo}
                        </div>
                      </div>
                      {activeObra?.id === o.id && <Check className="w-4 h-4 text-blue-900 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PERFIL COMPACTO — sino sai da barra; bolinha vermelha indica novidades */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowObraMenu(false);
              if (showProfileDropdown) setShowNotifications(false);
            }}
            className="relative w-8 h-8 rounded-full overflow-visible border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Abrir perfil"
          >
            <img
              src={user?.avatar_url || '/logo-meurbanismo.png'}
              alt={user?.nome || 'Usuário'}
              className="w-full h-full object-cover rounded-full"
            />
            {naoLidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.25rem))] rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-fadeIn text-xs max-h-[80vh] overflow-y-auto">

              <div className="pb-3 border-b border-slate-100">
                <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {user?.nome || 'Usuário'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{user?.email}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    {isMasterAdmin && (
                      <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Acesso Total Master
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  void pedirPermissaoPush();
                }}
                className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                  <Bell className="w-4 h-4 text-slate-600" />
                  Atualizações
                </span>
                {naoLidas > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold">em dia</span>
                )}
              </button>

              {showNotifications && (
                <div className="mt-2 rounded-xl border border-slate-200 p-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Notificações Recentes</span>
                    {naoLidas > 0 && (
                      <button
                        type="button"
                        onClick={() => void marcarTodas()}
                        className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100"
                      >
                        marcar lidas
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <div className="p-3 text-center text-[11px] text-slate-400">
                        Nenhuma atualização nas obras vinculadas ao seu convite.
                      </div>
                    ) : (
                      notificacoes.map(n => {
                        const Icone =
                          n.tipo === 'fotos'
                            ? Camera
                            : n.tipo === 'documento'
                              ? FileText
                              : n.tipo === 'andamento'
                                ? TrendingUp
                                : n.tipo === 'diario'
                                  ? BookOpen
                                  : n.tipo === 'medicao'
                                    ? Ruler
                                    : MapPin;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => abrirNotificacao(n)}
                            className={`w-full text-left p-2.5 rounded-xl border cursor-pointer transition-colors ${
                              n.lida
                                ? 'bg-white border-slate-200/80'
                                : 'bg-red-50/70 border-red-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                <Icone className="w-3.5 h-3.5 text-blue-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 leading-snug">{n.titulo}</div>
                                <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.mensagem}</div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {n.obra_nome ? `${n.obra_nome} · ` : ''}
                                  {tempoRelativo(n.created_at)}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {isEditing && (
                <form onSubmit={handleSaveProfile} className="mt-3 space-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" /> Alterar Dados
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

              <div className="mt-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    fecharMenus();
                    await logout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Encerrar Sessão"
                >
                  <LogOut className="w-4 h-4" /> Encerrar Sessão (Sair)
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
