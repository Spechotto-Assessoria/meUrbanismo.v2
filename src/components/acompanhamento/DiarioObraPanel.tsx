import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import type { DiarioObra } from '../../types';
import { agruparDiariosPorMes } from '../../lib/acompanhamento-constants';
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
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, boolean>>({});

  const meses = useMemo(() => agruparDiariosPorMes(diarios), [diarios]);

  const toggleMes = (chave: string) =>
    setMesesAbertos((p) => ({ ...p, [chave]: !p[chave] }));

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
            Registros organizados por mês · {diarios.length} relatório(s)
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

      {meses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum registro no diário.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meses.map((mes) => {
            const aberto = mesesAbertos[mes.chave] ?? true;
            return (
              <div
                key={mes.chave}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleMes(mes.chave)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
                >
                  {aberto ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  {aberto ? (
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Folder className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-semibold text-slate-800 capitalize">{mes.rotulo}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {mes.registros.length} registro(s)
                  </span>
                </button>

                {aberto && (
                  <div className="border-t border-slate-100 p-3 space-y-3">
                    {mes.registros.map((d) => (
                      <DiarioCard
                        key={d.id}
                        diario={d}
                        podeGerenciar={podeGerenciar}
                        onEditar={() => {
                          setEditando(d);
                          setModalAberto(true);
                        }}
                        onExcluir={() => excluir(d)}
                        onAlternarVisibilidade={() => alternarVisibilidade(d)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

type CardProps = {
  diario: DiarioObra;
  podeGerenciar: boolean;
  onEditar: () => void;
  onExcluir: () => void;
  onAlternarVisibilidade: () => void;
};

const DiarioCard: React.FC<CardProps> = ({
  diario: d,
  podeGerenciar,
  onEditar,
  onExcluir,
  onAlternarVisibilidade,
}) => (
  <article className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Calendar className="w-4 h-4 text-slate-400" />
        {d.data
          ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })
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
            onClick={onAlternarVisibilidade}
            className="p-1.5 rounded border border-slate-200 hover:bg-white"
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
            onClick={onEditar}
            className="px-2 py-1 text-xs border border-slate-200 rounded hover:bg-white"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onExcluir}
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
              className="px-2 py-0.5 bg-white text-slate-700 text-[10px] rounded-full border border-slate-200"
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
);

const InfoChip: React.FC<{ rotulo: string; valor?: string; icone?: React.ReactNode }> = ({
  rotulo,
  valor,
  icone,
}) => (
  <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5">
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
