import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiService } from '../../services/supabase';
import {
  extensaoDeArquivo,
  pastasDisponiveis,
  PASTAS_PADRAO,
  slugPasta,
  tituloDeArquivo,
} from '../../lib/documentos-constants';
import { uploadDocumentosObra } from '../../lib/storage';
import { validarArquivos } from '../../lib/fileValidation';
import type { DocumentoObra } from '../../types';

type Props = {
  obraId: string;
  documentos: DocumentoObra[];
  pastasExtras: string[];
  onClose: () => void;
  onSaved: () => void;
};

export const DocumentoUploadModal: React.FC<Props> = ({
  obraId,
  documentos,
  pastasExtras,
  onClose,
  onSaved,
}) => {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [pasta, setPasta] = useState<string>(PASTAS_PADRAO[0]);
  const [novaPasta, setNovaPasta] = useState('');
  const [usarNovaPasta, setUsarNovaPasta] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [codigoRevisao, setCodigoRevisao] = useState('R00');
  const [responsavel, setResponsavel] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const opcoesPasta = pastasDisponiveis(documentos, pastasExtras);

  const pastaDestino = usarNovaPasta ? novaPasta.trim() : pasta;

  const handleArquivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = Array.from(e.target.files || []);
    const result = validarArquivos(lista, 'documento');
    if (!result.ok) {
      setErro(result.erro);
      e.target.value = '';
      return;
    }
    setErro(null);
    setArquivos(result.files);
  };

  const enviar = async () => {
    const validacao = validarArquivos(arquivos, 'documento');
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    if (!pastaDestino) {
      setErro('Informe a pasta de destino.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const slug = slugPasta(pastaDestino);
      const uploads = await uploadDocumentosObra(arquivos, obraId, slug);
      await Promise.all(
        uploads.map(({ url, file }) =>
          apiService.saveDocumento({
            obra_id: obraId,
            titulo: tituloDeArquivo(file),
            categoria: pastaDestino,
            codigo_revisao: codigoRevisao,
            data_emissao: new Date().toISOString().slice(0, 10),
            tamanho_bytes: file.size,
            tipo_extensao: extensaoDeArquivo(file),
            arquivo_url: url,
            visivel_convidados: visivel,
            responsavel_tecnico: responsavel || undefined,
            descricao: descricao || undefined,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 sticky top-0 bg-white">
          <h4 className="text-sm font-semibold text-slate-800">Upload em lote</h4>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Campo label="Arquivos (múltiplos)">
            <input
              type="file"
              multiple
              accept=".pdf,.dwg,.zip,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              onChange={handleArquivosChange}
              className="w-full text-xs"
            />
            {arquivos.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">{arquivos.length} arquivo(s) selecionado(s)</p>
            )}
          </Campo>

          <Campo label="Pasta de destino">
            {!usarNovaPasta ? (
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
            ) : (
              <input
                value={novaPasta}
                onChange={(e) => setNovaPasta(e.target.value)}
                placeholder="Nome da nova pasta"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            )}
            <label className="flex items-center gap-2 mt-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={usarNovaPasta}
                onChange={(e) => setUsarNovaPasta(e.target.checked)}
              />
              Criar nova pasta
            </label>
          </Campo>

          <div className="grid grid-cols-2 gap-2">
            <Campo label="Código revisão">
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
                placeholder="Opcional"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </Campo>
          </div>

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
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </span>
            ) : (
              'Salvar documentos'
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
