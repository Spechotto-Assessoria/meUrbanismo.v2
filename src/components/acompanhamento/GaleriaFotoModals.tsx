import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { FotoObra } from '../../types';
import { apiService } from '../../services/supabase';
import { uploadFotosAcompanhamento } from '../../lib/storage';
import { validarArquivos } from '../../lib/fileValidation';

export const ModalShell: React.FC<{
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ titulo, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-800">{titulo}</h4>
        <button type="button" onClick={onClose}>
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
    {children}
  </div>
);

type UploadProps = {
  obraId: string;
  autorNome: string;
  servicos: string[];
  onClose: () => void;
  onSaved: () => void;
};

export const UploadFotoModal: React.FC<UploadProps> = ({
  obraId,
  autorNome,
  servicos,
  onClose,
  onSaved,
}) => {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(servicos[0] || 'Evolução Geral');
  const [descricao, setDescricao] = useState('');
  const [visivel, setVisivel] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleArquivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = Array.from(e.target.files || []);
    const result = validarArquivos(lista, 'foto');
    if (!result.ok) {
      setErro(result.erro);
      e.target.value = '';
      return;
    }
    setErro(null);
    setArquivos(result.files);
  };

  const enviar = async () => {
    const validacao = validarArquivos(arquivos, 'foto');
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const urls = await uploadFotosAcompanhamento(arquivos, obraId, dataRegistro);
      await Promise.all(
        urls.map((url, i) =>
          apiService.saveFoto({
            obra_id: obraId,
            url,
            titulo: arquivos[i].name.replace(/\.[^.]+$/, ''),
            descricao: descricao || undefined,
            categoria,
            data_registro: dataRegistro,
            autor_nome: autorNome,
            visivel_convidados: visivel,
          })
        )
      );
      onSaved();
    } catch (e: any) {
      setErro(e?.message || 'Falha no upload.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell titulo="Upload em lote" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          multiple
          onChange={handleArquivosChange}
          className="w-full text-xs"
        />
        {arquivos.length > 0 && (
          <p className="text-xs text-slate-500">{arquivos.length} arquivo(s) selecionado(s)</p>
        )}
        <Campo label="Data do registro">
          <input
            type="date"
            value={dataRegistro}
            onChange={(e) => setDataRegistro(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </Campo>
        <Campo label="Serviço executado">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {servicos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Descrição (opcional)">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </Campo>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
          Visível para cliente/comprador
        </label>
        {erro && <p className="text-xs text-rose-600">{erro}</p>}
        <button
          type="button"
          disabled={enviando}
          onClick={enviar}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {enviando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </span>
          ) : (
            'Salvar fotos'
          )}
        </button>
      </div>
    </ModalShell>
  );
};

type EditProps = {
  foto: FotoObra;
  servicos: string[];
  onClose: () => void;
  onSaved: () => void;
};

export const EditFotoModal: React.FC<EditProps> = ({ foto, servicos, onClose, onSaved }) => {
  const [titulo, setTitulo] = useState(foto.titulo || '');
  const [descricao, setDescricao] = useState(foto.descricao || '');
  const [categoria, setCategoria] = useState(foto.categoria || servicos[0]);
  const [visivel, setVisivel] = useState(!!foto.visivel_convidados);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!foto.id) return;
    setSalvando(true);
    try {
      await apiService.saveFoto({
        id: foto.id,
        titulo,
        descricao,
        categoria,
        visivel_convidados: visivel,
      });
      onSaved();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalShell titulo="Editar foto" onClose={onClose}>
      <div className="space-y-3">
        <Campo label="Título">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </Campo>
        <Campo label="Serviço">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {servicos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Descrição">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </Campo>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
          Visível para cliente/comprador
        </label>
        <button
          type="button"
          disabled={salvando}
          onClick={salvar}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg"
        >
          Salvar alterações
        </button>
      </div>
    </ModalShell>
  );
};
