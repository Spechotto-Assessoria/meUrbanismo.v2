import React, { useEffect, useRef, useState } from 'react';
import { clampPct } from '../../lib/andamento';

type Props = {
  valor: number;
  previsto: number;
  editavel?: boolean;
  onChange?: (pct: number) => void;
  onCommit?: (pct: number) => void;
};

export const ProgressoBar: React.FC<Props> = ({ valor, previsto, editavel, onChange, onCommit }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const arrastandoRef = useRef(false);
  const [w, setW] = useState(clampPct(valor));
  const [arrastando, setArrastando] = useState(false);

  useEffect(() => {
    if (arrastando) return;
    const t = setTimeout(() => setW(clampPct(valor)), 60);
    return () => clearTimeout(t);
  }, [valor, arrastando]);

  const pctFromX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.round(clampPct(((clientX - r.left) / Math.max(1, r.width)) * 100));
  };

  const aplicar = (clientX: number) => {
    const pct = pctFromX(clientX);
    setW(pct);
    onChange?.(pct);
  };

  const iniciar = (e: React.PointerEvent) => {
    if (!editavel) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    arrastandoRef.current = true;
    setArrastando(true);
    aplicar(e.clientX);
  };

  const mover = (e: React.PointerEvent) => {
    if (!arrastandoRef.current) return;
    aplicar(e.clientX);
  };

  const soltar = (e: React.PointerEvent) => {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = false;
    setArrastando(false);
    const pct = pctFromX(e.clientX);
    setW(pct);
    onCommit?.(pct);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm ring-4 ring-blue-600/15">
        <span className="text-sm font-black tabular-nums">{Math.round(w)}%</span>
      </div>
      <div
        ref={trackRef}
        className={`relative h-5 min-w-0 flex-1 rounded-full bg-slate-100 border border-slate-200/80 touch-none ${
          editavel ? 'cursor-ew-resize' : ''
        }`}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        role={editavel ? 'slider' : undefined}
        aria-valuemin={editavel ? 0 : undefined}
        aria-valuemax={editavel ? 100 : undefined}
        aria-valuenow={editavel ? Math.round(w) : undefined}
        aria-label={editavel ? 'Percentual realizado' : undefined}
      >
        <div
          className="absolute top-1/2 h-7 w-px -translate-y-1/2 bg-slate-400/60 pointer-events-none"
          style={{ left: `${clampPct(previsto)}%` }}
          title={`Previsto: ${previsto.toFixed(0)}%`}
        />
        <div
          className={`h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 pointer-events-none ${
            arrastando ? '' : 'transition-[width] duration-700 ease-out'
          }`}
          style={{ width: `${w}%` }}
        />
        <div
          className={`absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 ${
            arrastando ? '' : 'transition-[left] duration-700 ease-out'
          } ${editavel ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ left: `${w}%` }}
        >
          <span className="flex h-7 w-7 items-center justify-center">
            <span className="pointer-events-none block h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
          </span>
        </div>
      </div>
    </div>
  );
};
