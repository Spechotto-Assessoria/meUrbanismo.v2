import React, { useState } from 'react';
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Pencil,
  Upload,
} from 'lucide-react';
import type { DocumentoObra } from '../../types';
import type { PastaDocumentos } from '../../lib/documentos-constants';
import { apiService } from '../../services/supabase';
import { deleteDocumentoStorage } from '../../lib/storage';
import { DocumentoArquivoCard } from './DocumentoArquivoCard';
import { DocumentoEditModal } from './DocumentoEditModal';
import { DocumentoUploadModal } from './DocumentoUploadModal';

type Props = {
  obraId: string;
  obraNome?: string;
  documentos: DocumentoObra[];
  pastasAtivas: PastaDocumentos[];
  pastasArquivadas: PastaDocumentos[];
  podeGerenciar: boolean;
  podeVerArquivados: boolean;
  mostrarArquivados: boolean;
  onToggleArquivados: () => void;
  onReload: () => void;
};

export const DocumentosPastasPanel: React.FC<Props> = ({
  obraId,
  obraNome,
  documentos,
  pastasAtivas,
  pastasArquivadas,
  podeGerenciar,
  podeVerArquivados,
  mostrarArquivados,
  onToggleArquivados,
  onReload,
}) => {
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});
  const [modalUpload, setModalUpload] = useState(false);
  const [editando, setEditando] = useState<DocumentoObra | null>(null);
  const [pastasExtras, setPastasExtras] = useState<string[]>([]);
  const [renomeando, setRenomeando] = useState<string | null>(null);
  const [novoNomePasta, setNovoNomePasta] = useState('');

  const togglePasta = (chave: string) =>
    setPastasAbertas((p) => ({ ...p, [chave]: !p[chave] }));

  const toggleVisibilidade = async (doc: DocumentoObra) => {
    if (!doc.id) return;
    await apiService.toggleVisibilidadeDocumento(doc.id, !doc.visivel_convidados);
    onReload();
  };

  const excluir = async (doc: DocumentoObra) => {
    if (!doc.id || !confirm(`Excluir "${doc.titulo}" permanentemente?`)) return;
    if (doc.arquivo_url) await deleteDocumentoStorage(doc.arquivo_url);
    await apiService.deleteDocumento(doc.id);
    onReload();
  };

  const arquivarDoc = async (doc: DocumentoObra) => {
    if (!doc.id) return;
    await apiService.arquivarDocumento(doc.id, true);
    onReload();
  };

  const arquivarPastaInteira = async (categoria: string) => {
    if (
      !confirm(
        `Arquivar todos os documentos da pasta "${categoria}"? Use quando a revisão tornar os arquivos defasados.`
      )
    )
      return;
    await apiService.arquivarPasta(obraId, categoria);
    onReload();
  };

  const confirmarRenomearPasta = async (categoriaAntiga: string) => {
    const nome = novoNomePasta.trim();
    if (!nome || nome === categoriaAntiga) {
      setRenomeando(null);
      return;
    }
    await apiService.renomearPasta(obraId, categoriaAntiga, nome);
    setPastasExtras((p) => (p.includes(nome) ? p : [...p, nome]));
    setRenomeando(null);
    setNovoNomePasta('');
    onReload();
  };

  const renderPastas = (pastas: PastaDocumentos[], arquivada = false) =>
    pastas.map((pasta) => {
      const aberta = pastasAbertas[pasta.chave] ?? true;
      return (
        <div
          key={`${arquivada ? 'arq-' : ''}${pasta.chave}`}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50">
            <button
              type="button"
              onClick={() => togglePasta(pasta.chave)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              {aberta ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              {aberta ? (
                <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="text-sm font-semibold text-slate-800 truncate">{pasta.rotulo}</span>
              <span className="text-xs text-slate-400 ml-auto shrink-0">
                {pasta.arquivos.length} arquivo(s)
              </span>
            </button>
            {podeGerenciar && !arquivada && (
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRenomeando(pasta.rotulo);
                    setNovoNomePasta(pasta.rotulo);
                  }}
                  className="p-1.5 rounded border border-slate-200 hover:bg-white"
                  title="Renomear pasta"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => arquivarPastaInteira(pasta.rotulo)}
                  className="p-1.5 rounded border border-amber-200 hover:bg-amber-50"
                  title="Arquivar pasta inteira"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                </button>
              </div>
            )}
          </div>

          {renomeando === pasta.rotulo && (
            <div className="px-4 pb-3 flex gap-2 border-t border-slate-100 pt-2">
              <input
                value={novoNomePasta}
                onChange={(e) => setNovoNomePasta(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={() => confirmarRenomearPasta(pasta.rotulo)}
                className="px-2 py-1 text-xs bg-slate-900 text-white rounded-lg"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setRenomeando(null)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          )}

          {aberta && (
            <div className="border-t border-slate-100 p-3 space-y-3">
              {pasta.arquivos.map((doc) => (
                <DocumentoArquivoCard
                  key={doc.id}
                  doc={doc}
                  obraNome={obraNome}
                  podeGerenciar={podeGerenciar}
                  onToggleVisibilidade={() => toggleVisibilidade(doc)}
                  onEditar={() => setEditando(doc)}
                  onExcluir={() => excluir(doc)}
                  onArquivar={() => arquivarDoc(doc)}
                />
              ))}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          {pastasAtivas.length} pasta(s) · {documentos.filter((d) => !d.arquivado).length} documento(s) ativo(s)
        </p>
        {podeGerenciar && (
          <button
            type="button"
            onClick={() => setModalUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            <Upload className="w-4 h-4" />
            Upload em lote
          </button>
        )}
      </div>

      {pastasAtivas.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum documento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">{renderPastas(pastasAtivas)}</div>
      )}

      {podeVerArquivados && pastasArquivadas.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onToggleArquivados}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {mostrarArquivados ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Archive className="w-4 h-4" />
            Arquivados ({documentos.filter((d) => d.arquivado).length})
          </button>
          {mostrarArquivados && (
            <div className="space-y-2 opacity-80">{renderPastas(pastasArquivadas, true)}</div>
          )}
        </div>
      )}

      {modalUpload && (
        <DocumentoUploadModal
          obraId={obraId}
          documentos={documentos}
          pastasExtras={pastasExtras}
          onClose={() => setModalUpload(false)}
          onSaved={() => {
            setModalUpload(false);
            onReload();
          }}
        />
      )}

      {editando && (
        <DocumentoEditModal
          obraId={obraId}
          doc={editando}
          documentos={documentos}
          pastasExtras={pastasExtras}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            onReload();
          }}
        />
      )}
    </div>
  );
};
