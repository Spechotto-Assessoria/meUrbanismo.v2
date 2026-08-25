import { 
  Empresa, 
  Obra, 
  MacroEtapa, 
  OrcamentoItem, 
  CronogramaItem, 
  DiarioObra, 
  MedicaoItem, 
  FotoObra, 
  DocumentoObra, 
  ViabilidadeEstudo, 
  Lote, 
  Convite,
  UserProfile
} from '../types';

export const MOCK_EMPRESA: Empresa = {
  id: 'emp-001',
  nome: 'Spechotto Assessoria & Construção',
  cnpj: '38.452.910/0001-84',
  logo_url: '/logo-spechotto.png',
  responsavel_tecnico: 'Eng. Rennan Spechotto',
  crea_cau: 'CREA-SP 5069248190',
  telefone: '(17) 99742-8820',
  email: 'rennan.spechotto@gmail.com',
  endereco: 'Av. Alberto Andaló, 3840 - Sala 82 - Centro, São José do Rio Preto - SP'
};

export const MOCK_OBRAS: Obra[] = [
  {
    id: 'obra-001',
    empresa_id: 'emp-001',
    nome: 'Residencial Reserva dos Ipês',
    tipo: 'Loteamento Fechado',
    cidade: 'Mirassol',
    uf: 'SP',
    status: 'Em Andamento',
    data_inicio: '2024-03-01',
    data_previsao: '2025-11-30',
    percentual_concluido: 64.5,
    area_total_m2: 245000,
    total_lotes: 280,
    lotes_disponiveis: 58,
    lotes_reservados: 24,
    lotes_vendidos: 198,
    vgv_total: 42000000,
    custo_orcado: 14850000,
    custo_realizado: 9580000,
    imagem_capa: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1200&q=80',
    endereco_completo: 'Rodovia Washington Luís, KM 452 - Mirassol - SP'
  },
  {
    id: 'obra-002',
    empresa_id: 'emp-001',
    nome: 'Villa Bella Urban Park',
    tipo: 'Loteamento Aberto',
    cidade: 'São José do Rio Preto',
    uf: 'SP',
    status: 'Planejamento',
    data_inicio: '2025-02-01',
    data_previsao: '2026-08-30',
    percentual_concluido: 12.0,
    area_total_m2: 180000,
    total_lotes: 195,
    lotes_disponiveis: 195,
    lotes_reservados: 0,
    lotes_vendidos: 0,
    vgv_total: 29500000,
    custo_orcado: 10200000,
    custo_realizado: 1224000,
    imagem_capa: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
    endereco_completo: 'Av. Juscelino Kubitschek, Gleba 4 - Rio Preto - SP'
  }
];

export const MOCK_USERS_PERFIS: Record<string, UserProfile> = {
  admin: {
    id: 'user-admin-01',
    email: 'rennan.spechotto@gmail.com',
    nome: 'Rennan Spechotto (Administrador)',
    role: 'ADMINISTRADOR',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    telefone: '(17) 99742-8820',
    empresa_id: 'emp-001',
    created_at: '2024-01-10T10:00:00Z'
  },
  investidor: {
    id: 'user-inv-01',
    email: 'investidor.reserva@spechotto.com.br',
    nome: 'Carlos Eduardo Fontes (Proprietário/Investidor)',
    role: 'PROPRIETARIO_INVESTIDOR',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    telefone: '(17) 99123-4567',
    created_at: '2024-03-15T14:30:00Z'
  },
  corretor: {
    id: 'user-cor-01',
    email: 'marcos.imoveis@parceirospechotto.com',
    nome: 'Marcos Vinicius (Corretor Parceiro)',
    role: 'CORRETOR',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    telefone: '(17) 99654-3210',
    created_at: '2024-04-01T09:00:00Z'
  },
  cliente: {
    id: 'user-cli-01',
    email: 'luciana.compradora@gmail.com',
    nome: 'Luciana Ferreira (Cliente / Quadra B - Lote 14)',
    role: 'CLIENTE_COMPRADOR',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    telefone: '(17) 98877-6655',
    created_at: '2024-05-20T16:45:00Z'
  }
};

