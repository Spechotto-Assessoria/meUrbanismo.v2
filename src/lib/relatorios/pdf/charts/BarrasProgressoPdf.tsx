import React from 'react';
import { View, Text, Svg, Rect, StyleSheet } from '@react-pdf/renderer';
import type { AndamentoEtapa } from '../../../../types';

const styles = StyleSheet.create({
  wrap: { marginVertical: 6, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nome: { width: '35%', fontSize: 7, color: '#334155' },
  barArea: { width: '65%' },
  pct: { fontSize: 6, color: '#64748b', marginTop: 1 }
});

type Props = { etapas: AndamentoEtapa[] };

export function BarrasProgressoPdf({ etapas }: Props) {
  const lista = etapas.slice(0, 12);
  const barW = 280;
  const barH = 8;

  if (lista.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={{ fontSize: 8, color: '#64748b', marginBottom: 4 }}>Progresso por etapa</Text>
      {lista.map((e) => {
        const prev = Math.min(100, Number(e.previsto) || 0);
        const real = Math.min(100, Number(e.realizado) || 0);
        return (
          <View key={e.id} style={styles.row}>
            <Text style={styles.nome}>{e.nome?.slice(0, 28)}</Text>
            <View style={styles.barArea}>
              <Svg width={barW} height={barH * 2 + 4}>
                <Rect x={0} y={0} width={barW} height={barH} fill="#f1f5f9" rx={2} />
                <Rect x={0} y={0} width={(barW * prev) / 100} height={barH} fill="#94a3b8" rx={2} />
                <Rect x={0} y={barH + 2} width={barW} height={barH} fill="#f1f5f9" rx={2} />
                <Rect x={0} y={barH + 2} width={(barW * real) / 100} height={barH} fill="#1e3a8a" rx={2} />
              </Svg>
              <Text style={styles.pct}>Prev. {prev.toFixed(0)}% · Real. {real.toFixed(0)}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
