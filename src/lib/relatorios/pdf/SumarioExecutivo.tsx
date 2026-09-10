import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../tipos';
import { brl, pct, periodoLabel } from '../formatadores';

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  card: { width: '48%', padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  label: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  value: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  intro: { fontSize: 10, color: '#334155', marginBottom: 8 }
});

export function SumarioExecutivo({ dados }: { dados: DadosRelatorio }) {
  const { obra, incluiFinanceiro, geralPrevisto, geralRealizado, totalOrcado, totalExecutado } = dados;
  const desvio = geralRealizado - geralPrevisto;

  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{dados.titulo}</Text>
      <Text style={styles.intro}>
        Sumário executivo — {periodoLabel(dados.periodoInicio, dados.periodoFim)}. Status: {obra.status || 'Em andamento'}.
      </Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Progresso Geral</Text>
          <Text style={styles.value}>{pct(geralRealizado)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Previsto Global</Text>
          <Text style={styles.value}>{pct(geralPrevisto)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Desvio Físico</Text>
          <Text style={styles.value}>{pct(desvio)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Orçamento Aprovado</Text>
          <Text style={styles.value}>{brl(totalOrcado, incluiFinanceiro)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Executado</Text>
          <Text style={styles.value}>{brl(totalExecutado, incluiFinanceiro)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Lotes Vendidos</Text>
          <Text style={styles.value}>
            {obra.lotes_vendidos ?? 0} / {obra.total_lotes ?? obra.qtdLotes ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
