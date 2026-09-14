/** Paleta azul/esmeralda compartilhada entre gráfico web e PDF de orçamento. */
export const PALETA_ETAPAS_ORCAMENTO = [
  '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#0f766e', '#059669', '#10b981', '#34d399',
  '#b45309', '#d97706', '#f59e0b',
  '#64748b', '#475569', '#334155', '#1e293b',
] as const;

export function corEtapaOrcamento(indice: number): string {
  return PALETA_ETAPAS_ORCAMENTO[indice % PALETA_ETAPAS_ORCAMENTO.length];
}
