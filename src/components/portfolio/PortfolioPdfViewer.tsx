import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { usePdfRenderer } from '../../hooks/usePdfRenderer';

const PDF_URL = '/portfolio.pdf';

type Props = {
  className?: string;
};

export const PortfolioPdfViewer: React.FC<Props> = ({ className = '' }) => {
  const pdf = usePdfRenderer(PDF_URL);

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex-1 overflow-auto bg-slate-100/80 flex justify-center items-start p-3 sm:p-6 min-h-0">
        {pdf.erro ? (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 m-4">
            {pdf.erro}
          </p>
        ) : (
          <div className="relative">
            <canvas
              ref={pdf.canvasRef}
              className="block max-w-full h-auto rounded-lg shadow-md bg-white"
            />
            {pdf.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => pdf.irPara(-1)}
            disabled={pdf.pagina <= 1 || pdf.loading}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-600 tabular-nums min-w-[90px] text-center">
            {pdf.totalPaginas > 0 ? `${pdf.pagina} / ${pdf.totalPaginas}` : '—'}
          </span>
          <button
            type="button"
            onClick={() => pdf.irPara(1)}
            disabled={pdf.pagina >= pdf.totalPaginas || pdf.loading}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => pdf.setScale((s) => Math.max(0.5, s - 0.2))}
            disabled={pdf.loading}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-medium text-slate-500 tabular-nums w-10 text-center">
            {Math.round(pdf.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => pdf.setScale((s) => Math.min(2.5, s + 0.2))}
            disabled={pdf.loading}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