export const MOCK_MACRO_ETAPAS: MacroEtapa[] = [
  { id: 'et-1', nome: 'Serviços Preliminares e Licenças', percentual_previsto: 100, percentual_realizado: 100, peso_orcamento: 5, cor: '#0284C7', ordem: 1 },
  { id: 'et-2', nome: 'Terraplanagem e Corte/Aterro', percentual_previsto: 100, percentual_realizado: 98, peso_orcamento: 18, cor: '#0EA5E9', ordem: 2 },
  { id: 'et-3', nome: 'Drenagem e Galerias Pluviais', percentual_previsto: 90, percentual_realizado: 85, peso_orcamento: 22, cor: '#38BDF8', ordem: 3 },
  { id: 'et-4', nome: 'Redes de Água e Esgoto Sanitário', percentual_previsto: 75, percentual_realizado: 70, peso_orcamento: 16, cor: '#00B4D8', ordem: 4 },
  { id: 'et-5', nome: 'Sub-base e Pavimentação Asfáltica (CBUQ)', percentual_previsto: 60, percentual_realizado: 52, peso_orcamento: 24, cor: '#0077B6', ordem: 5 },
  { id: 'et-6', nome: 'Rede Elétrica e Iluminação LED', percentual_previsto: 40, percentual_realizado: 30, peso_orcamento: 10, cor: '#90E0EF', ordem: 6 },
  { id: 'et-7', nome: 'Portaria, Muros e Paisagismo', percentual_previsto: 25, percentual_realizado: 15, peso_orcamento: 5, cor: '#03045E', ordem: 7 },
];

export const MOCK_ORCAMENTOS: OrcamentoItem[] = [
  {
    id: 'orc-1',
    obra_id: 'obra-001',
    codigo_sinapi: '74128/001',
    categoria: 'Terraplanagem',
    descricao: 'Escavação mecânica, carga e transporte de terra (DMT até 2km)',
    unidade: 'm³',
    quantidade: 45000,
    valor_unitario: 28.50,
    valor_total: 1282500,
    percentual_executado: 100,
    valor_executado: 1282500,
    data_atualizacao: '2024-08-15'
  },
  {
    id: 'orc-2',
    obra_id: 'obra-001',
    codigo_sinapi: '93402',
    categoria: 'Drenagem Pluvial',
    descricao: 'Assentamento de tubos de concreto armado PB classe PA-2 DN 600mm',
    unidade: 'm',
    quantidade: 3200,
    valor_unitario: 340.00,
    valor_total: 1088000,
    percentual_executado: 88,
    valor_executado: 957440,
    data_atualizacao: '2024-08-18'
  },
  {
    id: 'orc-3',
    obra_id: 'obra-001',
    codigo_sinapi: '96384',
    categoria: 'Pavimentação Asfáltica',
    descricao: 'Execução de capa asfáltica em CBUQ espessura 4cm compactada',
    unidade: 'm²',
    quantidade: 38000,
    valor_unitario: 72.00,
    valor_total: 2736000,
    percentual_executado: 55,
    valor_executado: 1504800,
    data_atualizacao: '2024-08-20'
  },
  {
    id: 'orc-4',
    obra_id: 'obra-001',
    codigo_sinapi: '98412',
    categoria: 'Rede de Água',
    descricao: 'Rede de distribuição em PVC DEFOFO DN 100mm e ligações prediais',
    unidade: 'm',
    quantidade: 5400,
    valor_unitario: 145.00,
    valor_total: 783000,
    percentual_executado: 75,
    valor_executado: 587250,
    data_atualizacao: '2024-08-22'
  },
  {
    id: 'orc-5',
    obra_id: 'obra-001',
    codigo_sinapi: '101200',
    categoria: 'Rede Elétrica e Iluminação',
    descricao: 'Posteamento circular concreto, rede aérea compactada e luminárias LED 150W',
    unidade: 'un',
    quantidade: 140,
    valor_unitario: 4200.00,
    valor_total: 588000,
    percentual_executado: 35,
    valor_executado: 205800,
    data_atualizacao: '2024-08-23'
  },
  {
    id: 'orc-6',
    obra_id: 'obra-001',
    codigo_sinapi: '102980',
    categoria: 'Muros e Portaria',
    descricao: 'Edificação do pórtico de entrada, guarita climatizada e fechamento perimetral',
    unidade: 'vb',
    quantidade: 1,
    valor_unitario: 890000.00,
    valor_total: 890000,
    percentual_executado: 20,
    valor_executado: 178000,
    data_atualizacao: '2024-08-24'
  }
];

