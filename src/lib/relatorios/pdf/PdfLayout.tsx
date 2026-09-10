import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { dataPt } from '../formatadores';

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 36, height: 36, objectFit: 'contain' },
  title: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 8, color: '#475569' },
  meta: { fontSize: 8, color: '#64748b', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    fontSize: 7,
    color: '#64748b'
  }
});

type HeaderProps = {
  obraNome: string;
  empresaNome?: string | null;
  logoMeUrbanismo?: string;
  logoEmpresa?: string;
  dataEmissao: string;
};

export function PdfHeader({ obraNome, empresaNome, logoMeUrbanismo, logoEmpresa, dataEmissao }: HeaderProps) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.logoRow}>
        {logoMeUrbanismo ? <Image src={logoMeUrbanismo} style={styles.logo} /> : null}
        {logoEmpresa ? <Image src={logoEmpresa} style={styles.logo} /> : null}
        <View>
          <Text style={styles.title}>{obraNome}</Text>
          <Text style={styles.subtitle}>{empresaNome || 'meUrbanismo'}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.meta}>Emissão: {dataPt(dataEmissao)}</Text>
        <Text style={styles.meta}>Relatório Executivo</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ dataEmissao }: { dataEmissao: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Desenvolvido por Spechotto Assessoria & Construção</Text>
      <Text>{dataPt(dataEmissao)}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}
