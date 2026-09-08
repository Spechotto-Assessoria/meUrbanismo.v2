import React from 'react';
import type { MedicaoDiagnostico, PontoPdf } from '../../types/diagnostico';

interface Props {
  largura: number;
  altura: number;
  scale: number;
  rascunho: PontoPdf[];
  medicoes: MedicaoDiagnostico[];
  ferramentaAtiva: boolean;
  onPonto: (p: PontoPdf) => void;
  onDuploClique: () => void;
}

function toCanvas(p: PontoPdf, scale: number) {
  return { x: p.x * scale, y: p.y * scale };
}

export const DiagnosticoOverlay: React.FC<Props> = ({
  largura,
  altura,
  scale,
  rascunho,
  medicoes,
  ferramentaAtiva,
  onPonto,
  onDuploClique
}) => {
  if (largura <= 0 || altura <= 0) return null;

  const clique = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!ferramentaAtiva) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * largura / scale;
    const y = ((e.clientY - rect.top) / rect.height) * altura / scale;
    onPonto({ x, y });
  };

  const pontosSvg = rascunho.map((p) => toCanvas(p, scale));
  const dRascunho = pontosSvg.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg
      className={`absolute inset-0 ${ferramentaAtiva ? 'cursor-crosshair' : 'cursor-default'}`}
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      onClick={clique}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDuploClique();
      }}
    >
      {medicoes.map((m) => {
        const pts = m.pontos.map((p) => toCanvas(p, scale));
        if (pts.length === 0) return null;
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        if (m.tipo === 'area' && pts.length >= 3) {
          return (
            <polygon
              key={m.id}
              points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgb(30 58 138 / 0.18)"
              stroke="#1e3a8a"
              strokeWidth={2}
            />
          );
        }
        return (
          <path key={m.id} d={d} fill="none" stroke="#0f766e" strokeWidth={2.5} strokeLinecap="round" />
        );
      })}

      {dRascunho && (
        <path d={dRascunho} fill="none" stroke="#b45309" strokeWidth={2} strokeDasharray="6 4" />
      )}
      {pontosSvg.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#b45309" stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
};
