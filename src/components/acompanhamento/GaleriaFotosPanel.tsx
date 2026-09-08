import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { FotoObra } from '../../types';
import {
  agruparFotosPorMesDia,
  servicosDisponiveis,
  SERVICOS_PADRAO,
} from '../../lib/acompanhamento-constants';
import { apiService } from '../../services/supabase';
import { deleteStorageFile } from '../../lib/storage';
import { EditFotoModal, UploadFotoModal } from './GaleriaFotoModals';

type Props = {
  obraId: string;
  fotos: FotoObra[];
  autorNome: string;
  podeGerenciar: boolean;
  onReload: () => void;
};

export const GaleriaFotosPanel: React.FC<Props> = ({
  obraId,
  fotos,
  autorNome,
  podeGerenciar,
  onReload,
}) => {
  const [filtro, setFiltro] = useState('TODAS');
  const [servicosExtras, setServicosExtras] = useState<string[]>([]);
  const [novoServico, setNovoServico] = useState('');
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, boolean>>({});
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({});
  const [modalUpload, setModalUpload] = useState(false);
  const [modalEdit, setModalEdit] = useState<FotoObra | null>(null);
  const [preview, setPreview] = useState<FotoObra | null>(null);
  const [salvando, setSalvando] = useState(false);

  const opcoesServico = useMemo(
    () => servicosDisponiveis(fotos, servicosExtras),
    [fotos, servicosExtras]
  );

  const fotosFiltradas = useMemo(() => {
    if (filtro === 'TODAS') return fotos;
    return fotos.filter((f) => f.categoria === filtro);
  }, [fotos, filtro]);

  const arvore = useMemo(() => agruparFotosPorMesDia(fotosFiltradas), [fotosFiltradas]);

  const toggleMes = (chave: string) =>
    setMesesAbertos((p) => ({ ...p, [chave]: !p[chave] }));
  const toggleDia = (chave: string) =>
    setDiasAbertos((p) => ({ ...p, [chave]: !p[chave] }));

  const adicionarServicoFiltro = () => {
    const s = novoServico.trim();
    if (!s || opcoesServico.includes(s)) return;
    setServicosExtras((p) => [...p, s]);
    setFiltro(s);
    setNovoServico('');
  };

  const alternarVisibilidade = async (foto: FotoObra) => {
    if (!foto.id) return;
    setSalvando(true);
    try {
      await apiService.saveFoto({
        id: foto.id,
        visivel_convidados: !foto.visivel_convidados,
      });
      onReload();
    } finally {
      setSalvando(false);
    }
  };

  const excluirFoto = async (foto: FotoObra) => {
    if (!foto.id || !confirm('Excluir esta foto permanentemente?')) return;
    setSalvando(true);
    try {
      if (foto.url) await deleteStorageFile(foto.url);
      await apiService.deleteFoto(foto.id);
      onReload();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Galeria de Fotos</h3>
          <p className="text-xs text-slate-500">
            Organização por mês e dia · {fotosFiltradas.length} registro(s)
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            onClick={() => setModalUpload(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
          >
            <ImagePlus className="w-4 h-4" />
            Upload em lote
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
        <label className="text-xs font-medium text-slate-600">Filtrar por serviço executado</label>
        <div className="flex flex-wrap gap-2">
          {opcoesServico.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltro(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filtro === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'TODAS' ? 'Todos' : s}
            </button>
          ))}
        </div>
        {podeGerenciar && (
          <div className="flex flex-wrap gap-2 pt-1">
            <input
              value={novoServico}
              onChange={(e) => setNovoServico(e.target.value)}
              placeholder="Novo serviço..."
              className="flex-1 min-w-[140px] px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
            <button
              type="button"
              onClick={adicionarServicoFiltro}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>
        )}
      </div>

      {arvore.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma foto neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {arvore.map((mes) => {
            const mesAberto = mesesAbertos[mes.chave] ?? true;
            return (
              <div key={mes.chave} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleMes(mes.chave)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
                >
                  {mesAberto ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  {mesAberto ? (
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-sm font-semibold text-slate-800 capitalize">{mes.rotulo}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {mes.dias.reduce((n, d) => n + d.fotos.length, 0)} foto(s)
                  </span>
                </button>
                {mesAberto && (
                  <div className="border-t border-slate-100 px-2 pb-2 space-y-1">
                    {mes.dias.map((dia) => {
                      const diaAberto = diasAbertos[dia.chave] ?? true;
                      return (
                        <div key={dia.chave} className="rounded-lg border border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleDia(dia.chave)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                          >
                            {diaAberto ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-xs font-medium text-slate-700">{dia.rotulo}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">{dia.fotos.length}</span>
                          </button>
                          {diaAberto && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 pt-0">
                              {dia.fotos.map((foto) => (
                                <div
                                  key={foto.id}
                                  className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setPreview(foto)}
                                    className="absolute inset-0"
                                  >
                                    <img
                                      src={foto.url}
                                      alt={foto.titulo || 'Foto da obra'}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                  {!foto.visivel_convidados && (
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500/90 text-white text-[9px] rounded">
                                      Oculta
                                    </span>
                                  )}
                                  {podeGerenciar && (
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        disabled={salvando}
                                        onClick={() => alternarVisibilidade(foto)}
                                        className="p-1 bg-white/90 rounded shadow-sm"
                                        title={foto.visivel_convidados ? 'Ocultar convidados' : 'Tornar visível'}
                                      >
                                        {foto.visivel_convidados ? (
                                          <EyeOff className="w-3 h-3 text-slate-600" />
                                        ) : (
                                          <Eye className="w-3 h-3 text-emerald-600" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setModalEdit(foto)}
                                        className="p-1 bg-white/90 rounded shadow-sm"
                                      >
                                        <Pencil className="w-3 h-3 text-slate-600" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={salvando}
                                        onClick={() => excluirFoto(foto)}
                                        className="p-1 bg-white/90 rounded shadow-sm"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-600" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-[10px] text-white truncate">{foto.categoria}</p>
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
              </div>
            );
          })}
        </div>
      )}

      {modalUpload && (
        <UploadFotoModal
          obraId={obraId}
          autorNome={autorNome}
          servicos={[...SERVICOS_PADRAO, ...servicosExtras]}
          onClose={() => setModalUpload(false)}
          onSaved={() => {
            setModalUpload(false);
            onReload();
          }}
        />
      )}

      {modalEdit && (
        <EditFotoModal
          foto={modalEdit}
          servicos={[...SERVICOS_PADRAO, ...servicosExtras]}
          onClose={() => setModalEdit(null)}
          onSaved={() => {
            setModalEdit(null);
            onReload();
          }}
        />
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={preview.url} alt={preview.titulo} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="mt-2 text-white text-sm">
              <p className="font-medium">{preview.titulo}</p>
              {preview.descricao && <p className="text-white/70 text-xs">{preview.descricao}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
