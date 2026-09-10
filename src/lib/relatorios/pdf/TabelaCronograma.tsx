import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { CronogramaItem, CronogramaMes, Obra, OrcamentoItem } from '../../../types';
import { brl, dataPt, pct } from '../formatadores';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 },
  head: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  cell: { width: '16%', fontSize: 8, textAlign: 'right' },
  cellMes: { width: '20%', fontSize: 8 }
});

type Props = {
  cronograma: CronogramaItem[];
  meses: CronogramaMes[];
  incluiFinanceiro: boolean;
  obra: Obra;
  orcamentos: OrcamentoItem[];
};

export function TabelaCronograma({ cronograma, meses, incluiFinanceiro, obra, orcamentos }: Props) {
  const ultimo = cronograma[cronograma.length - 1];
  const etapasMapeadas = orcamentos.length;

  return (
    <View>
      <Text style={{ fontSize: 9, marginBottom: 8, color: '#475569' }}>
        Início previsto: {dataPt(obra.data_inicio || obra.dataInicio)} • Entrega:{' '}
        {dataPt(obra.data_previsao || obra.dataEntrega)}
      </Text>

      <View style={[styles.row, styles.head]}>
        <Text style={styles.cellMes}>Mês</Text>
        <Text style={styles.cell}>Prev. Mês</Text>
        <Text style={styles.cell}>Real. Mês</Text>
        <Text style={styles.cell}>Prev. Acum.</Text>
        <Text style={styles.cell}>Real. Acum.</Text>
        <Text style={styles.cell}>Valor Prev.</Text>
      </View>

      {cronograma.slice(0, 24).map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.cellMes}>{item.mes_label || item.mes_ano || item.mes}</Text>
          <Text style={styles.cell}>{pct(item.percentual_previsto_mes)}</Text>
          <Text style={styles.cell}>{pct(item.percentual_realizado_mes)}</Text>
          <Text style={styles.cell}>{pct(item.percentual_previsto_acumulado)}</Text>
          <Text style={styles.cell}>{pct(item.percentual_realizado_acumulado)}</Text>
          <Text style={styles.cell}>{brl(item.valor_previsto_mes, incluiFinanceiro)}</Text>
        </View>
      ))}

      {cronograma.length === 0 && <Text style={{ marginTop: 8 }}>Sem dados de cronograma no período.</Text>}

      <Text style={{ marginTop: 10, fontSize: 9 }}>
        Curva S — acumulado realizado: {pct(ultimo?.percentual_realizado_acumulado)} • {etapasMapeadas}{' '}
        etapas • {meses.length} células na matriz físico-financeira
      </Text>
    </View>
  );
}
