export type FerramentaDiagnostico = 'selecao' | 'calibrar' | 'linha' | 'area';

export type CategoriaLevantamento =
  | 'ruas'
  | 'meioFio'
  | 'muro'
  | 'calcadas'
  | 'verdes'
  | 'quadras'
  | 'edificacoes'
  | 'lazer';

export type TipoMedicao = 'linha' | 'area';

/** Ponto no espaço do PDF (escala 1). */
export interface PontoPdf {
  x: number;
  y: number;
}

export interface MedicaoDiagnostico {
  id: string;
  categoria: CategoriaLevantamento;
  tipo: TipoMedicao;
  pontos: PontoPdf[];
  pagina: number;
  valor: number;
  nome?: string;
}

export interface CalibracaoEscala {
  metrosPorUnidade: number;
  rotulo: string;
  metrosReferencia: number;
  pontos: PontoPdf[];
  pagina: number;
}

export interface CategoriaConfig {
  id: CategoriaLevantamento;
  titulo: string;
  unidade: 'm' | 'm²';
  tipo: TipoMedicao | 'lista';
}

export const CATEGORIAS_LEVANTAMENTO: CategoriaConfig[] = [
  { id: 'ruas', titulo: 'Ruas / vias internas', unidade: 'm²', tipo: 'area' },
  { id: 'meioFio', titulo: 'Meio-fio', unidade: 'm', tipo: 'linha' },
  { id: 'muro', titulo: 'Muro de fechamento', unidade: 'm', tipo: 'linha' },
  { id: 'calcadas', titulo: 'Calçadas e pistas de caminhada', unidade: 'm²', tipo: 'area' },
  { id: 'verdes', titulo: 'Áreas de grama / verdes', unidade: 'm²', tipo: 'area' },
  { id: 'quadras', titulo: 'Quadras dos lotes (com calçadas frontais)', unidade: 'm²', tipo: 'area' },
  { id: 'edificacoes', titulo: 'Edificações', unidade: 'm²', tipo: 'lista' },
  { id: 'lazer', titulo: 'Itens de lazer', unidade: 'm²', tipo: 'lista' }
];
