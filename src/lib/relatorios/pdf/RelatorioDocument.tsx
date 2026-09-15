import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../tipos';
import { mostrarSecao } from '../tipos';
import { PaginaRelatorio, type LayoutProps } from './PdfLayout';
import { ResumoObraSection } from './sections/ResumoObraSection';
import { OrcamentoResumoSection, OrcamentoTabelaSection } from './sections/OrcamentoSection';
import { CronogramaSection } from './sections/CronogramaSection';
import { AndamentoSection } from './sections/AndamentoSection';
import { ViabilidadeSection } from './sections/ViabilidadeSection';
import { AcompanhamentoSection } from './sections/AcompanhamentoSection';
import { MapaLotesSection } from './sections/MapaLotesSection';

type Props = DadosRelatorio & {
  logoMeUrbanismoDataUri?: string;
  logoSpechottoDataUri?: string;
  watermarkIconDataUri?: string;
  fotosDataUri?: string[];
  mapaDataUri?: string;
  graficoOrcamentoDataUri?: string;
};

function layoutProps(dados: Props): LayoutProps {
  return {
    titulo: dados.titulo,
    obraNome: dados.obra.nome,
    empresaNome: dados.empresaNome,
    logoMeUrbanismo: dados.logoMeUrbanismoDataUri,
    logoSpechotto: dados.logoSpechottoDataUri,
    watermarkIcon: dados.watermarkIconDataUri,
    dataEmissao: dados.dataEmissao
  };
}

function Pagina({ dados, children }: { dados: Props; children: React.ReactNode }) {
  return <PaginaRelatorio {...layoutProps(dados)}>{children}</PaginaRelatorio>;
}

export function RelatorioDocument(props: Props) {
  const { tipo } = props;

  return (
    <Document title={props.titulo} author="Spechotto Assessoria & Construção">
      {tipo === 'global' && (
        <Pagina dados={props}>
          <View style={{ flexDirection: 'column', flexGrow: 1, minHeight: 620 }}>
            <ResumoObraSection dados={props} />
            <View
              style={{
                marginTop: 'auto',
                borderTopWidth: 1,
                paddingTop: 10,
                borderColor: '#e2e8f0'
              }}
            >
              <Text style={{ fontSize: 8, color: '#475569' }}>
                Supervisão: {props.obra.supervisao_tecnica?.trim() || '—'}
              </Text>
              <Text style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>
                Engenheiro: {props.obra.engenheiro_responsavel || 'Não informado (Apenas Assessoria)'}
              </Text>
            </View>
          </View>
        </Pagina>
      )}

      {mostrarSecao(tipo, 'orcamento') && (
        <>
          <Pagina dados={props}>
            <OrcamentoResumoSection
              dados={props}
              graficoOrcamentoDataUri={props.graficoOrcamentoDataUri}
            />
          </Pagina>
          <Pagina dados={props}>
            <OrcamentoTabelaSection dados={props} />
          </Pagina>
        </>
      )}

      {mostrarSecao(tipo, 'cronograma') && (
        <Pagina dados={props}>
          <CronogramaSection dados={props} />
        </Pagina>
      )}

      {mostrarSecao(tipo, 'andamento') && (
        <Pagina dados={props}>
          <AndamentoSection dados={props} />
        </Pagina>
      )}

      {mostrarSecao(tipo, 'viabilidade') && (
        <Pagina dados={props}>
          <ViabilidadeSection dados={props} />
        </Pagina>
      )}

      {mostrarSecao(tipo, 'acompanhamento') && (
        <Pagina dados={props}>
          <AcompanhamentoSection dados={props} fotosDataUri={props.fotosDataUri || []} />
        </Pagina>
      )}

      {mostrarSecao(tipo, 'mapa_lotes') && (
        <Pagina dados={props}>
          <MapaLotesSection dados={props} mapaDataUri={props.mapaDataUri} />
        </Pagina>
      )}
    </Document>
  );
}
