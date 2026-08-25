// Definição dos tipos e modelos do sistema meUrbanismo

export type UserRole = 
  | 'ADMINISTRADOR' 
  | 'PROPRIETARIO_INVESTIDOR' 
  | 'CORRETOR' 
  | 'CLIENTE_COMPRADOR';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  avatar_url?: string;
  telefone?: string;
  empresa_id?: string;
  created_at: string;
}

export type TabId = 
  | 'andamento'
  | 'orcamento'
  | 'cronograma'
  | 'acompanhamento'
  | 'documentos'
  | 'viabilidade'
  | 'mapa'
  | 'vendas'
  | 'relatorios'
  | 'admin';

export interface TabConfig {
  id: TabId;
  label: string;
  shortLabel?: string;
  iconName: string;
  rolesAllowed: UserRole[];
  badge?: string;
  isComingSoon?: boolean;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  logo_url?: string;
  responsavel_tecnico?: string;
  crea_cau?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Obra {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: 'Loteamento Fechado' | 'Loteamento Aberto' | 'Condomínio de Chácaras' | 'Edifício Residencial' | 'Comercial';
  cidade: string;
  uf: string;
  status: 'Planejamento' | 'Em Andamento' | 'Fase Final' | 'Concluída';
  data_inicio: string;
  data_previsao: string;
  percentual_concluido: number;
  area_total_m2: number;
  total_lotes: number;
  lotes_disponiveis: number;
  lotes_reservados: number;
  lotes_vendidos: number;
  vgv_total: number;
  custo_orcado: number;
  custo_realizado: number;
  imagem_capa?: string;
  endereco_completo?: string;
}

export interface MacroEtapa {
  id: string;
  nome: string;
  percentual_previsto: number;
  percentual_realizado: number;
  peso_orcamento: number; // % do total da obra
  cor: string;
  ordem: number;
}

export interface OrcamentoItem {
  id: string;
  obra_id: string;
  codigo_sinapi?: string;
  categoria: 'Serviços Preliminares' | 'Terraplanagem' | 'Drenagem Pluvial' | 'Rede de Água' | 'Rede de Esgoto' | 'Pavimentação Asfáltica' | 'Rede Elétrica e Iluminação' | 'Paisagismo e Urbanismo' | 'Muros e Portaria' | 'Licenciamento e Projetos';
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  percentual_executado: number;
  valor_executado: number;
  data_atualizacao: string;
}

export interface CronogramaItem {
  id: string;
  obra_id: string;
  mes_ano: string; // Ex: '2025-01'
  mes_label: string; // Ex: 'Jan/25'
  percentual_previsto_mes: number;
  percentual_realizado_mes: number;
  percentual_previsto_acumulado: number;
  percentual_realizado_acumulado: number;
  valor_previsto_mes: number;
  valor_realizado_mes: number;
  valor_previsto_acumulado: number;
  valor_realizado_acumulado: number;
  status: 'Concluído' | 'Em Andamento' | 'Futuro';
}

export interface DiarioObra {
  id: string;
  obra_id: string;
  data: string;
  clima_manha: 'Ensolarado' | 'Nublado' | 'Chuvoso' | 'Chuva Forte';
  clima_tarde: 'Ensolarado' | 'Nublado' | 'Chuvoso' | 'Chuva Forte';
  condicao_solo: 'Praticável' | 'Impraticável' | 'Parcialmente Praticável';
  efetivo_proprio: number;
  efetivo_terceirizado: number;
  equipamentos_ativos: string[];
  atividades_realizadas: string;
  ocorrencias?: string;
  responsavel_nome: string;
  fotos_urls?: string[];
  created_at: string;
}

export interface MedicaoItem {
  id: string;
  obra_id: string;
  numero_medicao: number;
  periodo_inicio: string;
  periodo_fim: string;
  fornecedor_empreiteiro: string;
  servico_executado: string;
  valor_medicao: number;
  valor_acumulado: number;
  percentual_medido_periodo: number;
  percentual_medido_acumulado: number;
  status: 'Aprovada' | 'Em Análise' | 'Paga' | 'Rejeitada';
  aprovado_por?: string;
  data_aprovacao?: string;
  observacoes?: string;
}

export interface FotoObra {
  id: string;
  obra_id: string;
  url: string;
  titulo: string;
  descricao?: string;
  categoria: 'Evolução Geral' | 'Terraplanagem' | 'Drenagem' | 'Pavimentação' | 'Portaria' | 'Aéreo / Drone';
  data_registro: string;
  visivel_convidados: boolean; // Flag estrita para controle de visibilidade
  autor_nome: string;
}

export interface DocumentoObra {
  id: string;
  obra_id: string;
  titulo: string;
  categoria: 'Arquitetônico' | 'Urbanístico' | 'Estrutural' | 'Drenagem' | 'Elétrico' | 'Hidrossanitário' | 'Licenças Ambientais' | 'Alvarás e Jurídico' | 'Laudos Técnicos';
  codigo_revisao: string;
  data_emissao: string;
  tamanho_bytes: number;
  tipo_extensao: 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'ZIP' | 'IMG';
  arquivo_url: string;
  visivel_convidados: boolean; // Flag para toggle 🌐 Convidados vs 🔒 Admin
  responsavel_tecnico: string;
  descricao?: string;
}

export interface ViabilidadeEstudo {
  id: string;
  obra_id: string;
  vgv_bruto: number;
  comissoes_vendas: number;
  impostos_receita: number;
  vgv_liquido: number;
  custo_terreno: number;
  custo_obras_infra: number;
  custo_projetos_licencas: number;
  custo_marketing_admin: number;
  custo_total: number;
  lucro_liquido_projetado: number;
  margem_liquida_percentual: number;
  roi_percentual: number;
  tir_anual_percentual: number;
  prazo_meses: number;
  ponto_equilibrio_meses: number;
  ponto_equilibrio_lotes: number;
}

export interface Lote {
  id: string;
  obra_id: string;
  quadra: string;
  numero: string;
  area_m2: number;
  frente_m: number;
  fundo_m: number;
  valor_m2: number;
  valor_total: number;
  status: 'Disponível' | 'Reservado' | 'Vendido' | 'Bloqueado';
  topografia: 'Plano' | 'Aclive Suave' | 'Declive Suave' | 'Esquina';
  cliente_nome?: string;
  corretor_nome?: string;
}

export interface Convite {
  id: string;
  obra_id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: UserRole;
  token: string;
  status: 'Pendente' | 'Aceito' | 'Expirado';
  link_acesso: string;
  created_at: string;
  expira_em: string;
}

export interface PropostaVenda {
  id: string;
  obra_id: string;
  lote_id: string;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  cliente_email: string;
  corretor_nome: string;
  valor_lote: number;
  valor_entrada: number;
  percentual_entrada: number;
  numero_parcelas: number; // Até 120x
  valor_parcela_inicial: number;
  tipo_reajuste: 'IPCA + 0.5% a.m.' | 'IGPM + 0.5% a.m.' | 'Taxa Fixa 1.0% a.m.';
  baloes_anuais_qtd?: number;
  valor_baloes?: number;
  total_financiado: number;
  total_proposta: number;
  data_geracao: string;
  validade_dias: number;
}
