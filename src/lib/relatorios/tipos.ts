import type {
  AndamentoEtapa,
  CronogramaItem,
  CronogramaMes,
  DiarioObra,
  FotoObra,
  Lote,
  MedicaoItem,
  Obra,
  OrcamentoItem,
  RelatorioTipo
} from '../../types';
import type { PontoCurvaS } from '../cronograma';
import type { ViabilidadeResult } from '../viabilidade';

export interface RelatorioCardConfig {
  tipo: RelatorioTipo;
  tituloPadrao: string;
  descricao: string;
}

export const RELATORIO_CARDS: RelatorioCardConfig[] = [
  {
    tipo: 'orcamento',
    tituloPadrao: 'Relatório de Orçamento',
    descricao: 'Valores por etapa e participação no total'
  },
  {
    tipo: 'cronograma',
    tituloPadrao: 'Relatório de Cronograma',
    descricao: 'Curva S, prazos e distribuição mensal'
  },
  {
    tipo: 'andamento',
    tituloPadrao: 'Andamento da Obra',
    descricao: 'Previsto x realizado e desvios por etapa'
  },
  {
    tipo: 'viabilidade',
    tituloPadrao: 'Relatório de Viabilidade',
    descricao: 'TIR, VPL, ROI, fluxo de caixa e indicadores'
  },
  {
    tipo: 'acompanhamento',
    tituloPadrao: 'Acompanhamento Fotográfico',
    descricao: 'Diário de obra, fotos e medições do período'
  },
  {
    tipo: 'mapa_lotes',
    tituloPadrao: 'Mapa de Lotes',
    descricao: 'Disponibilidade, vendas e espelho do empreendimento'
  },
  {
    tipo: 'global',
    tituloPadrao: 'Relatório Global Consolidado',
    descricao: 'Síntese executiva de todos os módulos'
  }
];

export type ModoVendasRelatorio = 'periodo' | 'acumulado';

export interface GerarRelatorioParams {
  obra: Obra;
  tipo: RelatorioTipo;
  titulo: string;
  periodoInicio: string;
  periodoFim: string;
  incluiFinanceiro: boolean;
  todosPeriodos?: boolean;
  modoVendas?: ModoVendasRelatorio;
  logoEmpresaUrl?: string | null;
  empresaNome?: string | null;
}

export interface ContagemLotes {
  disponivel: number;
  reservado: number;
  vendido: number;
  total: number;
}

export interface DadosRelatorio {
  obra: Obra;
  tipo: RelatorioTipo;
  titulo: string;
  periodoInicio: string;
  periodoFim: string;
  incluiFinanceiro: boolean;
  todosPeriodos: boolean;
  modoVendas: ModoVendasRelatorio;
  dataEmissao: string;
  empresaNome?: string | null;
  orcamentos: OrcamentoItem[];
  andamento: AndamentoEtapa[];
  cronograma: CronogramaItem[];
  cronogramaPeriodo: CronogramaItem[];
  cronogramaMeses: CronogramaMes[];
  chartCurvaS: PontoCurvaS[];
  diarios: DiarioObra[];
  fotos: FotoObra[];
  medicoes: MedicaoItem[];
  lotes: Lote[];
  vendasPeriodo: Lote[];
  contagemLotes: ContagemLotes;
  viabilidade: ViabilidadeResult | null;
  geralPrevisto: number;
  geralRealizado: number;
  totalOrcado: number;
  totalExecutado: number;
  totalOrcadoResumo: number;
}

export function tipoPrecisaPeriodo(tipo: RelatorioTipo): boolean {
  return tipo === 'andamento' || tipo === 'acompanhamento' || tipo === 'mapa_lotes' || tipo === 'global';
}

export function tipoPermiteTodoHistorico(tipo: RelatorioTipo): boolean {
  return tipo === 'acompanhamento' || tipo === 'mapa_lotes' || tipo === 'global';
}

export function mostrarSecao(tipo: RelatorioTipo, secao: RelatorioTipo): boolean {
  return tipo === 'global' || tipo === secao;
}
