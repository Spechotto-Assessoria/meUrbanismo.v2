import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { DiarioObra } from '../../../types';
import { dataPt } from '../formatadores';

const styles = StyleSheet.create({
  diario: { marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  titulo: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  texto: { fontSize: 8, color: '#475569', marginBottom: 4 },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  foto: { width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }
});

type Props = { diarios: DiarioObra[]; fotosDataUri: string[] };

export function AcompanhamentoSection({ diarios, fotosDataUri }: Props) {
  return (
    <View>
      {diarios.slice(0, 5).map((d) => (
        <View key={d.id} style={styles.diario}>
          <Text style={styles.titulo}>Diário — {dataPt(d.data)}</Text>
          <Text style={styles.texto}>Atividades: {d.atividades_realizadas || '—'}</Text>
          <Text style={styles.texto}>Ocorrências: {d.ocorrencias || 'Nenhuma'}</Text>
          <Text style={styles.texto}>Responsável: {d.responsavel_nome || '—'}</Text>
        </View>
      ))}
      {diarios.length === 0 && <Text style={styles.texto}>Nenhum registro de diário no período.</Text>}

      {fotosDataUri.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.titulo}>Registros Fotográficos</Text>
          <View style={styles.fotosRow}>
            {fotosDataUri.map((src, i) => (
              <Image key={i} src={src} style={styles.foto} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
