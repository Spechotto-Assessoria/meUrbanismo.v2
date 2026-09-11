import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { periodoLabel } from '../../formatadores';
import { PdfSectionTitle } from '../PdfLayout';
import { TabelaAndamento } from '../TabelaAndamento';
import { BarCompareChartPdf } from '../charts/BarCompareChartPdf';
import { BarrasProgressoPdf } from '../charts/BarrasProgressoPdf';

const styles = StyleSheet.create({
  periodo: { fontSize: 8, color: '#64748b', marginBottom: 8 }
});

export function AndamentoSection({ dados }: { dados: DadosRelatorio }) {
  return (
    <View>
      <PdfSectionTitle>Andamento da Obra — Previsto x Realizado</PdfSectionTitle>
      <Text style={styles.periodo}>Período analisado: {periodoLabel(dados.periodoInicio, dados.periodoFim)}</Text>
      <BarCompareChartPdf cronograma={dados.cronogramaPeriodo} />
      <BarrasProgressoPdf etapas={dados.andamento} />
      <TabelaAndamento etapas={dados.andamento} />
    </View>
  );
}
