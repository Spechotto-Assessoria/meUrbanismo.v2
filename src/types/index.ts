export type UserRole =
  | 'ADMINISTRADOR'
  | 'PROPRIETARIO_INVESTIDOR'
  | 'CORRETOR'
  | 'CLIENTE_COMPRADOR';

export type TabId =
  | 'dashboard'
  | 'andamento'
  | 'orcamento'
  | 'cronograma'
  | 'viabilidade'
  | 'acompanhamento'
  | 'documentos'
  | 'relatorios'
  | 'mapa'
  | 'vendas'
  | 'admin'
  | 'nova-empresa'
  | 'nova-obra';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  telefone?: string;
}

export type UserProfile = User;

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
  email?: string;
  telefone?: string;
  logo_url?: string;
  responsavel_tecnico?: string;
  crea_cau?: string;
}

export interface Obra {
  id: string;
  nome: string;
  empresaId?: string;
  empresa_id?: string;
  empresaNome?: string;
  empresa_nome?: string;
  cidade: string;
  uf: string;
  tipo: string;
  status?: string;
  descricao?: string;
  endereco?: string;

  areaM2?: number;
  area_total_m2?: number;
  valorGlobal?: number;
  valor_vgv?: number;
  qtdLotes?: number;
  total_lotes?: number;
  lotes_vendidos?: number;
  lotes_disponiveis?: number;
  metragemPadraoLote?: number;
  percentual_concluido?: number;
  custo_orcado?: number;
  custo_realizado?: number;

  dataInicio?: string;
  data_inicio?: string;
  dataEntrega?: string;
  data_previsao?: string;

  logoObra?: string;
  foto_capa?: string;
}

export interface MacroEtapa {
  id: string;
  nome: string;
  cor: string;
  ordem?: number;
  percentual_previsto?: number;
  percentual_realizado?: number;
  peso_orcamento?: number;
}

export interface OrcamentoItem {
  id: string;
  obra_id: string;
  macro_etapa_id: string;
  macro_etapa_nome?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_realizado?: number;
  valor_executado?: number;
  percentual_executado?: number;
  categoria?: string;
  codigo_sinapi?: string;
}

export interface CronogramaItem {
  id: string;
  obra_id: string;
  macro_etapa_id?: string;
  macro_etapa_nome?: string;
  item_nome?: string;
  mes_ano?: string;
  mes_label?: string;
  data_inicio?: string;
  data_fim?: string;
  percentual_concluido?: number;
  percentual_previsto_mes?: number;
  percentual_realizado_mes?: number;
  percentual_previsto_acumulado?: number;
  percentual_realizado_acumulado?: number;
  valor_previsto_mes?: number;
  valor_realizado_mes?: number;
  valor_previsto_acumulado?: number;
  valor_realizado_acumulado?: number;
  status: 'planejado' | 'em_andamento' | 'concluido' | 'atrasado' | 'Concluído' | 'Em Andamento' | 'Futuro' | string;
}

export interface DiarioObra {
  id: string;
  obra_id: string;
  data: string;
  clima?: 'ensolarado' | 'chuvoso' | 'nublado' | string;
  clima_manha?: string;
  clima_tarde?: string;
  efetivo_pessoas: number;
  atividades_realizadas: string;
  ocorrencias?: string;
  fotos?: string[];
  equipes_presentes?: string[];
  visivel_convidados?: boolean;
}

export interface MedicaoItem {
  id: string;
  obra_id: string;
  numero_medicao: number;
  data_medicao: string;
  valor_medido: number;
  percentual_periodo: number;
  status: 'rascunho' | 'aprovado' | 'pago' | 'Aprovada' | 'Em Análise' | string;
  periodo_referencia?: string;
  resumo_atividades?: string;
  link_relatorio_pdf?: string;
  visivel_convidados?: boolean;
}

export interface FotoObra {
  id: string;
  obra_id: string;
  url: string;
  titulo: string;
  data: string;
  categoria: 'geral' | 'pavimentacao' | 'drenagem' | 'eletrica' | 'portaria' | 'Aéreo / Drone' | 'Drenagem' | 'Pavimentação' | string;
  descricao?: string;
  etapa_relacionada?: string;
  visivel_convidados?: boolean;
}

export interface DocumentoObra {
  id: string;
  obra_id: string;
  nome?: string;
  titulo?: string;
  categoria: 'projetos' | 'licencas' | 'contratos' | 'financeiro' | 'Urbanístico' | 'Licenças Ambientais' | 'Drenagem' | 'Alvarás e Jurídico' | string;
  url: string;
  data_upload: string;
  tamanho?: string;
  tamanho_bytes?: number;
  tipo_extensao?: string;
  codigo_revisao?: string;
  responsavel_tecnico?: string;
  visivel_convidados?: boolean;
}

export interface ViabilidadeEstudo {
  id: string;
  obra_id: string;
  area_total: number;
  quantidade_lotes: number;
  vgv_bruto?: number;
  vgv_estimado?: number;
  vgv_liquido?: number;
  custo_obras_estimado?: number;
  custo_terreno?: number;
  custo_obras_infra?: number;
  custo_projetos_licencas?: number;
  custo_marketing_admin?: number;
  comissoes_vendas?: number;
  impostos_receita?: number;
  lucro_estimado?: number;
  lucro_liquido_projetado?: number;
  margem_liquida_percentual?: number;
  roi_estimado?: number;
  roi_percentual?: number;
  tir_anual_percentual?: number;
  ponto_equilibrio_meses?: number;
  ponto_equilibrio_lotes?: number;
  prazo_meses?: number;
}

export interface Lote {
  id: string;
  obra_id: string;
  quadra: string;
  numero: string;
  area_m2: number;
  frente_m?: number;
  fundo_m?: number;
  valor?: number;
  valor_m2?: number;
  valor_total?: number;
  topografia?: string;
  status: 'disponivel' | 'reservado' | 'vendido' | 'Disponível' | 'Reservado' | 'Vendido' | 'Bloqueado' | string;
  comprador_nome?: string;
  cliente_nome?: string;
  corretor_nome?: string;
}

export interface Convite {
  id: string;
  email: string;
  nome?: string;
  telefone?: string;
  obraId?: string;
  obra_id?: string;
  obraNome?: string;
  role: UserRole;
  ativo: boolean;
  dataCriacao?: string;
  data_criacao?: string;
  linkAcceso?: string;
  link_acesso?: string;
  quadraLote?: string;
  statusCadastro?: 'PENDENTE' | 'COMPLETO' | string;
  status?: string;
}