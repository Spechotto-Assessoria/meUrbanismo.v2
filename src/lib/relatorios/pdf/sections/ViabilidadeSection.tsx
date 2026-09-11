import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { brl, pct } from '../../formatadores';
import { PdfSectionTitle } from '../PdfLayout';
import { FluxoViabilidadePdf } from '../charts/FluxoViabilidadePdf';
import { WaterfallVgvPdf } from '../charts/WaterfallVgvPdf';

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  card: { width: '23%', padding: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  label: { fontSize: 7, color: '#64748b' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  vazio: { fontSize: 9, color: '#64748b' }
});

function kpi(label: string, valor: string) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{valor}</Text>
    </View>
  );
}

export function ViabilidadeSection({ dados }: { dados: DadosRelatorio }) {
  const r = dados.viabilidade;
  const fin = dados.incluiFinanceiro;

  if (!r) {
    return (
      <View>
        <PdfSectionTitle>Viabilidade Econômico-Financeira</PdfSectionTitle>
        <Text style={styles.vazio}>Dados de viabilidade não disponíveis para esta obra.</Text>
      </View>
    );
  }

  const tir = r.tirAnual != null ? `${r.tirAnual.toFixed(2)}% a.a.` : '—';

  return (
    <View>
      <PdfSectionTitle>Viabilidade Econômico-Financeira</PdfSectionTitle>
      <View style={styles.grid}>
        {kpi('VGV Reajustado', brl(r.vgvReajustado, fin))}
        {kpi('Lucro', brl(r.lucro, fin))}
        {kpi('Margem', fin ? pct(r.margem) : '—')}
        {kpi('ROI', fin ? pct(r.roi) : '—')}
        {kpi('TIR', fin ? tir : '—')}
        {kpi('VPL', brl(r.vpl, fin))}
        {kpi('Payback', fin && r.paybackMeses != null ? `${r.paybackMeses} meses` : '—')}
        {kpi('Exposição Máx.', brl(r.exposicaoMaxima, fin))}
      </View>
      <WaterfallVgvPdf resultado={r} incluiFinanceiro={fin} />
      <FluxoViabilidadePdf fluxo={r.fluxo} incluiFinanceiro={fin} />
    </View>
  );
}
