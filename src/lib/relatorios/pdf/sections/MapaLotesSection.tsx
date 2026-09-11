import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { brl, dataPt, periodoLabel } from '../../formatadores';
import { normalizeStatus } from '../../../loteMapa';
import { PdfSectionTitle } from '../PdfLayout';

const styles = StyleSheet.create({
  periodo: { fontSize: 8, color: '#64748b', marginBottom: 8 },
  resumo: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  badge: { fontSize: 8, padding: 4, borderRadius: 4, borderWidth: 1 },
  mapa: { width: '100%', height: 220, objectFit: 'contain', marginVertical: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 3 },
  head: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  cell: { width: '12%', fontSize: 7 },
  cellWide: { width: '18%', fontSize: 7 },
  legenda: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  legItem: { fontSize: 7, color: '#475569' }
});

type Props = { dados: DadosRelatorio; mapaDataUri?: string };

export function MapaLotesSection({ dados, mapaDataUri }: Props) {
  const { contagemLotes, lotes, vendasPeriodo, modoVendas, incluiFinanceiro, todosPeriodos } = dados;
  const periodoTxt =
    modoVendas === 'acumulado'
      ? 'Vendas acumuladas (todo o período)'
      : todosPeriodos
        ? 'Vendas — todo o histórico'
        : `Vendas do período: ${periodoLabel(dados.periodoInicio, dados.periodoFim)}`;

  const lista = [...lotes].sort((a, b) => {
    const qa = `${a.quadra || ''}-${a.numero || ''}`;
    const qb = `${b.quadra || ''}-${b.numero || ''}`;
    return qa.localeCompare(qb);
  });

  return (
    <View>
      <PdfSectionTitle>Mapa de Lotes — Disponibilidade e Vendas</PdfSectionTitle>
      <Text style={styles.periodo}>{periodoTxt}</Text>

      <View style={styles.resumo}>
        <Text style={[styles.badge, { borderColor: '#059669', color: '#059669' }]}>
          Disponíveis: {contagemLotes.disponivel}
        </Text>
        <Text style={[styles.badge, { borderColor: '#d97706', color: '#d97706' }]}>
          Reservados: {contagemLotes.reservado}
        </Text>
        <Text style={[styles.badge, { borderColor: '#b91c1c', color: '#b91c1c' }]}>
          Vendidos: {contagemLotes.vendido}
        </Text>
      </View>

      <View style={styles.legenda}>
        <Text style={styles.legItem}>■ Verde — Disponível</Text>
        <Text style={styles.legItem}>■ Amarelo — Reservado</Text>
        <Text style={styles.legItem}>■ Vermelho — Vendido</Text>
      </View>

      {mapaDataUri ? (
        <Image src={mapaDataUri} style={styles.mapa} />
      ) : (
        <Text style={styles.periodo}>Mapa não disponível (cadastre o masterplan e polígonos dos lotes).</Text>
      )}

      {vendasPeriodo.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Vendas no escopo selecionado</Text>
          <View style={[styles.row, styles.head]}>
            <Text style={styles.cell}>Quadra</Text>
            <Text style={styles.cell}>Lote</Text>
            <Text style={styles.cellWide}>Comprador</Text>
            <Text style={styles.cell}>Data</Text>
            <Text style={styles.cell}>Valor</Text>
          </View>
          {vendasPeriodo.slice(0, 15).map((l) => (
            <View key={l.id} style={styles.row}>
              <Text style={styles.cell}>{l.quadra || '—'}</Text>
              <Text style={styles.cell}>{l.numero || '—'}</Text>
              <Text style={styles.cellWide}>{l.comprador_nome || l.cliente_nome || '—'}</Text>
              <Text style={styles.cell}>{dataPt(l.data_venda)}</Text>
              <Text style={styles.cell}>{brl(l.valor_total, incluiFinanceiro)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Planilha de Lotes</Text>
        <View style={[styles.row, styles.head]}>
          <Text style={styles.cell}>Quadra</Text>
          <Text style={styles.cell}>Lote</Text>
          <Text style={styles.cell}>Área</Text>
          <Text style={styles.cell}>Status</Text>
          <Text style={styles.cell}>Valor</Text>
        </View>
        {lista.slice(0, 40).map((l) => (
          <View key={l.id} style={styles.row}>
            <Text style={styles.cell}>{l.quadra || '—'}</Text>
            <Text style={styles.cell}>{l.numero || '—'}</Text>
            <Text style={styles.cell}>{l.area_m2 ? `${l.area_m2} m²` : '—'}</Text>
            <Text style={styles.cell}>{normalizeStatus(l.status)}</Text>
            <Text style={styles.cell}>{brl(l.valor_total, incluiFinanceiro)}</Text>
          </View>
        ))}
        {lista.length > 40 && (
          <Text style={styles.periodo}>+ {lista.length - 40} lotes no cadastro completo.</Text>
        )}
      </View>
    </View>
  );
}
