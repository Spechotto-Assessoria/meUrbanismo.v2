import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { brlCents, brlShort, paybackBR, pctBR, type ViabilidadeResult } from '../../lib/viabilidade';

const NAVY = '#1E3A8A';
const COBALT = '#2563EB';
const SLATE = '#64748B';
const CORAL = '#EF4444';
const EMERALD = '#10B981';

type Props = { resultado: ViabilidadeResult; custoTerreno: number };

function FluxoTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Mês {String(label).replace('M', '')}
      </p>
      <p className="text-sm font-black tabular-nums" style={{ color: NAVY }}>
        {brlCents(Number(payload[0].value))}
      </p>
      <p className="text-[10px] text-slate-500">Caixa acumulado</p>
    </div>
  );
}

function ReceitaDespesaTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const receita = Number(payload.find((p) => p.dataKey === 'receita')?.value ?? 0);
  const despesa = Math.abs(Number(payload.find((p) => p.dataKey === 'despesa')?.value ?? 0));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Mês {String(label).replace('M', '')}
      </p>
      <p className="font-mono text-sm tabular-nums" style={{ color: EMERALD }}>{brlCents(receita)}</p>
      <p className="font-mono text-sm tabular-nums" style={{ color: CORAL }}>-{brlCents(despesa)}</p>
      <p className="mt-1 text-sm font-black tabular-nums" style={{ color: NAVY }}>
        {brlCents(receita - despesa)}
      </p>
    </div>
  );
}

function DonutTooltip({ active, payload, total }: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{payload[0].name}</p>
      <p className="text-sm font-black tabular-nums" style={{ color: NAVY }}>{brlCents(v)}</p>
      <p className="text-[10px] text-slate-500">{pctBR(total > 0 ? (v / total) * 100 : 0)} do custo total</p>
    </div>
  );
}

export function ViabilidadeObraCharts({ resultado: r, custoTerreno }: Props) {
  const chart = r.fluxo.map((f) => ({
    mes: f.mes,
    label: `M${f.mes}`,
    acumulado: Math.round(f.acumulado),
    receita: Math.round(f.receita),
    despesa: -Math.round(f.despesa),
  }));
  const passo = Math.max(1, Math.ceil(chart.length / 6));
  const ticks = chart.filter((_, i) => i % passo === 0).map((d) => d.label);
  const expoPonto = chart.find((d) => d.mes === r.exposicaoMes) ?? null;
  const paybackMes = r.paybackDescontadoMeses != null ? Math.ceil(r.paybackDescontadoMeses) : null;
  const paybackPonto = paybackMes != null ? (chart.find((d) => d.mes === paybackMes) ?? null) : null;

  const composicao = [
    { nome: 'Terreno', valor: custoTerreno, cor: NAVY },
    { nome: 'Obra', valor: r.custoObraReajustado, cor: COBALT },
    { nome: 'Indiretos', valor: r.custosIndiretos, cor: '#5B7FA6' },
    { nome: 'Comissão', valor: r.comissao, cor: SLATE },
    { nome: 'Impostos', valor: r.impostos, cor: '#94A3B8' },
  ];
  const pizza = composicao.filter((c) => c.valor > 0);

  return (
    <div className="space-y-4 min-w-0">
      <div className="grid gap-4 lg:grid-cols-2 min-w-0">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
            Fluxo de caixa acumulado (curva J)
          </h3>
          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-acum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE} opacity={0.2} vertical={false} />
                <XAxis dataKey="label" ticks={ticks} tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={{ stroke: SLATE, opacity: 0.3 }} />
                <YAxis tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => brlShort(v)} />
                <Tooltip content={<FluxoTooltip />} cursor={{ stroke: SLATE, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="acumulado" stroke={NAVY} strokeWidth={3} fill="url(#grad-acum)" fillOpacity={0.2} />
                {expoPonto && (
                  <ReferenceDot x={expoPonto.label} y={expoPonto.acumulado} r={6} fill={CORAL} stroke="#fff" strokeWidth={2} isFront />
                )}
                {paybackPonto && (
                  <ReferenceDot x={paybackPonto.label} y={paybackPonto.acumulado} r={6} fill={EMERALD} stroke="#fff" strokeWidth={2} isFront />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle bg-rose-500" />
            Exposição máxima: <strong>{brlCents(Math.abs(r.exposicaoMaxima))}</strong> no mês {r.exposicaoMes}
            {' • '}
            <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle bg-emerald-500" />
            Payback: <strong>{paybackBR(r.paybackDescontadoMeses)}</strong>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
            Receitas x Despesas por mês
          </h3>
          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} stackOffset="sign" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE} opacity={0.2} vertical={false} />
                <XAxis dataKey="label" ticks={ticks} tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={{ stroke: SLATE, opacity: 0.3 }} />
                <YAxis tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => brlShort(v)} />
                <Tooltip content={<ReceitaDespesaTooltip />} cursor={{ fill: SLATE, fillOpacity: 0.08 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="receita" name="Receitas" stackId="rd" fill={EMERALD} radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesa" name="Despesas" stackId="rd" fill={CORAL} radius={[0, 0, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Composição de custos</h3>
          <p className="text-xs text-slate-500">
            Custo total <strong className="text-slate-800 tabular-nums">{brlCents(r.custoTotal)}</strong>
          </p>
        </div>
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] min-w-0">
          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pizza} dataKey="valor" nameKey="nome" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {pizza.map((c) => (
                    <Cell key={c.nome} fill={c.cor} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={r.custoTotal} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {composicao.map((c) => {
              const p = r.custoTotal > 0 ? (c.valor / r.custoTotal) * 100 : 0;
              return (
                <div key={c.nome} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{c.nome}</span>
                    <span className="font-mono text-xs tabular-nums" style={{ color: c.cor }}>{pctBR(p)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, p)}%`, background: c.cor }} />
                  </div>
                  <p className="mt-1.5 font-mono text-sm tabular-nums text-slate-500">{brlCents(c.valor)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
