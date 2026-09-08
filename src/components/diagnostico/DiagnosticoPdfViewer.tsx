import React, { useRef } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { DiagnosticoOverlay } from './DiagnosticoOverlay';
import type { MedicaoDiagnostico, PontoPdf } from '../../types/diagnostico';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  largura: number;
  altura: number;
  scale: number;
  loading: boolean;
  erro: string | null;
  temPdf: boolean;
  rascunho: PontoPdf[];
  medicoes: MedicaoDiagnostico[];
  ferramentaAtiva: boolean;
  onArquivo: (file: File) => void;
  onPonto: (p: PontoPdf) => void;
  onDuploClique: () => void;
}

export const DiagnosticoPdfViewer: React.FC<Props> = ({
  canvasRef,
  largura,
  altura,
  scale,
  loading,
  erro,
  temPdf,
  rascunho,
  medicoes,
  ferramentaAtiva,
  onArquivo,
  onPonto,
  onDuploClique
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const receberArquivo = (file?: File | null) => {
    if (file) onArquivo(file);
  };

  return (
    <div
      className="relative min-h-[420px] rounded-2xl border border-slate-200 bg-slate-100/80 overflow-auto shadow-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        receberArquivo(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => receberArquivo(e.target.files?.[0])}
      />

      {!temPdf && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 m-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 backdrop-blur-sm text-slate-600 cursor-pointer hover:border-slate-400 hover:bg-white/80"
        >
          <FileUp className="w-8 h-8 text-slate-400" />
          <span className="text-sm font-bold text-slate-800">Enviar projeto em PDF</span>
          <span className="text-[11px] text-slate-500">Arraste o arquivo ou clique para selecionar</span>
        </button>
      )}

      <div className="relative inline-block min-w-full">
        <canvas ref={canvasRef} className={`block ${temPdf ? '' : 'hidden'}`} />
        {temPdf && (
          <DiagnosticoOverlay
            largura={largura}
            altura={altura}
            scale={scale}
            rascunho={rascunho}
            medicoes={medicoes}
            ferramentaAtiva={ferramentaAtiva}
            onPonto={onPonto}
            onDuploClique={onDuploClique}
          />
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        </div>
      )}
      {erro && (
        <p className="absolute bottom-3 left-3 right-3 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}
    </div>
  );
};