export const MOCK_CRONOGRAMA: CronogramaItem[] = [
  { id: 'cr-1', obra_id: 'obra-001', mes_ano: '2024-03', mes_label: 'Mar/24', percentual_previsto_mes: 5.0, percentual_realizado_mes: 5.5, percentual_previsto_acumulado: 5.0, percentual_realizado_acumulado: 5.5, valor_previsto_mes: 742500, valor_realizado_mes: 816750, valor_previsto_acumulado: 742500, valor_realizado_acumulado: 816750, status: 'Concluído' },
  { id: 'cr-2', obra_id: 'obra-001', mes_ano: '2024-04', mes_label: 'Abr/24', percentual_previsto_mes: 8.0, percentual_realizado_mes: 8.2, percentual_previsto_acumulado: 13.0, percentual_realizado_acumulado: 13.7, valor_previsto_mes: 1188000, valor_realizado_mes: 1217700, valor_previsto_acumulado: 1930500, valor_realizado_acumulado: 2034450, status: 'Concluído' },
  { id: 'cr-3', obra_id: 'obra-001', mes_ano: '2024-05', mes_label: 'Mai/24', percentual_previsto_mes: 10.0, percentual_realizado_mes: 9.8, percentual_previsto_acumulado: 23.0, percentual_realizado_acumulado: 23.5, valor_previsto_mes: 1485000, valor_realizado_mes: 1455300, valor_previsto_acumulado: 3415500, valor_realizado_acumulado: 3489750, status: 'Concluído' },
  { id: 'cr-4', obra_id: 'obra-001', mes_ano: '2024-06', mes_label: 'Jun/24', percentual_previsto_mes: 12.0, percentual_realizado_mes: 12.0, percentual_previsto_acumulado: 35.0, percentual_realizado_acumulado: 35.5, valor_previsto_mes: 1782000, valor_realizado_mes: 1782000, valor_previsto_acumulado: 5197500, valor_realizado_acumulado: 5271750, status: 'Concluído' },
  { id: 'cr-5', obra_id: 'obra-001', mes_ano: '2024-07', mes_label: 'Jul/24', percentual_previsto_mes: 14.0, percentual_realizado_mes: 13.8, percentual_previsto_acumulado: 49.0, percentual_realizado_acumulado: 49.3, valor_previsto_mes: 2079000, valor_realizado_mes: 2049300, valor_previsto_acumulado: 7276500, valor_realizado_acumulado: 7321050, status: 'Concluído' },
  { id: 'cr-6', obra_id: 'obra-001', mes_ano: '2024-08', mes_label: 'Ago/24', percentual_previsto_mes: 15.0, percentual_realizado_mes: 15.2, percentual_previsto_acumulado: 64.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 2227500, valor_realizado_mes: 2258950, valor_previsto_acumulado: 9504000, valor_realizado_acumulado: 9580000, status: 'Em Andamento' },
  { id: 'cr-7', obra_id: 'obra-001', mes_ano: '2024-09', mes_label: 'Set/24', percentual_previsto_mes: 12.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 76.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1782000, valor_realizado_mes: 0, valor_previsto_acumulado: 11286000, valor_realizado_acumulado: 9580000, status: 'Futuro' },
  { id: 'cr-8', obra_id: 'obra-001', mes_ano: '2024-10', mes_label: 'Out/24', percentual_previsto_mes: 10.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 86.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1485000, valor_realizado_mes: 0, valor_previsto_acumulado: 12771000, valor_realizado_acumulado: 9580000, status: 'Futuro' },
  { id: 'cr-9', obra_id: 'obra-001', mes_ano: '2024-11', mes_label: 'Nov/24', percentual_previsto_mes: 8.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 94.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1188000, valor_realizado_mes: 0, valor_previsto_acumulado: 13959000, valor_realizado_acumulado: 9580000, status: 'Futuro' },
  { id: 'cr-10', obra_id: 'obra-001', mes_ano: '2024-12', mes_label: 'Dez/24', percentual_previsto_mes: 6.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 100.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 891000, valor_realizado_mes: 0, valor_previsto_acumulado: 14850000, valor_realizado_acumulado: 9580000, status: 'Futuro' }
];

