import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { MedicaoItem } from '../../types';
import { apiService } from '../../services/supabase';
import { deleteStorageFile } from '../../lib/storage';
import { MedicaoFormModal } from './MedicaoFormModal';

type Props = {
  obraId: string;
  medicoes: MedicaoItem[];
  podeGerenciar: boolean;
  onReload: () => void;
};

type GrupoMedicao = {
  chave: string;
  empresa: string;
  servico: string;
  itens: MedicaoItem[];
};

function agruparMedicoes(lista: MedicaoItem[]): GrupoMedicao[] {
  const mapa = new Map<string, GrupoMedicao>();
  for (const m of lista) {
    const empresa = m.fornecedor_empreiteiro || 'Sem empresa';
    const servico = m.servico_executado || 'Geral';
    const chave = `${empresa}::${servico}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, empresa, servico, itens: [] });
    }
    mapa.get(chave)!.itens.push(m);
  }
  return [...mapa.values()].sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
}

export const MedicoesPanel: React.FC<Props> = ({ obraId, medicoes, podeGerenciar, onReload }) => {
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<'novo' | MedicaoItem | null>(null);

  const grupos = useMemo(() => agruparMedicoes(medicoes), [medicoes]);

  const toggleGrupo = (chave: string) =>
    setGruposAbertos((p) => ({ ...p, [chave]: !p[chave] }));

  const alternarVisibilidade = async (m: MedicaoItem) => {
    if (!m.id) return;
    await apiService.saveMedicao({ id: m.id, visivel_convidados: !m.visivel_convidados });
    onReload();
  };

  const excluir = async (m: MedicaoItem) => {
    if (!m.id || !confirm('Excluir esta medição?')) return;
    if (m.link_relatorio_pdf) await deleteStorageFile(m.link_relatorio_pdf);
    await apiService.deleteMedicao(m.id);
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Medições (PDF)</h3>
          <p className="text-xs text-slate-500">
            Organizadas por empresa e serviço · histórico de relatórios
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            onClick={() => setModal('novo')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Nova medição
          </button>
        )}
      </div>

      {grupos.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma medição cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {grupos.map((g) => {
            const aberto = gruposAbertos[g.chave] ?? true;
            return (
              <div key={g.chave} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGrupo(g.chave)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
                >
                  {aberto ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <Folder className="w-4 h-4 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{g.empresa}</p>
                    <p className="text-xs text-slate-500 truncate">{g.servico}</p>
                  </div>
                  <span className="text-xs text-slate-400">{g.itens.length} PDF(s)</span>
                </button>
                {aberto && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {g.itens.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {m.resumo_atividades || `Medição #${m.numero_medicao || '—'}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {m.data_medicao
                                ? new Date(m.data_medicao + 'T12:00:00').toLocaleDateString('pt-BR')
                                : m.periodo_referencia || '—'}
                              {!m.visivel_convidados && (
                                <span className="ml-2 text-amber-600">· Oculto</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 sm:justify-end">
                          {m.link_relatorio_pdf && (
                            <a
                              href={m.link_relatorio_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50"
                            >
                              <Download className="w-3 h-3" />
                              Baixar
                            </a>
                          )}
                          {podeGerenciar && (
                            <>
                              <button
                                type="button"
                                onClick={() => setModal(m)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => alternarVisibilidade(m)}
                                className="p-1 border border-slate-200 rounded hover:bg-slate-50"
                              >
                                {m.visivel_convidados ? (
                                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => excluir(m)}
                                className="p-1 border border-rose-200 rounded hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <MedicaoFormModal
          obraId={obraId}
          registro={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            onReload();
          }}
        />
      )}
    </div>
  );
};
