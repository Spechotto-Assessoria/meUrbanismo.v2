import React from 'react';
import {
  Ruler,
  Spline,
  Pentagon,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Check,
  Undo2,
  Loader2
} from 'lucide-react';
import type { CategoriaLevantamento, FerramentaDiagnostico } from '../../types/diagnostico';
import { CATEGORIAS_LEVANTAMENTO } from '../../types/diagnostico';

interface Props {
  ferramenta: FerramentaDiagnostico;
  onFerramenta: (f: FerramentaDiagnostico) => void;
  categoriaAtiva: CategoriaLevantamento;
  onCategoria: (id: CategoriaLevantamento) => void;
  escalaOk: boolean;
  rotuloEscala?: string;
  pontosRascunho: number;
  pagina: number;
  totalPaginas: number;
  onPagina: (delta: number) => void;
  onZoom: (delta: number) => void;
  onConcluirArea: () => void;
  onDesfazer: () => void;
  onExtrairIa: () => void;
  extraindo: boolean;
  temPdf: boolean;
}

const btnBase =
  'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export const DiagnosticoToolbar: React.FC<Props> = ({
  ferramenta,
  onFerramenta,
  categoriaAtiva,
  onCategoria,
  escalaOk,
  rotuloEscala,
  pontosRascunho,
  pagina,
  totalPaginas,
  onPagina,
  onZoom,
  onConcluirArea,
  onDesfazer,
  onExtrairIa,
  extraindo,
  temPdf
}) => {
  const ativo = (f: FerramentaDiagnostico) =>
    ferramenta === f
      ? 'bg-slate-900 text-white border-slate-900'
      : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-50';

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm p-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!temPdf}
          onClick={() => onFerramenta('calibrar')}
          className={`${btnBase} ${ativo('calibrar')}`}
          title="Desenhe uma linha sobre uma medida conhecida"
        >
          <Ruler className="w-3.5 h-3.5" /> Calibrar escala
        </button>
        <button
          type="button"
          disabled={!temPdf || !escalaOk}
          onClick={() => onFerramenta('linha')}
          className={`${btnBase} ${ativo('linha')}`}
        >
          <Spline className="w-3.5 h-3.5" /> Medir linha
        </button>
        <button
          type="button"
          disabled={!temPdf || !escalaOk}
          onClick={() => onFerramenta('area')}
          className={`${btnBase} ${ativo('area')}`}
        >
          <Pentagon className="w-3.5 h-3.5" /> Medir área
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <select
          value={categoriaAtiva}
          onChange={(e) => onCategoria(e.target.value as CategoriaLevantamento)}
          className="h-9 max-w-[220px] rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700"
        >
          {CATEGORIAS_LEVANTAMENTO.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo}
            </option>
          ))}
        </select>

        {ferramenta === 'area' && (
          <button type="button" onClick={onConcluirArea} className={`${btnBase} bg-blue-900 text-white border-blue-900`}>
            <Check className="w-3.5 h-3.5" /> Concluir área ({pontosRascunho})
          </button>
        )}
        {pontosRascunho > 0 && (
          <button type="button" onClick={onDesfazer} className={`${btnBase} ${ativo('selecao')}`}>
            <Undo2 className="w-3.5 h-3.5" /> Desfazer
          </button>
        )}

        <button
          type="button"
          disabled={!temPdf || extraindo}
          onClick={onExtrairIa}
          className={`${btnBase} ml-auto bg-slate-800 text-white border-slate-800 hover:bg-slate-900`}
        >
          {extraindo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Extrair quadro de áreas
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[10px] text-slate-500">
          {escalaOk
            ? `Escala: ${rotuloEscala}`
            : 'Sem calibração — desenhe uma referência (ex.: rua = 7 m).'}
        </p>
        {temPdf && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onPagina(-1)} className={`${btnBase} h-8 px-2`}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 min-w-[72px] text-center">
              {pagina} / {totalPaginas || 1}
            </span>
            <button type="button" onClick={() => onPagina(1)} className={`${btnBase} h-8 px-2`}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onZoom(-0.2)} className={`${btnBase} h-8 px-2`}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onZoom(0.2)} className={`${btnBase} h-8 px-2`}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