export const MOCK_DIARIOS: DiarioObra[] = [
  {
    id: 'diario-01',
    obra_id: 'obra-001',
    data: '2024-08-25',
    clima_manha: 'Ensolarado',
    clima_tarde: 'Ensolarado',
    condicao_solo: 'Praticável',
    efetivo_proprio: 4,
    efetivo_terceirizado: 28,
    equipamentos_ativos: ['1x Escavadeira Hidráulica CAT 320', '2x Caminhão Basculante 6x4', '1x Rolo Compactador Dynapac', '1x Motoniveladora CAT 140K'],
    atividades_realizadas: 'Aplicação de imprimação asfáltica na Rua 04 e Rua 05. Continuidade da implantação dos poços de visita da rede de esgoto na Quadra C.',
    ocorrencias: 'Nenhum acidente registrado. Fiscalização ambiental realizou vistoria rotineira sem pendências.',
    responsavel_nome: 'Eng. Rennan Spechotto',
    created_at: '2024-08-25T17:30:00Z'
  },
  {
    id: 'diario-02',
    obra_id: 'obra-001',
    data: '2024-08-24',
    clima_manha: 'Nublado',
    clima_tarde: 'Ensolarado',
    condicao_solo: 'Praticável',
    efetivo_proprio: 4,
    efetivo_terceirizado: 26,
    equipamentos_ativos: ['1x Motoniveladora CAT 140K', '1x Rolo Pé-de-Carneiro', '2x Caminhões Pipa'],
    atividades_realizadas: 'Regularização e umectação da sub-base de brita graduada nas Quadras E e F. Instalação de bocas de lobo duplas.',
    responsavel_nome: 'Eng. Rennan Spechotto',
    created_at: '2024-08-24T17:45:00Z'
  }
];

export const MOCK_MEDICOES: MedicaoItem[] = [
  {
    id: 'med-01',
    obra_id: 'obra-001',
    numero_medicao: 6,
    periodo_inicio: '2024-08-01',
    periodo_fim: '2024-08-15',
    fornecedor_empreiteiro: 'Pavimentadora Noroeste Ltda',
    servico_executado: 'Base de BGS e Imprimação Asfáltica (14.200 m²)',
    valor_medicao: 428000,
    valor_acumulado: 1845000,
    percentual_medido_periodo: 15.6,
    percentual_medido_acumulado: 67.5,
    status: 'Aprovada',
    aprovado_por: 'Eng. Rennan Spechotto',
    data_aprovacao: '2024-08-18T11:00:00Z',
    observacoes: 'Ensaios de defletometria e compactação conforme norma DNIT.'
  },
  {
    id: 'med-02',
    obra_id: 'obra-001',
    numero_medicao: 7,
    periodo_inicio: '2024-08-16',
    periodo_fim: '2024-08-31',
    fornecedor_empreiteiro: 'EletroInstal Engenharia',
    servico_executado: 'Implantação de postes e condutores aéreos de MT e BT',
    valor_medicao: 165000,
    valor_acumulado: 310000,
    percentual_medido_periodo: 28.0,
    percentual_medido_acumulado: 52.7,
    status: 'Em Análise',
    observacoes: 'Aguardando entrega de 12 postes adicionais da concessionária CPFL.'
  }
];

