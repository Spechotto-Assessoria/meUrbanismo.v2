import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { brl } from '../../formatadores';
import { PdfSectionTitle } from '../PdfLayout';
import { TabelaOrcamento } from '../TabelaOrcamento';
import { PizzaParticipacaoPdf } from '../charts/PizzaParticipacaoPdf';

const styles = StyleSheet.create({
  pageWrap: { paddingBottom: 10 },
  resumoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resumoCard: {
    width: '30%',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#0f172a'
  },
  resumoLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  resumoValor: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
  resumoSub: { fontSize: 6, color: '#94a3b8', marginTop: 3 },
  graficoWrap: { alignItems: 'center', marginVertical: 5 },
  graficoImg: { width: '100%', maxHeight: 160, objectFit: 'contain', marginVertical: 5 },
  subtitulo: { fontSize: 8, color: '#64748b', marginBottom: 8 }
});

type ResumoProps = {
  dados: DadosRelatorio;
  graficoOrcamentoDataUri?: string;
};

export function OrcamentoResumoSection({ dados, graficoOrcamentoDataUri }: ResumoProps) {
  const { totalOrcado, totalExecutado, incluiFinanceiro } = dados;
  const saldo = totalOrcado - totalExecutado;
  const pctRealizado = totalOrcado > 0 ? ((totalExecutado / totalOrcado) * 100).toFixed(1) : '0.0';
  const pctPendente = totalOrcado > 0 ? (100 - Number(pctRealizado)).toFixed(1) : '0.0';

  return (
    <View style={styles.pageWrap}>
      <PdfSectionTitle>Orçamento por Etapas</PdfSectionTitle>
      <View style={styles.resumoGrid}>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>ORÇAMENTO GLOBAL PREVISTO</Text>
          <Text style={styles.resumoValor}>{brl(totalOrcado, incluiFinanceiro)}</Text>
          <Text style={styles.resumoSub}>100% da planilha contratada</Text>
        </View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>TOTAL MEDIDO / EXECUTADO</Text>
          <Text style={styles.resumoValor}>{brl(totalExecutado, incluiFinanceiro)}</Text>
          <Text style={styles.resumoSub}>
            {incluiFinanceiro ? `${pctRealizado}% do custo total realizado` : '—'}
          </Text>
        </View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>SALDO A EXECUTAR</Text>
          <Text style={styles.resumoValor}>{brl(saldo, incluiFinanceiro)}</Text>
          <Text style={styles.resumoSub}>
            {incluiFinanceiro ? `${pctPendente}% pendente de medição` : '—'}
          </Text>
        </View>
      </View>
      <View style={styles.graficoWrap}>
        {graficoOrcamentoDataUri ? (
          <Image src={graficoOrcamentoDataUri} style={styles.graficoImg} />
        ) : (
          <PizzaParticipacaoPdf itens={dados.orcamentos} total={dados.totalOrcado} />
        )}
      </View>
    </View>
  );
}

export function OrcamentoTabelaSection({ dados }: { dados: DadosRelatorio }) {
  return (
    <View>
      <PdfSectionTitle>Orçamento por Etapas</PdfSectionTitle>
      <Text style={styles.subtitulo}>Detalhamento analítico por etapa</Text>
      <TabelaOrcamento
        itens={dados.orcamentos}
        incluiFinanceiro={dados.incluiFinanceiro}
        total={dados.totalOrcado}
      />
    </View>
  );
}
