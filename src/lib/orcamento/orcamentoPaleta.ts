import { PALETA_CORPORATIVA, corPorIndice } from '../relatorios/pdf/pdfPaleta';

/** Paleta azul/esmeralda compartilhada entre gráfico web e PDF de orçamento. */
export const PALETA_ETAPAS_ORCAMENTO = PALETA_CORPORATIVA;

export function corEtapaOrcamento(indice: number): string {
  return corPorIndice(indice);
}
