// ============================================================
// TIPOS PRINCIPAIS DO SISTEMA meUrbanismo
// ============================================================

export type TabId =
  | 'dashboard'
  | 'resumo'
  | 'orcamento'
  | 'cronograma'
  | 'andamento'
  | 'viabilidade'
  | 'acompanhamento'
  | 'documentos'
  | 'mapa'
  | 'vendas'
  | 'relatorios'
  | 'portfolio'
  | 'admin'
  | 'nova-empresa'
  | 'nova-obra'
  | 'empresas';

// Roles internas do sistema
export type UserRole =
  | 'ADMINISTRADOR'
  | 'PROPRIETARIO_INVESTIDOR'
  | 'CORRETOR'
  | 'CLIENTE_COMPRADOR'
  | 'GESTOR'
  | 'CONSULTOR'
  | 'ENGENHEIRO'
  | 'INVESTIDOR';

// Parâmetro simplificado usado no simulador de perfil (Header)
export type SwitchRoleParam = 'admin' | 'investidor' | 'corretor' | 'cliente';

// ============================================================
// USUÁRIO / PERFIL
// ============================================================

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

/** @deprecated Use User */
export type Usuario = User;

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  telefone?: string;
  obra_ids?: string[];
}

// ============================================================
// EMPRESA
// ============================================================

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  contato?: string;
  responsavel_tecnico?: string;
  crea_cau?: string;
  logo_url?: string;
}

// ============================================================
// OBRA
// ============================================================

export interface Obra {
  id: string;
  nome: string;
  // snake_case (banco de dados)
  empresa_id?: string;
  empresa_nome?: string;
  // camelCase (legado / context)
  empresaId?: string;
  empresaNome?: string;
  cidade?: string;
  uf?: string;
  tipo?: string;
  status?: string;
  descricao?: string;
  endereco?: string;
  foto_capa?: string;
  // Datas
  data_inicio?: string;
  dataInicio?: string;
  data_previsao?: string;
  dataEntrega?: string;
  // Métricas
  area_total_m2?: number;
  areaM2?: number;
  metragemPadraoLote?: number;
  percentual_concluido?: number;
  total_lotes?: number;
  qtdLotes?: number;
  lotes_vendidos?: number;
  lotes_disponiveis?: number;
  custo_realizado?: number;
  custo_orcado?: number;
  valor_vgv?: number;
  valorGlobal?: number;
  arquivada?: boolean;
}

// ============================================================
// MACRO ETAPA / ANDAMENTO
// ============================================================

export interface MacroEtapa {
  id: string;
  obra_id?: string;
  nome: string;
  percentual_previsto?: number;
  percentual_realizado?: number;
  peso_orcamento?: number;
  cor?: string;
  status?: string;
  ordem?: number;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  data_inicio_real?: string;
  data_fim_real?: string;
}

// ============================================================
// ORÇAMENTO
// ============================================================

export interface OrcamentoItem {
  id: string;
  obra_id?: string;
  macro_etapa_id?: string;
  macro_etapa_nome?: string;
  codigo_sinapi?: string;
  descricao: string;
  categoria?: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  valor_orcado?: number;
  valor_executado?: number;
  percentual_executado?: number;
  data_atualizacao?: string;
}

/** @deprecated Use OrcamentoItem */
export type ItemOrcamento = OrcamentoItem;

// ============================================================
// CRONOGRAMA
// ============================================================

export interface CronogramaItem {
  id: string;
  obra_id?: string;
  etapa?: string;
  mes?: string;
  mes_ano?: string;
  mes_label?: string;
  ano?: number;
  status?: string;
  // Percentuais
  percentual_previsto_mes?: number;
  percentual_realizado_mes?: number;
  percentual_previsto_acumulado?: number;
  percentual_realizado_acumulado?: number;
  // Valores financeiros
  valor_previsto_mes?: number;
  valor_realizado_mes?: number;
  valor_previsto_acumulado?: number;
  valor_realizado_acumulado?: number;
}

/** @deprecated Use CronogramaItem */
export type ItemCronograma = CronogramaItem;

// ============================================================
// DIÁRIO DE OBRA
// ============================================================

export interface DiarioObra {
  id?: string;
  obra_id?: string;
  data?: string;
  clima?: string;
  clima_manha?: string;
  clima_tarde?: string;
  condicao_solo?: string;
  efetivo_proprio?: number;
  efetivo_terceirizado?: number;
  efetivo_pessoas?: number;
  equipamentos_ativos?: string[];
  equipes_presentes?: string[];
  atividades_realizadas?: string;
  ocorrencias?: string;
  responsavel_nome?: string;
  visivel_convidados?: boolean;
  fotos?: string[];
  created_at?: string;
}

