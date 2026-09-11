import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { brl, dataPt, periodoLabel } from '../../formatadores';
import { PdfSectionTitle } from '../PdfLayout';

const styles = StyleSheet.create({
  periodo: { fontSize: 8, color: '#64748b', marginBottom: 8 },
  diario: { marginBottom: 8, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  titulo: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#1e293b' },
  texto: { fontSize: 8, color: '#475569', marginBottom: 3 },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  foto: { width: 115, height: 76, objectFit: 'cover', borderRadius: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 3 },
  head: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  cell: { width: '16%', fontSize: 7 },
  cellWide: { width: '28%', fontSize: 7 }
});

type Props = { dados: DadosRelatorio; fotosDataUri: string[] };

export function AcompanhamentoSection({ dados, fotosDataUri }: Props) {
  const { diarios, medicoes, incluiFinanceiro, todosPeriodos } = dados;
  const periodoTxt = todosPeriodos ? 'Todo o histórico' : periodoLabel(dados.periodoInicio, dados.periodoFim);

  return (
    <View>
      <PdfSectionTitle>Acompanhamento — Diário, Fotos e Medições</PdfSectionTitle>
      <Text style={styles.periodo}>Período: {periodoTxt}</Text>

      {diarios.slice(0, 6).map((d) => (
        <View key={d.id} style={styles.diario}>
          <Text style={styles.titulo}>Diário — {dataPt(d.data)}</Text>
          <Text style={styles.texto}>Atividades: {d.atividades_realizadas || '—'}</Text>
          <Text style={styles.texto}>Ocorrências: {d.ocorrencias || 'Nenhuma'}</Text>
          <Text style={styles.texto}>Responsável: {d.responsavel_nome || '—'}</Text>
        </View>
      ))}
      {diarios.length === 0 && <Text style={styles.texto}>Nenhum registro de diário no período.</Text>}

      {medicoes.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.titulo}>Medições</Text>
          <View style={[styles.row, styles.head]}>
            <Text style={styles.cell}>Nº</Text>
            <Text style={styles.cellWide}>Período</Text>
            <Text style={styles.cellWide}>Empreiteiro</Text>
            <Text style={styles.cell}>Valor</Text>
            <Text style={styles.cell}>% Acum.</Text>
          </View>
          {medicoes.slice(0, 10).map((m, i) => (
            <View key={m.id || i} style={styles.row}>
              <Text style={styles.cell}>{m.numero_medicao ?? '—'}</Text>
              <Text style={styles.cellWide}>
                {dataPt(m.periodo_inicio)} — {dataPt(m.periodo_fim)}
              </Text>
              <Text style={styles.cellWide}>{m.fornecedor_empreiteiro || '—'}</Text>
              <Text style={styles.cell}>{brl(m.valor_medicao ?? m.valor_medido, incluiFinanceiro)}</Text>
              <Text style={styles.cell}>{m.percentual_medido_acumulado ?? '—'}%</Text>
            </View>
          ))}
        </View>
      )}

      {fotosDataUri.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.titulo}>Registros Fotográficos ({fotosDataUri.length})</Text>
          <View style={styles.fotosRow}>
            {fotosDataUri.map((src, i) => (
              <Image key={i} src={src} style={styles.foto} />
            ))}
          </View>
          {dados.fotos.length > fotosDataUri.length && (
            <Text style={styles.texto}>
              + {dados.fotos.length - fotosDataUri.length} foto(s) adicionais no app.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
