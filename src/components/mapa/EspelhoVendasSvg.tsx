import React, { useEffect, useMemo, useState } from 'react';
import { usePdfRenderer } from '../../hooks/usePdfRenderer';
import {
  coresLotePorStatus,
  isPdfUrl,
  lotesComSvg,
  parseViewBox,
  VIEWBOX_PADRAO,
} from '../../lib/loteMapa';
import type { Lote } from '../../types';

type Props = {
  masterplanUrl?: string | null;
  viewBox?: string | null;
  lotes: Lote[];
  selectedLoteId?: string | null;
  onSelect: (lote: Lote) => void;
  onViewboxDetected?: (viewBox: string) => void;
};

export const EspelhoVendasSvg: React.FC<Props> = ({
  masterplanUrl,
  viewBox,
  lotes,
  selectedLoteId,
  onSelect,
  onViewboxDetected,
}) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const pdf = usePdfRenderer(isPdfUrl(masterplanUrl) ? masterplanUrl : null);
  const lotesMapeados = useMemo(() => lotesComSvg(lotes), [lotes]);

  const viewBoxEfetivo = useMemo(() => {
    if (viewBox?.trim()) return viewBox.trim();
    if (isPdfUrl(masterplanUrl) && pdf.largura > 0 && pdf.altura > 0) {
      return `0 0 ${pdf.largura} ${pdf.altura}`;
    }
    return VIEWBOX_PADRAO;
  }, [viewBox, masterplanUrl, pdf.largura, pdf.altura]);

  const { cssAspectRatio } = useMemo(() => parseViewBox(viewBoxEfetivo), [viewBoxEfetivo]);

  useEffect(() => {
    if (isPdfUrl(masterplanUrl) && pdf.largura > 0 && pdf.altura > 0 && !viewBox?.trim()) {
      onViewboxDetected?.(`0 0 ${pdf.largura} ${pdf.altura}`);
    }
  }, [masterplanUrl, pdf.largura, pdf.altura, viewBox, onViewboxDetected]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (viewBox?.trim()) return;
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      onViewboxDetected?.(`0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shadow-sm"
      style={{ aspectRatio: cssAspectRatio }}
    >
      {masterplanUrl && !isPdfUrl(masterplanUrl) && (
        <img
          src={masterplanUrl}
          alt="Masterplan do empreendimento"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          onLoad={handleImageLoad}
        />
      )}

      {masterplanUrl && isPdfUrl(masterplanUrl) && (
        <canvas
          ref={pdf.canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {!masterplanUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <p className="text-xs text-slate-400 font-medium px-4 text-center">
            Planta do masterplan não configurada
          </p>
        </div>
      )}

      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        viewBox={viewBoxEfetivo}
        preserveAspectRatio="xMidYMid meet"
      >
        {lotesMapeados.map((lote) => {
          const cores = coresLotePorStatus(lote.status);
          const ativo = selectedLoteId === lote.id || hoverId === lote.id;
          const fill = ativo ? cores.fillHover : cores.fill;

          return (
            <g
              key={lote.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoverId(lote.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect(lote)}
            >
              <path
                d={lote.svg_path}
                fill={fill}
                stroke={cores.stroke}
                strokeWidth={ativo ? 2.5 : 1.5}
              />
              {lote.label_x != null && lote.label_y != null && (
                <text
                  x={lote.label_x}
                  y={lote.label_y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[14px] font-bold fill-slate-900 pointer-events-none"
                  style={{ fontSize: '14px' }}
                >
                  {lote.numero}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {isPdfUrl(masterplanUrl) && pdf.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs text-slate-600">
          Carregando planta PDF...
        </div>
      )}
    </div>
  );
};
