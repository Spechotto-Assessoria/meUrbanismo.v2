import React from 'react';
import { View, Text, Svg, Rect, StyleSheet } from '@react-pdf/renderer';
import type { CronogramaItem } from '../../../../types';
import { maxValor } from './chartUtils';

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 4 },
  legText: { fontSize: 7, color: '#475569' }
});

type Props = { cronograma: CronogramaItem[] };

export function BarCompareChartPdf({ cronograma }: Props) {
  const w = 480;
  const h = 110;
  const pad = 20;
  const barW = Math.max(4, (w - pad * 2) / Math.max(cronograma.length * 2.5, 1));
  const previsto = cronograma.map((c) => Number(c.percentual_previsto_mes) || 0);
  const realizado = cronograma.map((c) => Number(c.percentual_realizado_mes) || 0);
  const max = maxValor([...previsto, ...realizado]);

  if (cronograma.length === 0) {
    return <Text style={styles.label}>Sem dados mensais no período.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Andamento Mensal — Previsto x Realizado (%)</Text>
      <Svg width={w} height={h}>
        {cronograma.map((c, i) => {
          const xBase = pad + i * (barW * 2.5);
          const pv = previsto[i];
          const rv = realizado[i];
          const hPv = ((h - pad * 2) * pv) / max;
          const hRv = ((h - pad * 2) * rv) / max;
          return (
            <React.Fragment key={c.id || i}>
              <Rect x={xBase} y={h - pad - hPv} width={barW} height={hPv} fill="#94a3b8" />
              <Rect x={xBase + barW + 2} y={h - pad - hRv} width={barW} height={hRv} fill="#1e3a8a" />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legText}>■ Previsto mensal</Text>
        <Text style={styles.legText}>■ Realizado mensal</Text>
      </View>
    </View>
  );
}
