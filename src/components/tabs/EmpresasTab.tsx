import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Briefcase,
  ArrowLeft,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Plus,
  Building2,
  Loader2
} from 'lucide-react';
import type { Empresa, Obra } from '../../types';

interface EmpresasTabProps {
  onBack?: () => void;
  onNovaEmpresa?: () => void;
  onEditEmpresa?: (empresa: Empresa) => void;
}

function isArquivada(obra: Obra): boolean {
  return obra.arquivada === true || obra.status === 'Arquivada';
}

export const EmpresasTab: React.FC<EmpresasTabProps> = ({ onBack, onNovaEmpresa, onEditEmpresa }) => {
  const { empresas, obras, deleteEmpresa, setObraArquivada } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const obrasDaEmpresa = (empresaId: string) =>
    obras.filter(o => (o.empresa_id || o.empresaId) === empresaId);

  const handleDeleteEmpresa = async (empresa: Empresa) => {
    const vinculadas = obrasDaEmpresa(empresa.id);
    const avisoObras = vinculadas.length
      ? ` Esta empresa possui ${vinculadas.length} obra(s). A exclusão pode remover também as obras vinculadas.`
      : '';
    if (!confirm(`Excluir a empresa "${empresa.nome}"?${avisoObras} Esta ação não pode ser desfeita.`)) {
      return;
    }
    setErro(null);
    setBusyId(empresa.id);
    try {
      await deleteEmpresa(empresa.id);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível excluir a empresa.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleArquivo = async (obra: Obra) => {
    const arquivar = !isArquivada(obra);
    const msg = arquivar
      ? `Arquivar "${obra.nome}"? Ela sai do Dashboard, mas permanece armazenada para o portfólio.`
      : `Desarquivar "${obra.nome}" e voltar a exibi-la no Dashboard?`;
    if (!confirm(msg)) return;

    setErro(null);
    setBusyId(obra.id);
    try {
      await setObraArquivada(obra.id, arquivar);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível atualizar o arquivo da obra.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-amber-600" /> Empresas cadastradas
            </h1>
            <p className="text-xs text-slate-500">
              Edite ou exclua empresas. Arquive obras concluídas para tirá-las do Dashboard sem apagá-las.
            </p>
          </div>
        </div>
        {onNovaEmpresa && (
          <button
            type="button"
            onClick={onNovaEmpresa}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Empresa
          </button>
        )}
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {erro}
        </div>
      )}

      {empresas.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          Nenhuma empresa cadastrada. Use &quot;Nova Empresa&quot; para começar.
        </div>
      ) : (
        <div className="space-y-4">
          {empresas.map(empresa => {
            const obrasEmp = obrasDaEmpresa(empresa.id);
            const ativas = obrasEmp.filter(o => !isArquivada(o)).length;
            const arquivadas = obrasEmp.length - ativas;

            return (
              <div key={empresa.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {empresa.logo_url ? (
                        <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-slate-900 text-base truncate">{empresa.nome}</h2>
                      {empresa.cnpj && <p className="text-xs text-slate-500">CNPJ {empresa.cnpj}</p>}
                      {(empresa.contato || empresa.email || empresa.telefone) && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {[empresa.contato, empresa.email, empresa.telefone].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">
                        {obrasEmp.length} obra(s) • {ativas} no Dashboard • {arquivadas} arquivada(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditEmpresa?.(empresa)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 cursor-pointer"
                      title="Editar cadastro"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteEmpresa(empresa)}
                      disabled={busyId === empresa.id}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 cursor-pointer disabled:opacity-50"
                      title="Excluir empresa"
                    >
                      {busyId === empresa.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {obrasEmp.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Obras desta empresa</p>
                    {obrasEmp.map(obra => {
                      const arquivada = isArquivada(obra);
                      return (
                        <div
                          key={obra.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                            arquivada ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{obra.nome}</p>
                            <p className="text-[10px] text-slate-500">
                              {obra.status || '—'}
                              {arquivada ? ' • Arquivada (oculta no Dashboard)' : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleToggleArquivo(obra)}
                            disabled={busyId === obra.id}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 border cursor-pointer disabled:opacity-50 ${
                              arquivada
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {busyId === obra.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : arquivada ? (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                            {arquivada ? 'Desarquivar' : 'Arquivar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
