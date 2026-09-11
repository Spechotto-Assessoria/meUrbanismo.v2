import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { dataPt } from '../formatadores';

const NAVY = '#1e3a8a';
const SLATE = '#64748b';

const styles = StyleSheet.create({
  page: {
    paddingTop: 88,
    paddingBottom: 56,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    position: 'relative'
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 8
  },
  colLeft: { width: '22%', alignItems: 'flex-start' },
  colCenter: { width: '56%', alignItems: 'center', paddingHorizontal: 6 },
  colRight: { width: '22%', alignItems: 'flex-end' },
  logo: { width: 52, height: 36, objectFit: 'contain' },
  titulo: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  subtitulo: { fontSize: 8, color: SLATE, textAlign: 'center', marginTop: 2 },
  meta: { fontSize: 7, color: SLATE, textAlign: 'center', marginTop: 2 },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    width: '50%',
    height: 200,
    opacity: 0.06,
    objectFit: 'contain'
  },
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
    color: SLATE
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  }
});

export type LayoutProps = {
  titulo: string;
  obraNome: string;
  empresaNome?: string | null;
  logoMeUrbanismo?: string;
  logoSpechotto?: string;
  dataEmissao: string;
};

export function PdfHeader({ titulo, obraNome, empresaNome, logoMeUrbanismo, logoSpechotto, dataEmissao }: LayoutProps) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.colLeft}>
        {logoMeUrbanismo ? <Image src={logoMeUrbanismo} style={styles.logo} /> : null}
      </View>
      <View style={styles.colCenter}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.subtitulo}>{obraNome}</Text>
        <Text style={styles.subtitulo}>{empresaNome || 'Spechotto Assessoria & Construção'}</Text>
        <Text style={styles.meta}>Emissão: {dataPt(dataEmissao)}</Text>
      </View>
      <View style={styles.colRight}>
        {logoSpechotto ? <Image src={logoSpechotto} style={styles.logo} /> : null}
      </View>
    </View>
  );
}

export function PdfWatermark({ logoMeUrbanismo }: { logoMeUrbanismo?: string }) {
  if (!logoMeUrbanismo) return null;
  return <Image src={logoMeUrbanismo} style={styles.watermark} fixed />;
}

export function PdfFooter({ dataEmissao }: { dataEmissao: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Spechotto Assessoria & Construção — meUrbanismo</Text>
      <Text>{dataPt(dataEmissao)}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

export function PdfSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

type PaginaProps = LayoutProps & { children: React.ReactNode };

export function PaginaRelatorio({ children, ...layout }: PaginaProps) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <PdfWatermark logoMeUrbanismo={layout.logoMeUrbanismo} />
      <PdfHeader {...layout} />
      {children}
      <PdfFooter dataEmissao={layout.dataEmissao} />
    </Page>
  );
}
