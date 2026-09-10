import React from 'react';
import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import type { DadosRelatorio, RelatorioTipo } from '../tipos';
import { periodoLabel } from '../formatadores';
import { PdfHeader, PdfFooter } from './PdfLayout';
import { SumarioExecutivo } from './SumarioExecutivo';
import { TabelaOrcamento } from './TabelaOrcamento';
import { TabelaAndamento } from './TabelaAndamento';
import { TabelaCronograma } from './TabelaCronograma';
import { AcompanhamentoSection } from './AcompanhamentoSection';

const styles = StyleSheet.create({
  page: { paddingTop: 72, paddingBottom: 56, paddingHorizontal: 32, fontSize: 9, fontFamily: 'Helvetica' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#1e293b' }
});

type Props = DadosRelatorio & {
  logoMeUrbanismoDataUri?: string;
  logoEmpresaDataUri?: string;
  fotosDataUri?: string[];
};

function PaginaComLayout({ dados, children }: { dados: Props; children: React.ReactNode }) {
  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader
        obraNome={dados.obra.nome}
        empresaNome={dados.empresaNome}
        logoMeUrbanismo={dados.logoMeUrbanismoDataUri}
        logoEmpresa={dados.logoEmpresaDataUri}
        dataEmissao={dados.dataEmissao}
      />
      {children}
      <PdfFooter dataEmissao={dados.dataEmissao} />
    </Page>
  );
}

function mostrarSecao(tipo: RelatorioTipo, secao: RelatorioTipo): boolean {
  return tipo === 'global' || tipo === secao;
}

export function RelatorioDocument(props: Props) {
  const { tipo } = props;
  const exibirSumario = tipo === 'global' || tipo === 'orcamento' || tipo === 'andamento';

  return (
    <Document title={props.titulo} author="Spechotto Assessoria & Construção">
      {exibirSumario && (
        <PaginaComLayout dados={props}>
          <SumarioExecutivo dados={props} />
        </PaginaComLayout>
      )}

      {mostrarSecao(tipo, 'orcamento') && (
        <PaginaComLayout dados={props}>
          <Text style={styles.sectionTitle}>Orçamento por Etapas</Text>
          <TabelaOrcamento itens={props.orcamentos} incluiFinanceiro={props.incluiFinanceiro} total={props.totalOrcado} />
        </PaginaComLayout>
      )}

      {mostrarSecao(tipo, 'cronograma') && (
        <PaginaComLayout dados={props}>
          <Text style={styles.sectionTitle}>Cronograma — Curva S e Prazos</Text>
          <TabelaCronograma
            cronograma={props.cronograma}
            meses={props.cronogramaMeses}
            incluiFinanceiro={props.incluiFinanceiro}
            obra={props.obra}
            orcamentos={props.orcamentos}
          />
        </PaginaComLayout>
      )}

      {mostrarSecao(tipo, 'andamento') && (
        <PaginaComLayout dados={props}>
          <Text style={styles.sectionTitle}>Andamento — Previsto x Realizado</Text>
          <TabelaAndamento etapas={props.andamento} />
        </PaginaComLayout>
      )}

      {mostrarSecao(tipo, 'acompanhamento') && (
        <PaginaComLayout dados={props}>
          <Text style={styles.sectionTitle}>Acompanhamento Fotográfico e Diário</Text>
          <Text style={{ marginBottom: 8, color: '#64748b' }}>
            Período: {periodoLabel(props.periodoInicio, props.periodoFim)}
          </Text>
          <AcompanhamentoSection diarios={props.diarios} fotosDataUri={props.fotosDataUri || []} />
        </PaginaComLayout>
      )}
    </Document>
  );
}
