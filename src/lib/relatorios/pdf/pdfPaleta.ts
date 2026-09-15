/** Paleta corporativa meUrbanismo — compartilhada entre gráficos PDF e web. */
export const PALETA_CORPORATIVA = [
  '#1e3a8a', // Azul Marinho
  '#06b6d4', // Ciano
  '#2563eb', // Azul Royal
  '#475569', // Azul Aço
  '#059669', // Verde Esmeralda
  '#d97706', // Âmbar
  '#4f46e5', // Índigo
  '#0d9488', // Teal
  '#64748b', // Slate
] as const;

export const CORES_TEXTO = {
  navy: '#1e3a8a',
  slate: '#64748b',
  steel: '#475569'
} as const;

export function corPorIndice(i: number): string {
  return PALETA_CORPORATIVA[i % PALETA_CORPORATIVA.length];
}

/** Mapeamento semântico — Página 1 (exceção: Vendido mantém vermelho) */
export const CORES_LOTES_STATUS = {
  disponivel: '#059669',
  reservado: '#d97706',
  vendido: '#dc2626'
} as const;
