import React from 'react';
import { View, Text, Svg, Rect, StyleSheet } from '@react-pdf/renderer';
import type { ViabilidadeResult } from '../../../viabilidade';
import { brl } from '../../formatadores';

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 4, marginTop: 4 },
  item: { fontSize: 7, color: '#475569', textAlign: 'center', width: 70 }
});

type Props = { resultado: ViabilidadeResult; incluiFinanceiro: boolean };

export function WaterfallVgvPdf({ resultado: r, incluiFinanceiro }: Props) {
  if (!incluiFinanceiro) {
    return <Text style={styles.label}>Composição do VGV restrita.</Text>;
  }

  const itens = [
    { nome: 'VGV', valor: r.vgvReajustado, cor: '#2563eb' },
    { nome: 'Obra', valor: -r.custoObraReajustado, cor: '#dc2626' },
    { nome: 'Indiretos', valor: -r.custosIndiretos, cor: '#f59e0b' },
    { nome: 'Comissão', valor: -r.comissao, cor: '#f97316' },
    { nome: 'Impostos', valor: -r.impostos, cor: '#eab308' },
    { nome: 'Lucro', valor: r.lucro, cor: '#059669' }
  ].filter((i) => Math.abs(i.valor) > 0);

  const max = Math.max(...itens.map((i) => Math.abs(i.valor)), 1);
  const w = 480;
  const h = 90;
  const barW = Math.min(60, (w - 40) / Math.max(itens.length, 1));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Composição econômica (VGV → Lucro)</Text>
      <Svg width={w} height={h}>
        {itens.map((item, i) => {
          const bh = (Math.abs(item.valor) / max) * (h - 30);
          const x = 20 + i * (barW + 8);
          const y = h - 20 - bh;
          return <Rect key={item.nome} x={x} y={y} width={barW} height={bh} fill={item.cor} rx={2} />;
        })}
      </Svg>
      <View style={styles.row}>
        {itens.map((item) => (
          <Text key={item.nome} style={styles.item}>
            {item.nome}
            {'\n'}
            {brl(item.valor, true)}
          </Text>
        ))}
      </View>
    </View>
  );
}
