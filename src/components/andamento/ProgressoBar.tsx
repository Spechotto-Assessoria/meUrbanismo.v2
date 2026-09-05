import React, { useEffect, useState } from 'react';
import { clampPct } from '../../lib/andamento';

type Props = {
  valor: number;
  previsto: number;
};

export const ProgressoBar: React.FC<Props> = ({ valor, previsto }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(clampPct(valor)), 60);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm ring-4 ring-blue-600/15">
        <span className="text-sm font-black tabular-nums">{Math.round(valor)}%</span>
      </div>
      <div className="relative h-5 min-w-0 flex-1 rounded-full bg-slate-100 border border-slate-200/80">
        <div
          className="absolute top-1/2 h-7 w-px -translate-y-1/2 bg-slate-400/60"
          style={{ left: `${clampPct(previsto)}%` }}
          title={`Previsto: ${previsto.toFixed(0)}%`}
        />
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%` }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000 ease-out"
          style={{ left: `${w}%` }}
        >
          <span className="block h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
        </div>
      </div>
    </div>
  );
};
