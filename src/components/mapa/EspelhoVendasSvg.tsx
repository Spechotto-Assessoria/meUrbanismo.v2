import React, { useEffect, useMemo, useState } from 'react';
import { usePdfRenderer } from '../../hooks/usePdfRenderer';
import {
  coresLotePorStatus,
  isPdfUrl,
  lotesComSvg,
  parseImgTransform,
  parseViewBox,
  VIEWBOX_PADRAO,
} from '../../lib/loteMapa';
import type { Lote, MapaImgTransform } from '../../types';

type Props = {
  masterplanUrl?: string | null;
  viewBox?: string | null;
  imgTransform?: MapaImgTransform | null;
  lotes: Lote[];
  selectedLoteId?: string | null;
  onSelect: (lote: Lote) => void;
  onViewboxDetected?: (viewBox: string) => void;
  bloquearAutoViewbox?: boolean;
};

export const EspelhoVendasSvg: React.FC<Props> = ({
  masterplanUrl,
  viewBox,
  imgTransform,
  lotes,
  selectedLoteId,
  onSelect,
  onViewboxDetected,
  bloquearAutoViewbox,
}) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const pdf = usePdfRenderer(isPdfUrl(masterplanUrl) ? masterplanUrl : null);
  const lotesMapeados = useMemo(() => lotesComSvg(lotes), [lotes]);
  const transform = parseImgTransform(imgTransform);

  const viewBoxEfetivo = useMemo(() => {
    if (viewBox?.trim()) return viewBox.trim();
    if (isPdfUrl(masterplanUrl) && pdf.largura > 0 && pdf.altura > 0) {
      return `0 0 ${pdf.largura} ${pdf.altura}`;
    }
    return VIEWBOX_PADRAO;
  }, [viewBox, masterplanUrl, pdf.largura, pdf.altura]);

  const { cssAspectRatio } = useMemo(() => parseViewBox(viewBoxEfetivo), [viewBoxEfetivo]);

  const estiloImagem = useMemo(
    () => ({
      transform: `translate(${transform.offsetX}%, ${transform.offsetY}%) scale(${transform.scale / 100})`,
      transformOrigin: 'center center',
    }),
    [transform]
  );

  useEffect(() => {
    if (bloquearAutoViewbox) return;
    if (isPdfUrl(masterplanUrl) && pdf.largura > 0 && pdf.altura > 0 && !viewBox?.trim()) {
      onViewboxDetected?.(`0 0 ${pdf.largura} ${pdf.altura}`);
    }
  }, [masterplanUrl, pdf.largura, pdf.altura, viewBox, onViewboxDetected, bloquearAutoViewbox]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (bloquearAutoViewbox || viewBox?.trim()) return;
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      onViewboxDetected?.(`0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    }
  };

  const handleSelect = (lote: Lote) => {
    if (lote.id.startsWith('preview-')) return;
    onSelect(lote);
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
          style={estiloImagem}
          onLoad={handleImageLoad}
        />
      )}

      {masterplanUrl && isPdfUrl(masterplanUrl) && (
        <canvas
          ref={pdf.canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={estiloImagem}
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
          const isPreview = lote.id.startsWith('preview-');

          return (
            <g
              key={lote.id}
              className={isPreview ? 'cursor-default' : 'cursor-pointer'}
              onMouseEnter={() => setHoverId(lote.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => handleSelect(lote)}
            >
              <path
                d={lote.svg_path}
                fill={fill}
                stroke={cores.stroke}
                strokeWidth={ativo ? 2.5 : 1.5}
                strokeDasharray={isPreview ? '4 2' : undefined}
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
