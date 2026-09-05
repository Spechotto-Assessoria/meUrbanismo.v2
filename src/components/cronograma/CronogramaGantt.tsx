import React, { useRef } from 'react';
import { monthLabel, faixaEtapa, redistribuirLinha, type Grid } from '../../lib/cronograma';

type Row = { id: string; nome: string };

type Props = {
  rows: Row[];
  months: string[];
  grid: Grid;
  onChange: (g: Grid) => void;
  disabled?: boolean;
};

export const CronogramaGantt: React.FC<Props> = ({ rows, months, grid, onChange, disabled }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const n = months.length || 1;

  const idxFromX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const t = (clientX - r.left) / Math.max(1, r.width);
    return Math.max(0, Math.min(n - 1, Math.floor(t * n)));
  };

  const aplicar = (etapaId: string, edge: 'start' | 'end', clientX: number) => {
    const idx = idxFromX(clientX);
    const { start, end } = faixaEtapa(months, grid[etapaId]);
    const a = edge === 'start' ? Math.min(idx, end) : start;
    const b = edge === 'end' ? Math.max(idx, start) : end;
    onChange({ ...grid, [etapaId]: redistribuirLinha(months, a, b) });
  };

  const startDrag = (e: React.PointerEvent, etapaId: string, edge: 'start' | 'end') => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    aplicar(etapaId, edge, e.clientX);
    const move = (ev: PointerEvent) => aplicar(etapaId, edge, ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Gantt — arraste para ajustar</h3>
        <p className="text-xs text-slate-500">Barras cobrem os meses com percentual previsto. Arraste as extremidades para redistribuir a etapa.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] grid gap-1" style={{ gridTemplateColumns: 'minmax(8rem,12rem) 1fr' }}>
          <div />
          <div ref={trackRef} className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(2rem, 1fr))` }}>
            {months.map((m) => (
              <div key={m} className="text-[9px] font-bold text-slate-500 text-center uppercase">{monthLabel(m)}</div>
            ))}
          </div>

          {rows.map((row) => {
            const { start, end } = faixaEtapa(months, grid[row.id]);
            const left = (start / n) * 100;
            const width = ((end - start + 1) / n) * 100;
            return (
              <React.Fragment key={row.id}>
                <span className="text-[11px] font-bold text-slate-700 line-clamp-2 pr-2 self-center">{row.nome}</span>
                <div className="relative h-7 rounded-lg bg-slate-50 border border-slate-100">
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-md bg-blue-600/80 border border-blue-700/40"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {!disabled && (
                      <>
                        <button
                          type="button"
                          aria-label="Início"
                          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-md bg-blue-900/40"
                          onPointerDown={(e) => startDrag(e, row.id, 'start')}
                        />
                        <button
                          type="button"
                          aria-label="Fim"
                          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md bg-blue-900/40"
                          onPointerDown={(e) => startDrag(e, row.id, 'end')}
                        />
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
