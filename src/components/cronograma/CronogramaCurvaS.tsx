import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { PontoCurvaS } from '../../lib/cronograma';

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

type Props = {
  data: PontoCurvaS[];
  canViewFinancials: boolean;
};

export const CronogramaCurvaS: React.FC<Props> = ({ data, canViewFinancials }) => {
  const chartData = data.map((d) => {
    const base: Record<string, unknown> = {
      name: d.month,
      'Previsto Acumulado (%)': d.Acumulado,
      'Previsto Mensal (%)': d.Mensal
    };
    if (canViewFinancials) {
      base['Previsto Mensal (R$ mil)'] = Math.round((d.valorMes || 0) / 1000);
    }
    return base;
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Curva S de Evolução
          </h3>
          <p className="text-xs text-slate-500">
            {canViewFinancials
              ? 'Acompanhamento das linhas acumuladas de avanço e barras de desembolso mensal'
              : 'Acompanhamento do percentual de avanço físico planejado vs realizado'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1 text-blue-600">● Previsto Acumulado (%)</span>
          <span className="flex items-center gap-1 text-slate-500">● Mensal (%)</span>
          {canViewFinancials && (
            <span className="flex items-center gap-1 text-slate-400">■ Desembolso (R$ mil)</span>
          )}
        </div>
      </div>

      <div className="w-full h-80 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {canViewFinancials ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} unit="%" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} unit="k" />
              <Tooltip
                formatter={(val: number, name: string, item: { payload?: PontoCurvaS & { name?: string } }) => {
                  if (name.includes('R$')) return [val, name];
                  const ponto = data.find((d) => d.month === item?.payload?.name);
                  const valor = name.includes('Acumulado') ? ponto?.valorAcum : ponto?.valorMes;
                  return [`${val}% • ${brl(Number(valor ?? 0))}`, name];
                }}
              />
              <Bar yAxisId="right" dataKey="Previsto Mensal (R$ mil)" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Desembolso Mensal (R$ mil)" />
              <Line yAxisId="left" type="monotone" dataKey="Previsto Acumulado (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} />
              <Line yAxisId="left" type="monotone" dataKey="Previsto Mensal (%)" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </ComposedChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(val: number) => [`${val}%`, '']} />
              <Line type="monotone" dataKey="Previsto Acumulado (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Previsto Mensal (%)" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
