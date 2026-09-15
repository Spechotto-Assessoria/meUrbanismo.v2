import React from 'react';
import { View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import type { ContagemLotes } from '../../tipos';
import { CORES_LOTES_STATUS, CORES_TEXTO } from '../pdfPaleta';
import { arcoDonut } from './chartUtils';

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  titulo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: CORES_TEXTO.navy,
    marginBottom: 4,
    marginTop: 40,
    textAlign: 'center'
  },
  legenda: { gap: 5, marginLeft: 30 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  legText: { fontSize: 8, color: CORES_TEXTO.steel },
  vazio: { fontSize: 8, color: CORES_TEXTO.slate, marginVertical: 6 }
});

type Props = { contagem: ContagemLotes };

export function PizzaLotesStatusPdf({ contagem }: Props) {
  const fatias = [
    { key: 'disponivel', label: 'Disponível', valor: contagem.disponivel, cor: CORES_LOTES_STATUS.disponivel },
    { key: 'reservado', label: 'Reservado', valor: contagem.reservado, cor: CORES_LOTES_STATUS.reservado },
    { key: 'vendido', label: 'Vendido', valor: contagem.vendido, cor: CORES_LOTES_STATUS.vendido }
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
            <View key={i} style={styles.legItem}>
              <View style={[styles.swatch, { backgroundColor: p.cor }]} />
              <Text style={styles.legText}>
                {p.label} ({p.valor})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
