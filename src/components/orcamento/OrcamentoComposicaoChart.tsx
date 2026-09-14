import React, { forwardRef, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { OrcamentoItem } from '../../types';
import { corEtapaOrcamento } from '../../lib/orcamento/orcamentoPaleta';

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

type EtapaGrafico = { nome: string; valor: number; cor: string; pct: number };

function ComposicaoTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as EtapaGrafico;
  return (
    <div className="rounded-xl border border-slate-700 bg-navy-900 px-3 py-2 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {item.nome}
      </p>
      <p className="text-sm font-black text-white tabular-nums">{brl(item.valor)}</p>
      <p className="text-[10px] text-brand-300 font-semibold">{item.pct.toFixed(1)}% do total</p>
    </div>
  );
}

type Props = { itens: OrcamentoItem[] };

export const OrcamentoComposicaoChart = forwardRef<HTMLDivElement, Props>(
  function OrcamentoComposicaoChart({ itens }, ref) {
    const { etapas, total } = useMemo(() => {
      const filtradas = itens
        .map((item) => ({
          nome: item.descricao,
          valor: Number(item.valor_total) || 0,
        }))
        .filter((i) => i.valor > 0)
        .sort((a, b) => b.valor - a.valor);

      const soma = filtradas.reduce((acc, i) => acc + i.valor, 0);
      const etapasComCor: EtapaGrafico[] = filtradas.map((item, i) => ({
        ...item,
        cor: corEtapaOrcamento(i),
        pct: soma > 0 ? (item.valor / soma) * 100 : 0,
      }));

      return { etapas: etapasComCor, total: soma };
    }, [itens]);

    if (etapas.length === 0) return null;

    const legendaCompacta = etapas.length > 8;

    return (
      <div
        ref={ref}
        className="rounded-2xl border border-slate-800 bg-navy-950 p-4 sm:p-5 shadow-sm"
      >
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Composição do Orçamento
        </h3>

        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
          <div className="w-full lg:w-1/2 h-56 sm:h-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={etapas}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  animationDuration={600}
                >
                  {etapas.map((e, i) => (
                    <Cell key={i} fill={e.cor} stroke="#020617" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<ComposicaoTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/2 space-y-1.5 max-h-64 overflow-y-auto">
            {etapas.map((e) => (
              <div
                key={e.nome}
                className={`flex items-center gap-2 ${legendaCompacta ? 'text-[10px]' : 'text-xs'}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: e.cor }}
                />
                <span className="text-slate-300 font-semibold tabular-nums shrink-0">
                  {e.pct.toFixed(1)}%
                </span>
                <span className="text-slate-400 truncate">{e.nome}</span>
                <span className="text-slate-500 tabular-nums ml-auto shrink-0 hidden sm:inline">
                  {brl(e.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-3 text-right">
          Total: {brl(total)}
        </p>
      </div>
    );
  }
);
