import React, { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Mail,
  MessageCircle
} from 'lucide-react';
import { PortfolioPdfViewer } from '../portfolio/PortfolioPdfViewer';
import { linkEmailDocumento, linkWhatsAppDocumento } from '../../lib/documentos-constants';

const PDF_PATH = '/portfolio.pdf';
const PDF_NOME = 'Portfolio_Spechotto.pdf';
const TITULO = 'Portfólio Institucional — Spechotto Assessoria & Construção';
const EMPRESA = 'Spechotto Assessoria & Construção';

export const PortfolioTab: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);

  const pdfUrlAbs = useMemo(
    () => (typeof window !== 'undefined' ? new URL(PDF_PATH, window.location.origin).href : PDF_PATH),
    []
  );

  const whatsappHref = linkWhatsAppDocumento(TITULO, pdfUrlAbs);
  const emailHref = linkEmailDocumento(TITULO, pdfUrlAbs, EMPRESA);

  return (
    <div
      className={`space-y-4 max-w-7xl mx-auto pb-16 animate-fadeIn ${
        fullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4' : ''
      }`}
    >
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              {EMPRESA}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Documento Oficial
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Portfólio Institucional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apresentação corporativa, histórico de projetos, serviços de engenharia e cases de sucesso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={PDF_PATH}
            download={PDF_NOME}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Baixar PDF
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>

          <a
            href={emailHref}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> E-mail
          </a>

          <a
            href={PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Nova Aba
          </a>

          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={fullscreen ? 'Sair da tela cheia' : 'Expandir tela cheia'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
          fullscreen ? 'h-[calc(100vh-100px)]' : 'h-[75vh] sm:h-[82vh]'
        }`}
      >
        <PortfolioPdfViewer className="h-full" />
      </div>
    </div>
  );
};
