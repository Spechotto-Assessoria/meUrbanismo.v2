import React from 'react';
import {
  Archive,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileCode,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { DocumentoObra } from '../../types';
import {
  formatarTamanho,
  linkEmailDocumento,
  linkWhatsAppDocumento,
} from '../../lib/documentos-constants';

type Props = {
  doc: DocumentoObra;
  obraNome?: string;
  podeGerenciar: boolean;
  onToggleVisibilidade: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onArquivar: () => void;
};

export const DocumentoArquivoCard: React.FC<Props> = ({
  doc,
  obraNome,
  podeGerenciar,
  onToggleVisibilidade,
  onEditar,
  onExcluir,
  onArquivar,
}) => {
  const url = doc.arquivo_url || doc.url || '';
  const titulo = doc.titulo || doc.nome || 'Documento';

  const icone = () => {
    const ext = doc.tipo_extensao?.toLowerCase();
    if (ext === 'dwg') return <FileCode className="w-5 h-5 text-amber-600" />;
    if (ext === 'pdf') return <FileCheck className="w-5 h-5 text-rose-600" />;
    return <FileText className="w-5 h-5 text-slate-600" />;
  };

  return (
    <article className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">{icone()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800 leading-snug">{titulo}</h4>
            <div className="flex items-center gap-1 shrink-0">
              {podeGerenciar && (
                <button
                  type="button"
                  onClick={onToggleVisibilidade}
                  title={doc.visivel_convidados ? 'Ocultar do cliente' : 'Tornar visível ao cliente'}
                  className={`p-1.5 rounded border ${
                    doc.visivel_convidados
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {doc.visivel_convidados ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {!podeGerenciar && doc.visivel_convidados && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Público
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rev. {doc.codigo_revisao || 'R00'} · {formatarTamanho(doc.tamanho_bytes)}
            {doc.data_emissao &&
              ` · ${new Date(doc.data_emissao + 'T12:00:00').toLocaleDateString('pt-BR')}`}
          </p>
          {doc.descricao && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{doc.descricao}</p>
          )}
          {doc.responsavel_tecnico && (
            <p className="text-[10px] text-slate-400 mt-1">Resp.: {doc.responsavel_tecnico}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200">
        {url && url !== '#' && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              <Download className="w-3 h-3" />
              Baixar
            </a>
            <a
              href={linkWhatsAppDocumento(titulo, url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
            <a
              href={linkEmailDocumento(titulo, url, obraNome)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              <Mail className="w-3 h-3" />
              E-mail
            </a>
          </>
        )}
        {podeGerenciar && (
          <>
            <button
              type="button"
              onClick={onEditar}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
            {!doc.arquivado && (
              <button
                type="button"
                onClick={onArquivar}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800"
              >
                <Archive className="w-3 h-3" />
                Arquivar
              </button>
            )}
            <button
              type="button"
              onClick={onExcluir}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-rose-200 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
            >
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          </>
        )}
      </div>
    </article>
  );
};