export const MOCK_FOTOS: FotoObra[] = [
  {
    id: 'ft-1',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1000&q=80',
    titulo: 'Vista Aérea Geral do Loteamento',
    descricao: 'Evolução da malha viária e demarcação dos lotes das Quadras A até H.',
    categoria: 'Aéreo / Drone',
    data_registro: '2024-08-22',
    visivel_convidados: true,
    autor_nome: 'Spechotto Drones'
  },
  {
    id: 'ft-2',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1000&q=80',
    titulo: 'Assentamento de Tubos de Drenagem Pluvial',
    descricao: 'Instalação de tubos de 600mm na Avenida Principal com reaterro compactado.',
    categoria: 'Drenagem',
    data_registro: '2024-08-20',
    visivel_convidados: true,
    autor_nome: 'Eng. Rennan Spechotto'
  },
  {
    id: 'ft-3',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80',
    titulo: 'Pavimentação Asfáltica - Aplicação de CBUQ',
    descricao: 'Aplicação de camada de rolamento a quente na Rua dos Ipês.',
    categoria: 'Pavimentação',
    data_registro: '2024-08-18',
    visivel_convidados: true,
    autor_nome: 'Eng. Rennan Spechotto'
  },
  {
    id: 'ft-4',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
    titulo: 'Detalhe Construtivo da Armadura do Bueiro Tubular (Interno)',
    descricao: 'Inspeção de armadura antes da concretagem da laje de fundo. Registro interno de engenharia.',
    categoria: 'Drenagem',
    data_registro: '2024-08-16',
    visivel_convidados: false, // Oculto para convidados
    autor_nome: 'Equipe de Qualidade'
  }
];

export const MOCK_DOCUMENTOS: DocumentoObra[] = [
  {
    id: 'doc-1',
    obra_id: 'obra-001',
    titulo: 'Projeto Urbanístico e Geométrico Aprovado (GRAPROHAB)',
    categoria: 'Urbanístico',
    codigo_revisao: 'R04-FINAL',
    data_emissao: '2024-02-10',
    tamanho_bytes: 14800000,
    tipo_extensao: 'PDF',
    arquivo_url: '#',
    visivel_convidados: true,
    responsavel_tecnico: 'Arq. Urbanista Juliana Prado (CAU A89210-4)',
    descricao: 'Prancha geral com cotas, recuos, áreas públicas e sistema viário completo.'
  },
  {
    id: 'doc-2',
    obra_id: 'obra-001',
    titulo: 'Licença de Instalação Ambiental (LI - CETESB)',
    categoria: 'Licenças Ambientais',
    codigo_revisao: 'LI-08942/24',
    data_emissao: '2024-01-18',
    tamanho_bytes: 4200000,
    tipo_extensao: 'PDF',
    arquivo_url: '#',
    visivel_convidados: true,
    responsavel_tecnico: 'CETESB / Meio Ambiente',
    descricao: 'Certificado de dispensa e autorização para supressão de vegetação exótica.'
  },
  {
    id: 'doc-3',
    obra_id: 'obra-001',
    titulo: 'Projeto Executivo de Drenagem e Bacia de Detenção',
    categoria: 'Drenagem',
    codigo_revisao: 'R02',
    data_emissao: '2024-03-05',
    tamanho_bytes: 28500000,
    tipo_extensao: 'DWG',
    arquivo_url: '#',
    visivel_convidados: false, // Documento restrito de engenharia
    responsavel_tecnico: 'Eng. Rennan Spechotto (CREA 5069248190)',
    descricao: 'Dimensionamento hidráulico de sarjetas, caixas de passagem e dissipador.'
  },
  {
    id: 'doc-4',
    obra_id: 'obra-001',
    titulo: 'Memorial Descritivo e Regulamento Construtivo do Loteamento',
    categoria: 'Alvarás e Jurídico',
    codigo_revisao: 'R01',
    data_emissao: '2024-04-12',
    tamanho_bytes: 3100000,
    tipo_extensao: 'PDF',
    arquivo_url: '#',
    visivel_convidados: true,
    responsavel_tecnico: 'Jurídico Spechotto',
    descricao: 'Normas de recuo, gabarito máximo de altura e padrão construtivo dos lotes.'
  }
];

