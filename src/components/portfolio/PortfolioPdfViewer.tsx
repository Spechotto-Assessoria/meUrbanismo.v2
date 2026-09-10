import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePortfolioPdfPages } from '../../hooks/usePortfolioPdfPages';

const PDF_URL = '/portfolio.pdf';

export const PortfolioPdfViewer: React.FC = () => {
  const { totalPaginas, carregandoDoc, renderizadas, erro, registrarPagina } =
    usePortfolioPdfPages(PDF_URL);

  if (erro) {
    return (
      <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 m-4 max-w-lg mx-auto">
        {erro}
      </p>
    );
  }

  return (
    <div className="w-full">
      {carregandoDoc && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Carregando portfólio…</span>
        </div>
      )}

      {!carregandoDoc && totalPaginas > 0 && renderizadas < totalPaginas && (
        <p className="text-center text-[11px] text-slate-500 py-3">
          Preparando páginas… {renderizadas} de {totalPaginas}
        </p>
      )}

      <div className="flex flex-col items-center gap-6 sm:gap-8 py-4 sm:py-6 px-2 sm:px-4">
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            ref={(el) => registrarPagina(num, el)}
            className="w-full max-w-5xl"
          >
            <div className="bg-white shadow-md ring-1 ring-slate-200/70 overflow-hidden">
              <canvas className="block w-full h-auto min-h-[280px] sm:min-h-[420px] bg-white" />
            </div>
            {totalPaginas > 1 && (
              <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold tracking-wide uppercase">
                Página {num} de {totalPaginas}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
