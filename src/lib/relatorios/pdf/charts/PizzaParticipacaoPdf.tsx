import React from 'react';
import { View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import type { OrcamentoItem } from '../../../../types';

const CORES = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#64748b', '#475569'];

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 12, marginVertical: 8, alignItems: 'center' },
  label: { fontSize: 8, color: '#64748b' },
  legenda: { flex: 1, gap: 3 },
  legItem: { fontSize: 7, color: '#475569' }
});

function arco(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

type Props = { itens: OrcamentoItem[]; total: number };

export function PizzaParticipacaoPdf({ itens, total }: Props) {
  const top = itens
    .map((item) => ({ nome: item.descricao, valor: Number(item.valor_total) || 0 }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 7);

  if (top.length === 0 || total <= 0) {
    return <Text style={styles.label}>Sem dados para gráfico de participação.</Text>;
  }

  const cx = 55;
  const cy = 55;
  const r = 48;
  let ang = -Math.PI / 2;
  const paths = top.map((item, i) => {
    const frac = item.valor / total;
    const sweep = frac * Math.PI * 2;
    const d = arco(cx, cy, r, ang, ang + sweep);
    ang += sweep;
    return { d, cor: CORES[i % CORES.length], nome: item.nome, pct: (frac * 100).toFixed(1) };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={110} height={110}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.cor} />
        ))}
      </Svg>
      <View style={styles.legenda}>
        <Text style={styles.label}>Participação por etapa</Text>
        {paths.map((p, i) => (
          <Text key={i} style={styles.legItem}>
            {p.pct}% — {p.nome.slice(0, 40)}
          </Text>
        ))}
      </View>
    </View>
  );
}
