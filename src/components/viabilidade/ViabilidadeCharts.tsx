import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { formatBRL } from './formatters';

const TICK = { fill: '#64748b', fontSize: 10 };
const GRID = '#f1f5f9';

type ChartOpts = { animar?: boolean };

export const DonutSVG = ({
  values,
  colors,
  animar = true
}: { values: number[]; colors: string[] } & ChartOpts) => {
  const labels = ['Vendável', 'Viário', 'Verde/Lazer', 'Institucional'];
  const data = values.map((value, i) => ({ name: labels[i] ?? `Faixa ${i + 1}`, value }));

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            isAnimationActive={animar}
            animationDuration={700}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip formatter={(val: number) => [`${Number(val).toFixed(1)}%`, '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BarSVG = ({
  c,
  v,
  m,
  animar = true
}: { c: number; v: number; m: number } & ChartOpts) => {
  const data = [
    { name: 'Custo', valor: c, fill: '#1e3a8a' },
    { name: 'VGV', valor: v, fill: '#2563eb' },
    { name: 'Margem', valor: m, fill: '#10b981' }
  ];

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="name" tick={TICK} />
          <YAxis tick={TICK} />
          <Tooltip formatter={(val: number) => [formatBRL(Number(val)), '']} />
          <Bar dataKey="valor" radius={[4, 4, 0, 0]} isAnimationActive={animar} animationDuration={700}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SCurveSVG = ({
  data,
  animar = true
}: { data: { mes: number; acumulado: number }[] } & ChartOpts) => {
  if (!data || data.length === 0) return null;
  const serie = data.map((d) => ({ mes: d.mes, acumulado: d.acumulado }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={serie} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="mes" tick={TICK} />
          <YAxis tick={TICK} />
          <Tooltip formatter={(val: number) => [formatBRL(Number(val)), 'Saldo acumulado']} />
          <Line
            type="monotone"
            dataKey="acumulado"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 2 }}
            name="Saldo acumulado"
            isAnimationActive={animar}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
