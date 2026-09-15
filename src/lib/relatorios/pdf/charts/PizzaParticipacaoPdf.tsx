import React from 'react';
import { View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import type { OrcamentoItem } from '../../../../types';
import { corPorIndice, CORES_TEXTO } from '../pdfPaleta';
import { arcoDonut } from './chartUtils';

const SVG_SIZE = 200;
const CX = 100;
const CY = 100;
const R_OUTER = 88;
const R_INNER = 52;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 12 },
  titulo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: CORES_TEXTO.navy,
    marginBottom: 8,
    textAlign: 'center'
  },
  legendaWrap: { width: '100%', marginTop: 12 },
  legendaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4
  },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  codigo: { fontSize: 7, color: CORES_TEXTO.steel, width: 28 },
  nome: { fontSize: 7, color: CORES_TEXTO.steel, flex: 1 },
  pct: { fontSize: 7, fontWeight: 'bold', color: CORES_TEXTO.navy, textAlign: 'right', width: 32 },
  vazio: { fontSize: 8, color: CORES_TEXTO.slate, marginVertical: 6 }
});

type Props = { itens: OrcamentoItem[]; total: number };

export function PizzaParticipacaoPdf({ itens, total }: Props) {
  const etapas = itens
    .map((item, idx) => ({
      codigo: item.codigo_sinapi || String(idx + 1).padStart(2, '0'),
      nome: item.descricao,
      valor: Number(item.valor_total) || 0
    }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const somaItens = etapas.reduce((acc, i) => acc + i.valor, 0);
  const denominador = somaItens > 0 ? somaItens : total;

  if (etapas.length === 0 || denominador <= 0) {
    return <Text style={styles.vazio}>Sem dados para gráfico de participação.</Text>;
  }

  let ang = -Math.PI / 2;
  const legendaCompacta = etapas.length > 8;
  const maxNome = legendaCompacta ? 28 : 38;

  const paths = etapas.map((item, i) => {
    const frac = item.valor / denominador;
    const sweep = frac * Math.PI * 2;
    const d = arcoDonut(CX, CY, R_INNER, R_OUTER, ang, ang + sweep);
    ang += sweep;
    return {
      d,
      cor: corPorIndice(i),
      codigo: item.codigo,
      nome: item.nome.length > maxNome ? `${item.nome.slice(0, maxNome)}…` : item.nome,
      pct: (frac * 100).toFixed(1)
    };
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.titulo}>Participação por Etapa</Text>
      <Svg width={SVG_SIZE} height={SVG_SIZE}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.cor} />
        ))}
      </Svg>
      <View style={styles.legendaWrap}>
        <View style={styles.legendaGrid}>
          {paths.map((p, i) => (
            <View key={i} style={styles.legItem}>
              <View style={[styles.swatch, { backgroundColor: p.cor }]} />
              <Text style={styles.codigo}>{p.codigo}</Text>
              <Text style={styles.nome}>{p.nome}</Text>
              <Text style={styles.pct}>{p.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
