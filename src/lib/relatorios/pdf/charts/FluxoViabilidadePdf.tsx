import React from 'react';
import { View, Text, Svg, Path, Line, StyleSheet } from '@react-pdf/renderer';
import type { FluxoMes } from '../../../viabilidade';
import { escalaLinear, maxValor } from './chartUtils';

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: { fontSize: 8, color: '#64748b', marginBottom: 4 }
});

type Props = { fluxo: FluxoMes[]; incluiFinanceiro: boolean };

function buildPath(valores: number[], w: number, h: number, pad: number, min: number, max: number): string {
  if (valores.length === 0) return '';
  const pts = valores.map((v, i) => {
    const x = pad + (i / Math.max(valores.length - 1, 1)) * (w - pad * 2);
    const y = escalaLinear(v, min, max, h - pad, pad);
    return `${x},${y}`;
  });
  return `M ${pts.join(' L ')}`;
}

export function FluxoViabilidadePdf({ fluxo, incluiFinanceiro }: Props) {
  if (!incluiFinanceiro) {
    return <Text style={styles.label}>Fluxo de caixa disponível apenas com permissão financeira.</Text>;
  }

  const w = 480;
  const h = 100;
  const pad = 12;
  const acum = fluxo.map((f) => f.acumulado);
  const min = Math.min(...acum, 0);
  const max = maxValor(acum);

  if (fluxo.length === 0) {
    return <Text style={styles.label}>Sem fluxo de caixa calculado.</Text>;
  }

  const zeroY = escalaLinear(0, min, max, h - pad, pad);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Curva J — Saldo acumulado do fluxo de caixa</Text>
      <Svg width={w} height={h}>
        <Line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="#e2e8f0" strokeWidth={1} />
        <Path d={buildPath(acum, w, h, pad, min, max)} stroke="#2563eb" strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}