// ============================================================
// MEDIÇÃO
// ============================================================

export interface MedicaoItem {
  id?: string;
  obra_id?: string;
  numero_medicao?: number;
  periodo_referencia?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  valor_medido?: number;
  valor_medicao?: number;
  valor_acumulado?: number;
  percentual_periodo?: number;
  percentual_medido_acumulado?: number;
  fornecedor_empreiteiro?: string;
  servico_executado?: string;
  status?: string;
  resumo_atividades?: string;
  link_relatorio_pdf?: string;
  data_medicao?: string;
  etapa?: string;
  visivel_convidados?: boolean;
}

/** @deprecated Use MedicaoItem */
export type Medicao = MedicaoItem;

// ============================================================
// FOTOS DE OBRA
// ============================================================

export interface FotoObra {
  id?: string;
  obra_id?: string;
  url?: string;
  titulo?: string;
  data?: string;
  data_registro?: string;
  autor_nome?: string;
  descricao?: string;
  categoria?: string;
  etapa_relacionada?: string;
  visivel_convidados?: boolean;
}

/** @deprecated Use FotoObra */
export type FotoRegistro = FotoObra;

// ============================================================
// DOCUMENTOS
// ============================================================

export interface DocumentoObra {
  id?: string;
  obra_id?: string;
  nome?: string;
  titulo?: string;
  tipo?: string;
  tipo_extensao?: string;
  url?: string;
  arquivo_url?: string;
  descricao?: string;
  data_upload?: string;
  data_emissao?: string;
  tamanho?: string;
  tamanho_bytes?: number;
  tamanho_kb?: number;
  codigo_revisao?: string;
  responsavel_tecnico?: string;
  categoria?: string;
  visivel_convidados?: boolean;
}

// ============================================================
// VIABILIDADE ECONÔMICA
// ============================================================

export interface ViabilidadeEstudo {
  id?: string;
  obra_id?: string;
  area_total?: number;
  quantidade_lotes?: number;
  // VGV
  vgv_bruto?: number;
  vgv_estimado?: number;
  vgv_liquido?: number;
  // Custos
  custo_terreno?: number;
  custo_obras_infra?: number;
  custo_obras_estimado?: number;
  custo_projetos_licencas?: number;
  custo_marketing_admin?: number;
  comissoes_vendas?: number;
  impostos_receita?: number;
  // Resultados
  lucro_estimado?: number;
  lucro_liquido_projetado?: number;
  margem_liquida?: number;
  margem_liquida_percentual?: number;
  roi_estimado?: number;
  roi_percentual?: number;
  tir?: number;
  tir_anual_percentual?: number;
  payback_meses?: number;
  ponto_equilibrio_meses?: number;
  ponto_equilibrio_lotes?: number;
  prazo_meses?: number;
}

/** @deprecated Use ViabilidadeEstudo */
export type Viabilidade = ViabilidadeEstudo;

// ============================================================
// LOTES / MAPA DE DISPONIBILIDADE
// ============================================================

export interface Lote {
  id: string;
  obra_id?: string;
  quadra?: string;
  numero?: string;
  area_m2?: number;
  frente_m?: number;
  fundo_m?: number;
  valor_m2?: number;
  valor_total?: number;
  topografia?: string;
  status?: 'disponivel' | 'reservado' | 'vendido' | 'bloqueado' | 'Disponível' | 'Reservado' | 'Vendido' | 'Bloqueado';
  cliente_nome?: string;
  corretor_nome?: string;
  data_venda?: string;
  comprador_nome?: string;
}

// ============================================================
// CONVITES / ACESSO EXTERNO
// ============================================================

export type ConviteStatus =
  | 'pendente' | 'aceito' | 'expirado' | 'cancelado'
  | 'PENDENTE' | 'COMPLETO' | 'ATIVO';

export interface Convite {
  id: string;
  // snake_case (banco)
  obra_id?: string;
  email?: string;
  nome?: string;
  telefone?: string;
  role?: UserRole;
  status?: ConviteStatus;
  statusCadastro?: string;
  ativo?: boolean;
  token?: string;
  created_at?: string;
  data_criacao?: string;
  expires_at?: string;
  link_acesso?: string;
  // camelCase (legado)
  obraId?: string;
  obraNome?: string;
  nomeConvidado?: string;
  dataCriacao?: string;
  linkAcceso?: string;
  perfil?: string;
  quadraLote?: string;
}