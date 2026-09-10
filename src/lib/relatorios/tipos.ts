import type {
  AndamentoEtapa,
  CronogramaItem,
  CronogramaMes,
  DiarioObra,
  FotoObra,
  Obra,
  OrcamentoItem,
  RelatorioTipo
} from '../../types';

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
    tipo: 'acompanhamento',
    tituloPadrao: 'Acompanhamento Fotográfico',
    descricao: 'Diário de obra, ocorrências e registros visuais'
  },
  {
    tipo: 'global',
    tituloPadrao: 'Relatório Global Consolidado',
    descricao: 'Síntese executiva de todos os módulos'
  }
];

export interface GerarRelatorioParams {
  obra: Obra;
  tipo: RelatorioTipo;
  titulo: string;
  periodoInicio: string;
  periodoFim: string;
  incluiFinanceiro: boolean;
  logoEmpresaUrl?: string | null;
  empresaNome?: string | null;
}

export interface DadosRelatorio {
  obra: Obra;
  tipo: RelatorioTipo;
  titulo: string;
  periodoInicio: string;
  periodoFim: string;
  incluiFinanceiro: boolean;
  dataEmissao: string;
  logoEmpresaUrl?: string | null;
  empresaNome?: string | null;
  orcamentos: OrcamentoItem[];
  andamento: AndamentoEtapa[];
  cronograma: CronogramaItem[];
  cronogramaMeses: CronogramaMes[];
  diarios: DiarioObra[];
  fotos: FotoObra[];
  geralPrevisto: number;
  geralRealizado: number;
  totalOrcado: number;
  totalExecutado: number;
}
