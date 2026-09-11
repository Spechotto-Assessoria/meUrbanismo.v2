import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { brl, pct, dataPt, periodoLabel } from '../../formatadores';
import { PdfSectionTitle } from '../PdfLayout';

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  card: { width: '31%', padding: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, backgroundColor: '#f8fafc' },
  label: { fontSize: 7, color: '#64748b', marginBottom: 3, textTransform: 'uppercase' },
  value: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  intro: { fontSize: 9, color: '#334155', marginBottom: 6, lineHeight: 1.4 },
  marcos: { marginTop: 10, fontSize: 8, color: '#475569' }
});

export function ResumoObraSection({ dados }: { dados: DadosRelatorio }) {
  const { obra, incluiFinanceiro, geralRealizado, totalOrcadoResumo } = dados;
  const areaTotal = obra.area_total_m2 || obra.areaM2 || 0;
  const areaVendavel = Number(obra.area_vendavel_m2) || (areaTotal > 0 ? areaTotal * 0.55 : 0);
  const qtdLotes = obra.total_lotes || obra.qtdLotes || 0;
  const lotesVendidos = obra.lotes_vendidos || dados.contagemLotes.vendido || 0;
  const lotesDisponiveis = obra.lotes_disponiveis ?? dados.contagemLotes.disponivel;
  const vgv = obra.valor_vgv || dados.viabilidade?.vgvReajustado || 0;

  return (
    <View>
      <PdfSectionTitle>Resumo do Empreendimento</PdfSectionTitle>
      <Text style={styles.intro}>
        {obra.nome} — {obra.cidade}/{obra.uf}. Status: {obra.status || 'Em andamento'}.
        {dados.tipo === 'global' ? ` Período de referência: ${periodoLabel(dados.periodoInicio, dados.periodoFim)}.` : ''}
      </Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Área Total</Text>
          <Text style={styles.value}>{areaTotal.toLocaleString('pt-BR')} m²</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Área Vendável</Text>
          <Text style={styles.value}>{areaVendavel.toLocaleString('pt-BR')} m²</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Total de Lotes</Text>
          <Text style={styles.value}>{qtdLotes || dados.contagemLotes.total}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Lotes Vendidos</Text>
          <Text style={styles.value}>{lotesVendidos}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Lotes Disponíveis</Text>
          <Text style={styles.value}>{lotesDisponiveis}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Andamento Geral</Text>
          <Text style={styles.value}>{pct(obra.percentual_concluido || geralRealizado)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Custo Global</Text>
          <Text style={styles.value}>{brl(totalOrcadoResumo, incluiFinanceiro)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>VGV Estimado</Text>
          <Text style={styles.value}>{brl(vgv, incluiFinanceiro)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Progresso Físico</Text>
          <Text style={styles.value}>{pct(geralRealizado)}</Text>
        </View>
      </View>
      <Text style={styles.marcos}>
        Início previsto: {dataPt(obra.data_inicio || obra.dataInicio)} • Entrega:{' '}
        {dataPt(obra.data_previsao || obra.dataEntrega)}
      </Text>
      <Text style={[styles.marcos, { marginTop: 4 }]}>
        Engenheiro: {obra.engenheiro_responsavel || '—'} {obra.crea_responsavel ? `(${obra.crea_responsavel})` : ''}
      </Text>
      <Text style={styles.marcos}>Supervisão: {obra.supervisao_tecnica || '—'}</Text>
    </View>
  );
}
