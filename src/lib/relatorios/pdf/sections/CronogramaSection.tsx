import React from 'react';
import { View } from '@react-pdf/renderer';
import type { DadosRelatorio } from '../../tipos';
import { PdfSectionTitle } from '../PdfLayout';
import { TabelaCronograma } from '../TabelaCronograma';
import { CurvaSChartPdf } from '../charts/CurvaSChartPdf';

export function CronogramaSection({ dados }: { dados: DadosRelatorio }) {
  return (
    <View>
      <PdfSectionTitle>Cronograma — Curva S e Prazos</PdfSectionTitle>
      <CurvaSChartPdf cronograma={dados.cronograma} />
      <TabelaCronograma
        cronograma={dados.cronograma}
        meses={dados.cronogramaMeses}
        incluiFinanceiro={dados.incluiFinanceiro}
        obra={dados.obra}
        orcamentos={dados.orcamentos}
      />
    </View>
  );
}
