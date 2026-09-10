import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { AndamentoEtapa } from '../../../types';
import { pct } from '../formatadores';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 },
  head: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  cell: { width: '25%', fontSize: 8 },
  cellNome: { width: '40%', fontSize: 8 }
});

export function TabelaAndamento({ etapas }: { etapas: AndamentoEtapa[] }) {
  return (
    <View>
      <View style={[styles.row, styles.head]}>
        <Text style={styles.cellNome}>Etapa</Text>
        <Text style={styles.cell}>Previsto</Text>
        <Text style={styles.cell}>Realizado</Text>
        <Text style={styles.cell}>Desvio</Text>
      </View>
      {etapas.map((e) => (
        <View key={e.id} style={styles.row}>
          <Text style={styles.cellNome}>{e.nome}</Text>
          <Text style={styles.cell}>{pct(e.previsto)}</Text>
          <Text style={styles.cell}>{pct(e.realizado)}</Text>
          <Text style={styles.cell}>{pct(e.realizado - e.previsto)}</Text>
        </View>
      ))}
      {etapas.length === 0 && <Text style={{ marginTop: 8 }}>Sem etapas de andamento cadastradas.</Text>}
    </View>
  );
}
