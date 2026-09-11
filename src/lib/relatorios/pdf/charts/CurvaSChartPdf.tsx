import React from 'react';
import { View, Text, Svg, Path, Line, StyleSheet } from '@react-pdf/renderer';
import type { CronogramaItem } from '../../../../types';
import { escalaLinear, maxValor } from './chartUtils';

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 4 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 3 },
  legText: { fontSize: 7, color: '#475569' }
});

type Props = { cronograma: CronogramaItem[] };

function buildPath(
  valores: number[],
  w: number,
  h: number,
  pad: number,
  max: number
): string {
  if (valores.length === 0) return '';
  const pts = valores.map((v, i) => {
    const x = pad + (i / Math.max(valores.length - 1, 1)) * (w - pad * 2);
    const y = pad + (h - pad * 2) * (1 - v / max);
    return `${x},${y}`;
  });
  return `M ${pts.join(' L ')}`;
}

export function CurvaSChartPdf({ cronograma }: Props) {
  const w = 480;
  const h = 120;
  const pad = 12;
  const previsto = cronograma.map((c) => Number(c.percentual_previsto_acumulado) || 0);
  const realizado = cronograma.map((c) => Number(c.percentual_realizado_acumulado) || 0);
  const max = maxValor([...previsto, ...realizado, 100]);

  if (cronograma.length === 0) {
    return <Text style={styles.label}>Sem dados para Curva S.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Curva S — Acumulado Previsto x Realizado (%)</Text>
      <Svg width={w} height={h}>
        <Line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" strokeWidth={1} />
        <Line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" strokeWidth={1} />
        <Path d={buildPath(previsto, w, h, pad, max)} stroke="#94a3b8" strokeWidth={2} fill="none" />
        <Path d={buildPath(realizado, w, h, pad, max)} stroke="#1e3a8a" strokeWidth={2} fill="none" />
        {[25, 50, 75, 100].map((pct) => {
          const y = escalaLinear(pct, 0, max, h - pad, pad);
          return <Line key={pct} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#f1f5f9" strokeWidth={0.5} />;
        })}
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legItem}>
          <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
          <Text style={styles.legText}>Previsto acumulado</Text>
        </View>
        <View style={styles.legItem}>
          <View style={[styles.dot, { backgroundColor: '#1e3a8a' }]} />
          <Text style={styles.legText}>Realizado acumulado</Text>
        </View>
      </View>
    </View>
  );
}
