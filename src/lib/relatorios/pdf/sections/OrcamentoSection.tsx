import React from 'react';
import { View } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { PdfSectionTitle } from '../PdfLayout';
import { TabelaOrcamento } from '../TabelaOrcamento';
import { PizzaParticipacaoPdf } from '../charts/PizzaParticipacaoPdf';

export function OrcamentoSection({ dados }: { dados: DadosRelatorio }) {
  return (
    <View>
      <PdfSectionTitle>Orçamento por Etapas</PdfSectionTitle>
      <PizzaParticipacaoPdf itens={dados.orcamentos} total={dados.totalOrcado} />
      <TabelaOrcamento itens={dados.orcamentos} incluiFinanceiro={dados.incluiFinanceiro} total={dados.totalOrcado} />
    </View>
  );
}