export const MOCK_VIABILIDADE: ViabilidadeEstudo = {
  id: 'viab-001',
  obra_id: 'obra-001',
  vgv_bruto: 42000000,
  comissoes_vendas: 2100000, // 5%
  impostos_receita: 2478000, // 5.9% RET
  vgv_liquido: 37422000,
  custo_terreno: 9200000,
  custo_obras_infra: 14850000,
  custo_projetos_licencas: 820000,
  custo_marketing_admin: 1250000,
  custo_total: 26120000,
  lucro_liquido_projetado: 11302000,
  margem_liquida_percentual: 26.91,
  roi_percentual: 43.27,
  tir_anual_percentual: 31.85,
  prazo_meses: 24,
  ponto_equilibrio_meses: 9,
  ponto_equilibrio_lotes: 72
};

export const MOCK_LOTES: Lote[] = [
  { id: 'lt-01', obra_id: 'obra-001', quadra: 'A', numero: '01', area_m2: 360, frente_m: 12, fundo_m: 30, valor_m2: 450, valor_total: 162000, status: 'Vendido', topografia: 'Esquina', cliente_nome: 'Dr. Roberto Silveira' },
  { id: 'lt-02', obra_id: 'obra-001', quadra: 'A', numero: '02', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'Disponível', topografia: 'Plano' },
  { id: 'lt-03', obra_id: 'obra-001', quadra: 'A', numero: '03', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'Reservado', topografia: 'Plano', corretor_nome: 'Marcos Vinicius' },
  { id: 'lt-04', obra_id: 'obra-001', quadra: 'A', numero: '04', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'Disponível', topografia: 'Plano' },
  { id: 'lt-05', obra_id: 'obra-001', quadra: 'B', numero: '14', area_m2: 320, frente_m: 10.6, fundo_m: 30.2, valor_m2: 440, valor_total: 140800, status: 'Vendido', topografia: 'Plano', cliente_nome: 'Luciana Ferreira' },
  { id: 'lt-06', obra_id: 'obra-001', quadra: 'B', numero: '15', area_m2: 350, frente_m: 11.5, fundo_m: 30.4, valor_m2: 440, valor_total: 154000, status: 'Disponível', topografia: 'Aclive Suave' },
  { id: 'lt-07', obra_id: 'obra-001', quadra: 'C', numero: '01', area_m2: 410, frente_m: 14, fundo_m: 29.3, valor_m2: 460, valor_total: 188600, status: 'Disponível', topografia: 'Esquina' },
  { id: 'lt-08', obra_id: 'obra-001', quadra: 'C', numero: '02', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'Bloqueado', topografia: 'Plano' }
];

export const MOCK_CONVITES: Convite[] = [
  {
    id: 'conv-01',
    obra_id: 'obra-001',
    nome: 'Carlos Eduardo Fontes',
    email: 'investidor.reserva@spechotto.com.br',
    telefone: '(17) 99123-4567',
    role: 'PROPRIETARIO_INVESTIDOR',
    token: 'tok_inv_839219',
    status: 'Aceito',
    link_acesso: 'https://meurbanismo.com.br/acesso?token=tok_inv_839219',
    created_at: '2024-03-15T14:30:00Z',
    expira_em: '2025-03-15T14:30:00Z'
  },
  {
    id: 'conv-02',
    obra_id: 'obra-001',
    nome: 'Marcos Vinicius Imóveis',
    email: 'marcos.imoveis@parceirospechotto.com',
    telefone: '(17) 99654-3210',
    role: 'CORRETOR',
    token: 'tok_cor_472810',
    status: 'Aceito',
    link_acesso: 'https://meurbanismo.com.br/acesso?token=tok_cor_472810',
    created_at: '2024-04-01T09:00:00Z',
    expira_em: '2025-04-01T09:00:00Z'
  },
  {
    id: 'conv-03',
    obra_id: 'obra-001',
    nome: 'Dra. Fernanda Albuquerque',
    email: 'fernanda.albuquerque@gmail.com',
    telefone: '(17) 99788-1122',
    role: 'CLIENTE_COMPRADOR',
    token: 'tok_cli_992144',
    status: 'Pendente',
    link_acesso: 'https://meurbanismo.com.br/acesso?token=tok_cli_992144',
    created_at: '2024-08-20T10:15:00Z',
    expira_em: '2024-09-20T10:15:00Z'
  }
];
