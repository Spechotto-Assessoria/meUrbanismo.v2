import React from 'react';
import { View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import type { OrcamentoItem } from '../../../../types';

const PALETA_BASE = [
  '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#0f766e', '#059669', '#10b981', '#34d399',
  '#b45309', '#d97706', '#f59e0b',
  '#64748b', '#475569', '#334155', '#1e293b'
];

function corPorIndice(i: number): string {
  return PALETA_BASE[i % PALETA_BASE.length];
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 12, marginVertical: 8, alignItems: 'flex-start' },
  label: { fontSize: 8, color: '#64748b' },
  legenda: { flex: 1, gap: 3 },
  legItem: { fontSize: 7, color: '#475569' },
  legItemCompacto: { fontSize: 6, color: '#475569' }
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
  const etapas = itens
    .map((item) => ({ nome: item.descricao, valor: Number(item.valor_total) || 0 }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const somaItens = etapas.reduce((acc, i) => acc + i.valor, 0);
  const denominador = somaItens > 0 ? somaItens : total;

  if (etapas.length === 0 || denominador <= 0) {
    return <Text style={styles.label}>Sem dados para gráfico de participação.</Text>;
  }

  const cx = 55;
  const cy = 55;
  const r = 48;
  let ang = -Math.PI / 2;

  const paths = etapas.map((item, i) => {
    const frac = item.valor / denominador;
    const sweep = frac * Math.PI * 2;
    const d = arco(cx, cy, r, ang, ang + sweep);
    ang += sweep;
    return {
      d,
      cor: corPorIndice(i),
      nome: item.nome,
      pct: (frac * 100).toFixed(1)
    };
  });

  const legendaCompacta = etapas.length > 8;

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
          <Text key={i} style={legendaCompacta ? styles.legItemCompacto : styles.legItem}>
            {p.pct}% — {p.nome.slice(0, 35)}
          </Text>
        ))}
      </View>
    </View>
  );
}
