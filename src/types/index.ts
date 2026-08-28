export type TabId =
  | 'dashboard'
  | 'andamento'
  | 'orcamento'
  | 'cronograma'
  | 'acompanhamento'
  | 'documentos'
  | 'viabilidade'
  | 'mapa'
  | 'vendas'
  | 'relatorios'
  | 'admin'
  | 'nova-empresa'
  | 'nova-obra';

export type UserRole = 'ADMINISTRADOR' | 'GESTOR' | 'CONSULTOR' | 'ENGENHEIRO' | 'INVESTIDOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Obra {
  id: string;
  nome: string;
  empresa_id?: string;
  cidade?: string;
  uf?: string;
  tipo?: string;
  status?: string;
  percentual_concluido?: number;
  total_lotes?: number;
  custo_realizado?: number;
  custo_orcado?: number;
  valor_vgv?: number;
}

export interface DiarioObra {
  id?: string;
  obra_id?: string;
  data?: string;
  clima_manha?: any;
  clima_tarde?: any;
  condicao_solo?: any;
  efetivo_proprio?: number;
  efetivo_terceirizado?: number;
  efetivo_pessoas?: number;
  equipamentos_ativos?: string[];
  atividades_realizadas?: string;
  ocorrencias?: string;
  responsavel_nome?: string;
  created_at?: string;
}

export interface Medicao {
  id?: string;
  obra_id?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  valor_medicao?: number;
  valor_acumulado?: number;
  status?: string;
  data_medicao?: string;
}

export interface FotoRegistro {
  id?: string;
  obra_id?: string;
  url?: string;
  descricao?: string;
  data_registro?: string;
  categoria?: string;
}

export interface Lote {
  id: string;
  obra_id?: string;
  quadra?: string;
  numero?: string;
  area_m2?: number;
  valor_m2?: number;
  valor_total?: number;
  status?: 'disponivel' | 'reservado' | 'vendido' | 'bloqueado';
}

export interface Viabilidade {
  id?: string;
  obra_id?: string;
  custo_terreno?: number;
  custo_obras_infra?: number;
  custo_projetos_licencas?: number;
  custo_marketing_admin?: number;
  comissoes_vendas?: number;
  impostos_receita?: number;
  lucro_liquido_projetado?: number;
  vgv_bruto?: number;
  vgv_liquido?: number;
}

export interface ItemOrcamento {
  id: string;
  descricao: string;
  valor_orcado?: number;
  valor_executado?: number;
  percentual_executado?: number;
}

export interface ItemCronograma {
  id: string;
  etapa: string;
  valor_previsto_mes?: number;
  valor_realizado_mes?: number;
}