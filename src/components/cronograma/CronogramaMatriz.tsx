import React from 'react';
import { monthLabel, type EtapaCrono, type Grid, type PontoCurvaS } from '../../lib/cronograma';

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

type Props = {
  etapas: EtapaCrono[];
  months: string[];
  grid: Grid;
  chartData: PontoCurvaS[];
  totalObra: number;
  canEdit: boolean;
  ocultarFinanceiro: boolean;
  rowTotal: (etapaId: string) => number;
  onCell: (etapaId: string, month: string, v: string) => void;
};

export const CronogramaMatriz: React.FC<Props> = ({
  etapas,
  months,
  grid,
  chartData,
  totalObra,
  canEdit,
  ocultarFinanceiro,
  rowTotal,
  onCell
}) => {
  const money = (n: number) => (ocultarFinanceiro ? '—' : brl(n));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <p className="text-xs text-slate-500 px-3.5 pt-3 md:hidden">
        Deslize para os lados para ver os meses posteriores
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
            <tr>
              <th className="p-3.5 sticky left-0 z-20 bg-slate-50 border-r border-slate-200">Serviço / Etapa</th>
              <th className="p-3.5 text-right">Valor</th>
              {months.map((m) => (
                <th key={m} className="p-3.5 text-center whitespace-nowrap">{monthLabel(m)}</th>
              ))}
              <th className="p-3.5 text-center">Σ %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {etapas.map((e) => {
              const sum = rowTotal(e.id);
              const off = Math.abs(sum - 100) > 0.5;
              return (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 sticky left-0 z-20 bg-white border-r border-slate-100">
                    <span className="line-clamp-2 max-w-[140px] font-bold text-slate-800 leading-snug sm:max-w-[220px]">{e.nome}</span>
                  </td>
                  <td className="p-3.5 text-right font-semibold text-slate-800">{money(e.valor_total)}</td>
                  {months.map((m) => {
                    const pct = Number(grid[e.id]?.[m]) || 0;
                    const valor = (pct / 100) * (Number(e.valor_total) || 0);
                    return (
                      <td key={m} className="p-1.5 text-center align-top">
                        <div className="flex flex-col items-center gap-0.5">
                          {canEdit ? (
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={100}
                                value={pct}
                                onChange={(ev) => onCell(e.id, m, ev.target.value)}
                                className="h-7 w-14 px-1 text-center text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800"
                              />
                              <span className="text-[10px] font-bold text-slate-400">%</span>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-600">
                              {pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                          )}
                          {!ocultarFinanceiro && (
                            <span className="whitespace-nowrap font-mono text-[10px] text-blue-600/70">{brl(valor)}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`p-3.5 text-center font-black ${off ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {sum.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold">
              <td className="p-3.5 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 text-slate-800">
                Investimento mensal
              </td>
              <td className="p-3.5 text-right text-slate-900">{money(totalObra)}</td>
              {chartData.map((d) => (
                <td key={d.mesKey} className="p-2 text-center align-top">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="whitespace-nowrap font-mono text-[11px] text-slate-800">{money(d.valorMes)}</span>
                    <span className="whitespace-nowrap font-mono text-[10px] font-medium text-slate-500">
                      {d.Mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </span>
                  </div>
                </td>
              ))}
              <td className="p-3.5 text-center text-slate-900">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
