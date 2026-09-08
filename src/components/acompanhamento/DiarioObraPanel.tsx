import React, { useState } from 'react';
import { BookOpen, Calendar, Eye, EyeOff, Plus, Trash2, Users } from 'lucide-react';
import type { DiarioObra } from '../../types';
import { DiarioFormModal } from './DiarioFormModal';
import { apiService } from '../../services/supabase';

type Props = {
  obraId: string;
  diarios: DiarioObra[];
  ultimoDiario: DiarioObra | null;
  autorNome: string;
  podeGerenciar: boolean;
  onReload: () => void;
};

export const DiarioObraPanel: React.FC<Props> = ({
  obraId,
  diarios,
  ultimoDiario,
  autorNome,
  podeGerenciar,
  onReload,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<DiarioObra | null>(null);

  const excluir = async (d: DiarioObra) => {
    if (!d.id || !confirm('Excluir este registro do diário?')) return;
    await apiService.deleteDiario(d.id);
    onReload();
  };

  const alternarVisibilidade = async (d: DiarioObra) => {
    if (!d.id) return;
    await apiService.saveDiario({ id: d.id, visivel_convidados: !d.visivel_convidados });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Diário de Obra</h3>
          <p className="text-xs text-slate-500">
            Registros diários com clima, efetivo, equipamentos e ocorrências
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            onClick={() => {
              setEditando(null);
              setModalAberto(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Novo relatório diário
          </button>
        )}
      </div>

      {diarios.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum registro no diário.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diarios.map((d) => (
            <article
              key={d.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {d.data
                    ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                  {!d.visivel_convidados && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Oculto
                    </span>
                  )}
                </div>
                {podeGerenciar && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => alternarVisibilidade(d)}
                      className="p-1.5 rounded border border-slate-200 hover:bg-slate-50"
                      title="Alternar visibilidade"
                    >
                      {d.visivel_convidados ? (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(d);
                        setModalAberto(true);
                      }}
                      className="px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(d)}
                      className="p-1.5 rounded border border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <InfoChip rotulo="Manhã" valor={d.clima_manha || d.clima} />
                <InfoChip rotulo="Tarde" valor={d.clima_tarde} />
                <InfoChip rotulo="Solo" valor={d.condicao_solo} />
                <InfoChip
                  rotulo="Efetivo"
                  valor={`${d.efetivo_proprio ?? 0} próprio · ${d.efetivo_terceirizado ?? 0} terceirizado`}
                  icone={<Users className="w-3 h-3" />}
                />
              </div>

              {!!d.equipamentos_ativos?.length && (
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">Equipamentos</p>
                  <div className="flex flex-wrap gap-1">
                    {d.equipamentos_ativos.map((eq) => (
                      <span
                        key={eq}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-full"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {d.atividades_realizadas && (
                <Bloco rotulo="Atividades executadas" texto={d.atividades_realizadas} />
              )}
              {d.ocorrencias && <Bloco rotulo="Ocorrências" texto={d.ocorrencias} />}
            </article>
          ))}
        </div>
      )}

      {modalAberto && (
        <DiarioFormModal
          obraId={obraId}
          autorNome={autorNome}
          ultimoDiario={editando ? null : ultimoDiario}
          registro={editando}
          onClose={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSaved={() => {
            setModalAberto(false);
            setEditando(null);
            onReload();
          }}
        />
      )}
    </div>
  );
};

const InfoChip: React.FC<{ rotulo: string; valor?: string; icone?: React.ReactNode }> = ({
  rotulo,
  valor,
  icone,
}) => (
  <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
    <p className="text-[10px] text-slate-400">{rotulo}</p>
    <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
      {icone}
      {valor || '—'}
    </p>
  </div>
);

const Bloco: React.FC<{ rotulo: string; texto: string }> = ({ rotulo, texto }) => (
  <div>
    <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">{rotulo}</p>
    <p className="text-xs text-slate-700 whitespace-pre-wrap">{texto}</p>
  </div>
);
