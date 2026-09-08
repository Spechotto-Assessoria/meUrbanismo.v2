import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  Maximize2,
  Minimize2,
  Mail,
  RefreshCw
} from 'lucide-react';

export const PortfolioTab: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const pdfUrl = '/portfolio.pdf';

  return (
    <div className={`space-y-4 max-w-7xl mx-auto pb-16 animate-fadeIn ${fullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4' : ''}`}>
      
      {/* BARRA DE AÇÕES DO PORTFÓLIO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Spechotto Assessoria & Construção
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
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
          </a>

          <a
            href={pdfUrl}
            download="Portfolio_Spechotto.pdf"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Baixar PDF
          </a>

          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title={fullscreen ? 'Sair da Tela Cheia' : 'Expandir Tela Cheia'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VISUALIZADOR DE PDF INTEGRADO */}
      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${fullscreen ? 'h-[calc(100vh-100px)]' : 'h-[75vh] sm:h-[82vh]'}`}>
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
          title="Portfólio Spechotto Assessoria & Construção"
          className="w-full h-full border-0 bg-slate-100"
        />
      </div>

    </div>
  );
};
