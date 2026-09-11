import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../tipos';
import { mostrarSecao } from '../tipos';
import { PaginaRelatorio, type LayoutProps } from './PdfLayout';
import { ResumoObraSection } from './sections/ResumoObraSection';
import { OrcamentoSection } from './sections/OrcamentoSection';
import { CronogramaSection } from './sections/CronogramaSection';
import { AndamentoSection } from './sections/AndamentoSection';
import { ViabilidadeSection } from './sections/ViabilidadeSection';
import { AcompanhamentoSection } from './sections/AcompanhamentoSection';
import { MapaLotesSection } from './sections/MapaLotesSection';

type Props = DadosRelatorio & {
  logoMeUrbanismoDataUri?: string;
  logoSpechottoDataUri?: string;
  fotosDataUri?: string[];
  mapaDataUri?: string;
};

function layoutProps(dados: Props): LayoutProps {
  return {
    titulo: dados.titulo,
    obraNome: dados.obra.nome,
    empresaNome: dados.empresaNome,
    logoMeUrbanismo: dados.logoMeUrbanismoDataUri,
    logoSpechotto: dados.logoSpechottoDataUri,
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
          <ResumoObraSection dados={props} />
        </Pagina>
      )}

      {mostrarSecao(tipo, 'orcamento') && (
        <Pagina dados={props}>
          <OrcamentoSection dados={props} />
        </Pagina>
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
