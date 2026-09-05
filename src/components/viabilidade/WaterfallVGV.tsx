import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { brlCents, brlShort } from '../../lib/viabilidade';

const SLATE = '#64748B';

export type WaterfallInput = {
  vgvReajustado: number;
  impostosComissoes: number;
  custoTerreno: number;
  custoObraIndiretos: number;
  lucro: number;
};

type Barra = { nome: string; base: number; valor: number; delta: number; cor: string };

function montar(i: WaterfallInput): Barra[] {
  const barras: Barra[] = [];
  let acc = 0;
  const push = (nome: string, delta: number, cor: string, total?: boolean) => {
    if (total) {
      barras.push({ nome, base: 0, valor: Math.abs(delta), delta, cor });
      acc = delta;
      return;
    }
    const inicio = acc;
    const fim = acc + delta;
    barras.push({
      nome,
      base: Math.min(inicio, fim),
      valor: Math.abs(delta),
      delta,
      cor,
    });
    acc = fim;
  };

  push('VGV reajustado', i.vgvReajustado, '#10B981', true);
  push('(−) Impostos e comissões', -i.impostosComissoes, '#F97316');
  push('(−) Terreno', -i.custoTerreno, SLATE);
  push('(−) Obra + indiretos', -i.custoObraIndiretos, '#1E3A8A');
  push('(=) Lucro líquido', i.lucro, i.lucro >= 0 ? '#047857' : '#EF4444', true);
  return barras;
}

function WaterfallTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Barra;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{d.nome}</p>
      <p className="text-sm font-black tabular-nums" style={{ color: d.cor }}>
        {d.delta < 0 ? '-' : ''}
        {brlCents(Math.abs(d.delta))}
      </p>
    </div>
  );
}

export function WaterfallVGV(props: WaterfallInput) {
  const dados = montar(props);
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <div className="h-72 min-w-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={SLATE} opacity={0.2} vertical={false} />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: SLATE }}
              tickLine={false}
              interval={0}
              axisLine={{ stroke: SLATE, opacity: 0.3 }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: SLATE }}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={(v: number) => brlShort(v)}
            />
            <Tooltip content={<WaterfallTooltip />} cursor={{ fill: SLATE, fillOpacity: 0.08 }} />
            <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="valor" stackId="w" radius={[8, 8, 0, 0]} isAnimationActive>
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
