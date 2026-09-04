import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Plus,
  Calculator,
  Send,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Pencil,
  Trash2,
  Archive
} from 'lucide-react';
import type { Obra } from '../../types';

interface DashboardProps {
  onSelectObra?: () => void;
  onSelectAdmin?: () => void;
  onNavigateToNovaEmpresa?: () => void;
  onNavigateToNovaObra?: () => void;
  onNavigateToViabilidade?: () => void;
  onEditObra?: (obra: Obra) => void;
  onNavigateToEmpresas?: () => void;
}

export const DashboardTab: React.FC<DashboardProps> = ({
  onSelectObra,
  onSelectAdmin,
  onNavigateToNovaEmpresa,
  onNavigateToNovaObra,
  onNavigateToViabilidade,
  onEditObra,
  onNavigateToEmpresas
}) => {
  const { user, empresas, setActiveObra, getUserObras, deleteObra, setObraArquivada } = useAuth();
  const { isMasterAdmin, canAccessManagement, canViewFinancials } = useObraAccess();

  const userObras = getUserObras();
  const obrasEmAndamento = userObras.filter(o => o.status === 'Em Andamento').length;

  const handleDeleteObra = async (obra: Obra) => {
    if (!confirm(`Deseja realmente excluir a obra "${obra.nome}"? Todos os dados associados serão excluídos. Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await deleteObra(obra.id);
    } catch (err: any) {
      alert(err?.message || 'Não foi possível excluir a obra.');
    }
  };

  const handleArquivarObra = async (obra: Obra) => {
    if (!confirm(`Arquivar "${obra.nome}"? Ela deixa de aparecer no Dashboard, mas permanece armazenada para o portfólio.`)) {
      return;
    }
    try {
      await setObraArquivada(obra.id, true);
    } catch (err: any) {
      alert(err?.message || 'Não foi possível arquivar a obra. Execute o schema.sql atualizado no Supabase.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">

      {/* CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase">
              {isMasterAdmin ? 'Administração Geral' : 'Painel de Empreendimentos'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Olá, {user?.nome || 'Usuário'} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {isMasterAdmin
              ? 'Visão consolidada de todas as obras, empresas e convites.'
              : 'Seus empreendimentos com acesso autorizado.'}
          </p>
        </div>

        {isMasterAdmin && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Acesso Master Irrestrito
          </div>
        )}
      </div>

      {/* CARDS CONSOLIDADOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Obras</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{userObras.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Em Andamento</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{obrasEmAndamento}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sob Gestão</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
            {canViewFinancials ? 'R$ 39.221.779' : '—'}
          </div>
        </div>

        {isMasterAdmin && onNavigateToEmpresas ? (
          <button
            type="button"
            onClick={onNavigateToEmpresas}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-left hover:border-amber-300 hover:bg-amber-50/30 transition-colors cursor-pointer"
            title="Ver empresas cadastradas"
          >
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Empresas</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-xl font-extrabold text-slate-900">{empresas.length}</div>
              <ChevronRight className="w-4 h-4 text-slate-400 mb-0.5" />
            </div>
          </button>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Empresas</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900">{empresas.length}</div>
          </div>
        )}
      </div>

      {/* ACESSOS RÁPIDOS & GESTÃO (EXCLUSIVO ADMINISTRADOR MASTER) */}
      {canAccessManagement && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Acessos Rápidos & Gestão (Master Admin)
            </h2>
            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              VIP
            </span>
          </div>

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
              onClick={onNavigateToViabilidade}
              className="p-3.5 rounded-2xl bg-white hover:bg-purple-50/50 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center gap-2"
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
      )}

      {/* OBRAS ADMINISTRADAS / LIBERADAS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Empreendimentos Disponíveis ({userObras.length})
        </h2>

        {userObras.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            Nenhum empreendimento vinculado ao seu e-mail de convite.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userObras.map(o => (
              <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 uppercase">
                      {o.tipo}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">{o.nome}</h3>
                    <p className="text-xs text-slate-500">{o.cidade} - {o.uf}</p>
                    <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Empresa: {o.empresaNome || o.empresa_nome}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isMasterAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditObra?.(o)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer border border-slate-200"
                          title="Editar obra"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleArquivarObra(o)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200"
                          title="Arquivar obra"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteObra(o)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer border border-slate-200"
                          title="Excluir obra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveObra(o);
                        if (onSelectObra) onSelectObra();
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors cursor-pointer border border-slate-200"
                      title="Abrir Empreendimento"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Evolução Física: <strong className="text-slate-800">{o.percentual_concluido ?? 0}%</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveObra(o);
                      if (onSelectObra) onSelectObra();
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Acessar Módulos <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};