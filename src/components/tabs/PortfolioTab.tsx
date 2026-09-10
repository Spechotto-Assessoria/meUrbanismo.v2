import React, { useMemo } from 'react';
import { Download, ExternalLink, FileText, Mail, MessageCircle } from 'lucide-react';
import { PortfolioPdfViewer } from '../portfolio/PortfolioPdfViewer';
import { linkEmailDocumento, linkWhatsAppDocumento } from '../../lib/documentos-constants';

const PDF_PATH = '/portfolio.pdf';
const PDF_NOME = 'Portfolio_Spechotto.pdf';
const TITULO = 'Portfólio Institucional — Spechotto Assessoria & Construção';
const EMPRESA = 'Spechotto Assessoria & Construção';

const btnBase =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap';

export const PortfolioTab: React.FC = () => {
  const pdfUrlAbs = useMemo(
    () => (typeof window !== 'undefined' ? new URL(PDF_PATH, window.location.origin).href : PDF_PATH),
    []
  );

  const whatsappHref = linkWhatsAppDocumento(TITULO, pdfUrlAbs);
  const emailHref = linkEmailDocumento(TITULO, pdfUrlAbs, EMPRESA);

  return (
    <div className="-mx-3.5 sm:-mx-6 -mt-4 animate-fadeIn">
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 px-3 sm:px-5 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-700" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 truncate">Portfólio Institucional</h1>
              <p className="text-[10px] text-slate-500 truncate">{EMPRESA}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={PDF_PATH}
              download={PDF_NOME}
              className={`${btnBase} bg-blue-600 hover:bg-blue-700 text-white shadow-sm`}
            >
              <Download className="w-3.5 h-3.5" /> Baixar
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBase} bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200`}
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a
              href={emailHref}
              className={`${btnBase} bg-white hover:bg-slate-50 text-slate-700 border border-slate-200`}
            >
              <Mail className="w-3.5 h-3.5" /> E-mail
            </a>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBase} bg-white hover:bg-slate-50 text-slate-600 border border-slate-200`}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Nova aba
            </a>
          </div>
        </div>
      </div>

      <div className="bg-slate-200/70 min-h-[calc(100dvh-220px)]">
        <PortfolioPdfViewer />
      </div>
    </div>
  );
};
