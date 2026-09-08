import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiService } from '../../services/supabase';
import {
  extensaoDeArquivo,
  pastasDisponiveis,
  slugPasta,
  tituloDeArquivo,
} from '../../lib/documentos-constants';
import { deleteDocumentoStorage, uploadDocumentosObra } from '../../lib/storage';
import type { DocumentoObra } from '../../types';

type Props = {
  obraId: string;
  doc: DocumentoObra;
  documentos: DocumentoObra[];
  pastasExtras: string[];
  onClose: () => void;
  onSaved: () => void;
};

export const DocumentoEditModal: React.FC<Props> = ({
  obraId,
  doc,
  documentos,
  pastasExtras,
  onClose,
  onSaved,
}) => {
  const [titulo, setTitulo] = useState(doc.titulo || '');
  const [pasta, setPasta] = useState(doc.categoria || '');
  const [codigoRevisao, setCodigoRevisao] = useState(doc.codigo_revisao || 'R00');
  const [responsavel, setResponsavel] = useState(doc.responsavel_tecnico || '');
  const [descricao, setDescricao] = useState(doc.descricao || '');
  const [visivel, setVisivel] = useState(!!doc.visivel_convidados);
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const opcoesPasta = pastasDisponiveis(documentos, pastasExtras);

  const salvar = async () => {
    if (!doc.id || !titulo.trim()) {
      setErro('Título é obrigatório.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      let url = doc.arquivo_url;
      let tamanho = doc.tamanho_bytes;
      let ext = doc.tipo_extensao;

      if (novoArquivo) {
        if (doc.arquivo_url) await deleteDocumentoStorage(doc.arquivo_url);
        const slug = slugPasta(pasta || doc.categoria || 'geral');
        const [upload] = await uploadDocumentosObra([novoArquivo], obraId, slug);
        url = upload.url;
        tamanho = novoArquivo.size;
        ext = extensaoDeArquivo(novoArquivo);
      }

      await apiService.saveDocumento({
        id: doc.id,
        obra_id: obraId,
        titulo: titulo.trim(),
        categoria: pasta,
        codigo_revisao: codigoRevisao,
        tamanho_bytes: tamanho,
        tipo_extensao: ext,
        arquivo_url: url,
        visivel_convidados: visivel,
        responsavel_tecnico: responsavel || undefined,
        descricao: descricao || undefined,
      });
      onSaved();
    } catch (e: any) {
      setErro(e?.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800">Editar documento</h4>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Campo label="Título">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label="Pasta">
            <select
              value={pasta}
              onChange={(e) => setPasta(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {opcoesPasta.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Revisão">
              <input
                value={codigoRevisao}
                onChange={(e) => setCodigoRevisao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </Campo>
            <Campo label="Resp. técnico">
              <input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </Campo>
          </div>
          <Campo label="Descrição">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label="Substituir arquivo (opcional)">
            <input
              type="file"
              accept=".pdf,.dwg,.zip,.doc,.docx,.xls,.xlsx,image/*"
              onChange={(e) => setNovoArquivo(e.target.files?.[0] || null)}
              className="w-full text-xs"
            />
            {novoArquivo && (
              <p className="text-xs text-slate-500 mt-1">{tituloDeArquivo(novoArquivo)}</p>
            )}
          </Campo>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
            Visível para cliente/comprador
          </label>
          {erro && <p className="text-xs text-rose-600">{erro}</p>}
          <button
            type="button"
            disabled={salvando}
            onClick={salvar}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-60"
          >
            {salvando ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
    {children}
  </div>
);
