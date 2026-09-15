import React from 'react';
import { View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import type { ContagemLotes } from '../../tipos';

const CORES = {
  disponivel: '#10b981',
  reservado: '#f59e0b',
  vendido: '#dc2626'
} as const;

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  titulo: { fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4, marginTop: 40, textAlign: 'center' },
  legenda: { gap: 5, marginLeft: 30 },
  legItem: { fontSize: 8, color: '#475569' },
  vazio: { fontSize: 8, color: '#64748b', marginVertical: 6 }
});

function arcoDonut(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number
): string {
  const x1o = cx + rOuter * Math.cos(start);
  const y1o = cy + rOuter * Math.sin(start);
  const x2o = cx + rOuter * Math.cos(end);
  const y2o = cy + rOuter * Math.sin(end);
  const x1i = cx + rInner * Math.cos(end);
  const y1i = cy + rInner * Math.sin(end);
  const x2i = cx + rInner * Math.cos(start);
  const y2i = cy + rInner * Math.sin(start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i} Z`;
}

type Props = { contagem: ContagemLotes };

export function PizzaLotesStatusPdf({ contagem }: Props) {
  const fatias = [
    { key: 'disponivel', label: 'Disponível', valor: contagem.disponivel, cor: CORES.disponivel },
    { key: 'reservado', label: 'Reservado', valor: contagem.reservado, cor: CORES.reservado },
    { key: 'vendido', label: 'Vendido', valor: contagem.vendido, cor: CORES.vendido }
  ].filter((f) => f.valor > 0);

  const total = contagem.total || contagem.disponivel + contagem.reservado + contagem.vendido;

  if (total === 0 || fatias.length === 0) {
    return <Text style={styles.vazio}>Sem lotes cadastrados.</Text>;
  }

  const cx = 65;
  const cy = 65;
  const rOuter = 56;
  const rInner = 32;
  let ang = -Math.PI / 2;

  const paths = fatias.map((f) => {
    const sweep = (f.valor / total) * Math.PI * 2;
    const d = arcoDonut(cx, cy, rInner, rOuter, ang, ang + sweep);
    ang += sweep;
    return { d, cor: f.cor, label: f.label, valor: f.valor };
  });

  return (
    <View>
      <Text style={styles.titulo}>Distribuição de Lotes</Text>
      <View style={styles.wrap}>
        <Svg width={130} height={130}>
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.cor} />
          ))}
        </Svg>
        <View style={styles.legenda}>
          {paths.map((p, i) => (
            <Text key={i} style={styles.legItem}>
              <Text style={{ color: p.cor }}>■</Text> {p.label} ({p.valor})
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
