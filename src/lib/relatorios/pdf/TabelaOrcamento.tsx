import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { OrcamentoItem } from '../../../types';
import { brl } from '../formatadores';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 },
  head: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  cellCod: { width: '12%', fontSize: 8 },
  cellNome: { width: '44%', fontSize: 8 },
  cellValor: { width: '22%', fontSize: 8, textAlign: 'right' },
  cellPct: { width: '22%', fontSize: 8, textAlign: 'right' }
});

type Props = { itens: OrcamentoItem[]; incluiFinanceiro: boolean; total: number };

export function TabelaOrcamento({ itens, incluiFinanceiro, total }: Props) {
  const linhas = itens.slice(0, 25);

  return (
    <View>
      <View style={[styles.row, styles.head]}>
        <Text style={styles.cellCod}>Cód</Text>
        <Text style={styles.cellNome}>Serviço / Etapa</Text>
        <Text style={styles.cellValor}>Valor</Text>
        <Text style={styles.cellPct}>% do Total</Text>
      </View>
      {linhas.map((item, idx) => {
        const valor = Number(item.valor_total) || 0;
        const pctTotal = total > 0 ? (valor / total) * 100 : 0;
        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.cellCod}>{item.codigo_sinapi || String(idx + 1).padStart(2, '0')}</Text>
            <Text style={styles.cellNome}>{item.descricao}</Text>
            <Text style={styles.cellValor}>{brl(valor, incluiFinanceiro)}</Text>
            <Text style={styles.cellPct}>{incluiFinanceiro ? `${pctTotal.toFixed(1)}%` : '—'}</Text>
          </View>
        );
      })}
      {linhas.length === 0 && <Text style={{ marginTop: 8 }}>Sem itens de orçamento.</Text>}
    </View>
  );
}
