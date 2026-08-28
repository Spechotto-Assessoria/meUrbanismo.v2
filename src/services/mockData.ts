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

export const MOCK_EMPRESAS: Empresa[] = [
  {
    id: 'emp-001',
    nome: 'Conecta Urbanismo',
    cnpj: '12.345.678/0001-90',
    email: 'contato@conectaurbanismo.com.br',
    telefone: '(17) 3211-9000',
    responsavel_tecnico: 'Eng. Rennan Spechotto',
    crea_cau: 'CREA-SP 5069248190'
  },
  {
    id: 'emp-002',
    nome: 'Linkage Empreendimentos',
    cnpj: '98.765.432/0001-10',
    email: 'contato@linkage.com.br',
    telefone: '(17) 3222-4400'
  }
];

// Alias para retrocompatibilidade do Supabase service
export const MOCK_EMPRESA = MOCK_EMPRESAS;

export const MOCK_OBRAS: Obra[] = [
  {
    id: 'obra-001',
    nome: 'Residencial Reserva dos Ipês',
    empresa_id: 'emp-001',
    empresaId: 'emp-001',
    empresa_nome: 'Conecta Urbanismo',
    empresaNome: 'Conecta Urbanismo',
    cidade: 'Mirassol',
    uf: 'SP',
    tipo: 'Loteamento Fechado',
    status: 'Em Andamento',
    area_total_m2: 85000,
    areaM2: 85000,
    valor_vgv: 39221779,
    valorGlobal: 39221779,
    total_lotes: 186,
    qtdLotes: 186,
    lotes_vendidos: 128,
    lotes_disponiveis: 58,
    percentual_concluido: 64.5,
    custo_orcado: 14850000,
    custo_realizado: 9580000,
    data_inicio: '2024-03-01',
    dataInicio: '2024-03-01',
    data_previsao: '2025-12-20',
    dataEntrega: '2025-12-20',
    foto_capa: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
  },
  {
    id: 'obra-002',
    nome: 'Villa Bella Urban Park',
    empresa_id: 'emp-002',
    empresaId: 'emp-002',
    empresa_nome: 'Linkage Empreendimentos',
    empresaNome: 'Linkage Empreendimentos',
    cidade: 'São José do Rio Preto',
    uf: 'SP',
    tipo: 'Loteamento Aberto',
    status: 'Planejamento',
    area_total_m2: 120000,
    areaM2: 120000,
    valor_vgv: 54000000,
    valorGlobal: 54000000,
    total_lotes: 240,
    qtdLotes: 240,
    lotes_vendidos: 45,
    lotes_disponiveis: 195,
    percentual_concluido: 15.0,
    custo_orcado: 21000000,
    custo_realizado: 3150000,
    data_inicio: '2024-08-01',
    dataInicio: '2024-08-01',
    data_previsao: '2026-06-30',
    dataEntrega: '2026-06-30',
    foto_capa: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
  }
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    nome: 'Rennan Spechotto',
    email: 'rennan_seidl@hotmail.com',
    role: 'ADMINISTRADOR',
    telefone: '(17) 99742-8820',
    avatar_url: '/logo-meurbanismo.png'
  },
  {
    id: 'usr-2',
    nome: 'Carlos Eduardo Silva',
    email: 'carlos.investor@gmail.com',
    role: 'PROPRIETARIO_INVESTIDOR',
    telefone: '(17) 99123-4567'
  },
  {
    id: 'usr-3',
    nome: 'Fernanda Lima',
    email: 'fernanda.corretora@remax.com',
    role: 'CORRETOR',
    telefone: '(17) 99654-3210'
  },
  {
    id: 'usr-4',
    nome: 'Dr. Roberto Silveira',
    email: 'roberto.silveira@adv.br',
    role: 'CLIENTE_COMPRADOR',
    telefone: '(17) 98877-6655'
  }
];

export const MOCK_MACRO_ETAPAS: MacroEtapa[] = [
  { id: 'et-1', nome: 'Serviços Preliminares e Licenças', percentual_previsto: 100, percentual_realizado: 100, peso_orcamento: 5, cor: '#0284C7', ordem: 1 },
  { id: 'et-2', nome: 'Terraplanagem e Corte/Aterro', percentual_previsto: 100, percentual_realizado: 98, peso_orcamento: 18, cor: '#0EA5E9', ordem: 2 },
  { id: 'et-3', nome: 'Drenagem e Galerias Pluviais', percentual_previsto: 90, percentual_realizado: 85, peso_orcamento: 22, cor: '#38BDF8', ordem: 3 },
  { id: 'et-4', nome: 'Redes de Água e Esgoto Sanitário', percentual_previsto: 75, percentual_realizado: 70, peso_orcamento: 16, cor: '#00B4D8', ordem: 4 },
  { id: 'et-5', nome: 'Sub-base e Pavimentação Asfáltica (CBUQ)', percentual_previsto: 60, percentual_realizado: 52, peso_orcamento: 24, cor: '#0077B6', ordem: 5 },
  { id: 'et-6', nome: 'Rede Elétrica e Iluminação LED', percentual_previsto: 40, percentual_realizado: 30, peso_orcamento: 10, cor: '#90E0EF', ordem: 6 },
  { id: 'et-7', nome: 'Portaria, Muros e Paisagismo', percentual_previsto: 25, percentual_realizado: 15, peso_orcamento: 5, cor: '#03045E', ordem: 7 }
];

export const MOCK_ORCAMENTOS: OrcamentoItem[] = [
  {
    id: 'orc-1',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-2',
    macro_etapa_nome: 'Terraplanagem e Corte/Aterro',
    codigo_sinapi: '74128/001',
    descricao: 'Escavação e carga de material de 1ª categoria com escavadeira hidráulica',
    unidade: 'm³',
    quantidade: 45000,
    valor_unitario: 14.50,
    valor_total: 652500,
    valor_executado: 639450,
    percentual_executado: 98
  },
  {
    id: 'orc-2',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-3',
    macro_etapa_nome: 'Drenagem e Galerias Pluviais',
    codigo_sinapi: '93402',
    descricao: 'Tubo de concreto armativo para drenagem PA-1 DN 800mm',
    unidade: 'm',
    quantidade: 1800,
    valor_unitario: 285.00,
    valor_total: 513000,
    valor_executado: 436050,
    percentual_executado: 85
  },
  {
    id: 'orc-3',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-5',
    macro_etapa_nome: 'Sub-base e Pavimentação Asfáltica (CBUQ)',
    codigo_sinapi: '96384',
    descricao: 'Execução de pavimento com CBUQ espessura 4,0cm',
    unidade: 'm²',
    quantidade: 32000,
    valor_unitario: 68.00,
    valor_total: 2176000,
    valor_executado: 1131520,
    percentual_executado: 52
  },
  {
    id: 'orc-4',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-4',
    macro_etapa_nome: 'Redes de Água e Esgoto Sanitário',
    codigo_sinapi: '98412',
    descricao: 'Rede distribuidora de água em tubo PVC DEFOFO DN 100mm',
    unidade: 'm',
    quantidade: 4200,
    valor_unitario: 92.00,
    valor_total: 386400,
    valor_executado: 270480,
    percentual_executado: 70
  },
  {
    id: 'orc-5',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-6',
    macro_etapa_nome: 'Rede Elétrica e Iluminação LED',
    codigo_sinapi: '101200',
    descricao: 'Poste de concreto duplo T 11m / 300daN com luminária LED 100W',
    unidade: 'un',
    quantidade: 140,
    valor_unitario: 1850.00,
    valor_total: 259000,
    valor_executado: 77700,
    percentual_executado: 30
  },
  {
    id: 'orc-6',
    obra_id: 'obra-001',
    macro_etapa_id: 'et-7',
    macro_etapa_nome: 'Portaria, Muros e Paisagismo',
    codigo_sinapi: '102980',
    descricao: 'Muro periférico em bloco estrutural H=2,80m com reboco e pintura',
    unidade: 'm',
    quantidade: 1600,
    valor_unitario: 320.00,
    valor_total: 512000,
    valor_executado: 76800,
    percentual_executado: 15
  }
];

export const MOCK_CRONOGRAMAS: CronogramaItem[] = [
  { id: 'cr-1', obra_id: 'obra-001', mes_ano: '2024-03', mes_label: 'Mar/24', percentual_previsto_mes: 5.0, percentual_realizado_mes: 5.5, percentual_previsto_acumulado: 5.0, percentual_realizado_acumulado: 5.5, valor_previsto_mes: 742500, valor_realizado_mes: 816750, valor_previsto_acumulado: 742500, valor_realizado_acumulado: 816750, status: 'concluido' },
  { id: 'cr-2', obra_id: 'obra-001', mes_ano: '2024-04', mes_label: 'Abr/24', percentual_previsto_mes: 8.0, percentual_realizado_mes: 8.2, percentual_previsto_acumulado: 13.0, percentual_realizado_acumulado: 13.7, valor_previsto_mes: 1188000, valor_realizado_mes: 1217700, valor_previsto_acumulado: 1930500, valor_realizado_acumulado: 2034450, status: 'concluido' },
  { id: 'cr-3', obra_id: 'obra-001', mes_ano: '2024-05', mes_label: 'Mai/24', percentual_previsto_mes: 10.0, percentual_realizado_mes: 9.8, percentual_previsto_acumulado: 23.0, percentual_realizado_acumulado: 23.5, valor_previsto_mes: 1485000, valor_realizado_mes: 1455300, valor_previsto_acumulado: 3415500, valor_realizado_acumulado: 3489750, status: 'concluido' },
  { id: 'cr-4', obra_id: 'obra-001', mes_ano: '2024-06', mes_label: 'Jun/24', percentual_previsto_mes: 12.0, percentual_realizado_mes: 12.0, percentual_previsto_acumulado: 35.0, percentual_realizado_acumulado: 35.5, valor_previsto_mes: 1782000, valor_realizado_mes: 1782000, valor_previsto_acumulado: 5197500, valor_realizado_acumulado: 5271750, status: 'concluido' },
  { id: 'cr-5', obra_id: 'obra-001', mes_ano: '2024-07', mes_label: 'Jul/24', percentual_previsto_mes: 14.0, percentual_realizado_mes: 13.8, percentual_previsto_acumulado: 49.0, percentual_realizado_acumulado: 49.3, valor_previsto_mes: 2079000, valor_realizado_mes: 2049300, valor_previsto_acumulado: 7276500, valor_realizado_acumulado: 7321050, status: 'concluido' },
  { id: 'cr-6', obra_id: 'obra-001', mes_ano: '2024-08', mes_label: 'Ago/24', percentual_previsto_mes: 15.0, percentual_realizado_mes: 15.2, percentual_previsto_acumulado: 64.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 2227500, valor_realizado_mes: 2258950, valor_previsto_acumulado: 9504000, valor_realizado_acumulado: 9580000, status: 'em_andamento' },
  { id: 'cr-7', obra_id: 'obra-001', mes_ano: '2024-09', mes_label: 'Set/24', percentual_previsto_mes: 12.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 76.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1782000, valor_realizado_mes: 0, valor_previsto_acumulado: 11286000, valor_realizado_acumulado: 9580000, status: 'planejado' },
  { id: 'cr-8', obra_id: 'obra-001', mes_ano: '2024-10', mes_label: 'Out/24', percentual_previsto_mes: 10.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 86.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1485000, valor_realizado_mes: 0, valor_previsto_acumulado: 12771000, valor_realizado_acumulado: 9580000, status: 'planejado' },
  { id: 'cr-9', obra_id: 'obra-001', mes_ano: '2024-11', mes_label: 'Nov/24', percentual_previsto_mes: 8.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 94.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 1188000, valor_realizado_mes: 0, valor_previsto_acumulado: 13959000, valor_realizado_acumulado: 9580000, status: 'planejado' },
  { id: 'cr-10', obra_id: 'obra-001', mes_ano: '2024-12', mes_label: 'Dez/24', percentual_previsto_mes: 6.0, percentual_realizado_mes: 0, percentual_previsto_acumulado: 100.0, percentual_realizado_acumulado: 64.5, valor_previsto_mes: 891000, valor_realizado_mes: 0, valor_previsto_acumulado: 14850000, valor_realizado_acumulado: 9580000, status: 'planejado' }
];

// Alias para retrocompatibilidade do Supabase service
export const MOCK_CRONOGRAMA = MOCK_CRONOGRAMAS;

export const MOCK_DIARIOS: DiarioObra[] = [
  {
    id: 'diario-1',
    obra_id: 'obra-001',
    data: '2024-08-26',
    clima: 'ensolarado',
    clima_manha: 'Ensolarado',
    clima_tarde: 'Ensolarado',
    condicao_solo: 'Seco e Firme',
    efetivo_pessoas: 38,
    efetivo_proprio: 12,
    efetivo_terceirizado: 26,
    equipamentos_ativos: ['Escavadeira H-12', 'Motoniveladora', 'Rolo Compactador'],
    responsavel_nome: 'Eng. Rennan Spechotto',
    equipes_presentes: ['Terraplanagem', 'Drenagem', 'Topografia'],
    atividades_realizadas: 'Assentamento de tubos de concreto PA-1 na Alameda A. Terraplanagem na Quadra C com nivelamento e compactação do subleito.',
    ocorrencias: 'Nenhuma ocorrência registrada. Trabalho transcorreu dentro da normalidade.',
    visivel_convidados: true,
    fotos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=600',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600'
    ]
  },
  {
    id: 'diario-2',
    obra_id: 'obra-001',
    data: '2024-08-25',
    clima: 'nublado',
    clima_manha: 'Nublado',
    clima_tarde: 'Chuva Leve',
    condicao_solo: 'Úmido',
    efetivo_pessoas: 24,
    efetivo_proprio: 8,
    efetivo_terceirizado: 16,
    equipamentos_ativos: ['Caminhão Muck', 'Retroescavadeira'],
    responsavel_nome: 'Eng. Rennan Spechotto',
    equipes_presentes: ['Eléctrica', 'Muro Periférico'],
    atividades_realizadas: 'Abertura de valas para eletrodutos subterrâneos da rede de iluminação. Execução de alvenaria do muro periférico do setor norte.',
    ocorrencias: 'Paralisação parcial das máquinas às 15h devido à chuva fraca na região.',
    visivel_convidados: true
  }
];

export const MOCK_MEDICOES: MedicaoItem[] = [
  {
    id: 'med-6',
    obra_id: 'obra-001',
    numero_medicao: 6,
    data_medicao: '2024-08-20',
    periodo_referencia: '01/08/2024 a 15/08/2024',
    periodo_inicio: '2024-08-01',
    periodo_fim: '2024-08-15',
    valor_medido: 1245800,
    valor_medicao: 1245800,
    valor_acumulado: 9580000,
    percentual_periodo: 8.3,
    percentual_medido_acumulado: 64.5,
    fornecedor_empreiteiro: 'Pavimentadora Triângulo Ltda',
    servico_executado: 'Imprimação asfáltica e assentamento de meio-fio extrusado',
    status: 'aprovado',
    resumo_atividades: 'Início da imprimação asfáltica e assentamento de meio-fio extrusado na Avenida Principal.',
    link_relatorio_pdf: '#',
    visivel_convidados: true
  },
  {
    id: 'med-7',
    obra_id: 'obra-001',
    numero_medicao: 7,
    data_medicao: '2024-08-27',
    periodo_referencia: '16/08/2024 a 26/08/2024',
    periodo_inicio: '2024-08-16',
    periodo_fim: '2024-08-26',
    valor_medido: 980000,
    valor_medicao: 980000,
    valor_acumulado: 10560000,
    percentual_periodo: 6.6,
    percentual_medido_acumulado: 71.1,
    fornecedor_empreiteiro: 'Construtora Drenar S/A',
    servico_executado: 'Lançamento de camada BGS e poços de visita (PV)',
    status: 'rascunho',
    resumo_atividades: 'Lançamento de camada BGS de sub-base e montagem de poços de visita (PV) na drenagem.',
    visivel_convidados: false
  }
];

export const MOCK_FOTOS: FotoObra[] = [
  {
    id: 'ft-1',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=800',
    titulo: 'Vista Aérea da Alameda Principal - Pavimentação',
    data: '2024-08-24',
    data_registro: '2024-08-24',
    autor_nome: 'Eng. Rennan Spechotto',
    categoria: 'pavimentacao',
    descricao: 'Aplicação do CBUQ concluída na extensão de 800m.',
    etapa_relacionada: 'Sub-base e Pavimentação Asfáltica',
    visivel_convidados: true
  },
  {
    id: 'ft-2',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    titulo: 'Assentamento de Tubulações de Drenagem',
    data: '2024-08-22',
    data_registro: '2024-08-22',
    autor_nome: 'Técnico de Obras',
    categoria: 'drenagem',
    descricao: 'Tubos PA-1 DN 800mm instalados com berço de areia.',
    etapa_relacionada: 'Drenagem e Galerias Pluviais',
    visivel_convidados: true
  },
  {
    id: 'ft-3',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
    titulo: 'Obras de Estrutura da Portaria Social',
    data: '2024-08-18',
    data_registro: '2024-08-18',
    autor_nome: 'Eng. Rennan Spechotto',
    categoria: 'portaria',
    descricao: 'Concretagem dos pilares principais da guarita.',
    etapa_relacionada: 'Portaria, Muros e Paisagismo',
    visivel_convidados: true
  },
  {
    id: 'ft-4',
    obra_id: 'obra-001',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    titulo: 'Panorama Geral da Quadra B',
    data: '2024-08-10',
    data_registro: '2024-08-10',
    autor_nome: 'Topógrafo',
    categoria: 'geral',
    descricao: 'Demarcação topográfica dos lotes residenciais.',
    etapa_relacionada: 'Serviços Preliminares',
    visivel_convidados: true
  }
];

export const MOCK_DOCUMENTOS: DocumentoObra[] = [
  {
    id: 'doc-1',
    obra_id: 'obra-001',
    nome: 'Projeto Urbanístico Aprovado - Plantas e Perfis.pdf',
    titulo: 'Projeto Urbanístico Aprovado - Plantas e Perfis',
    categoria: 'projetos',
    url: '#',
    data_upload: '2024-02-15',
    data_emissao: '2024-02-10',
    tamanho: '18.4 MB',
    tamanho_bytes: 19293798,
    tipo_extensao: 'pdf',
    codigo_revisao: 'R-04 (Final)',
    responsavel_tecnico: 'Arq. Mariana Mendes',
    visivel_convidados: true
  },
  {
    id: 'doc-2',
    obra_id: 'obra-001',
    nome: 'Licença de Instalação Ambiental (LI) nº 4022/2024.pdf',
    titulo: 'Licença de Instalação Ambiental (LI) nº 4022/2024',
    categoria: 'licencas',
    url: '#',
    data_upload: '2024-01-20',
    data_emissao: '2024-01-15',
    tamanho: '4.2 MB',
    tamanho_bytes: 4404019,
    tipo_extensao: 'pdf',
    codigo_revisao: 'Vigente até 2026',
    responsavel_tecnico: 'Eng. Ambiental Lucas Garcia',
    visivel_convidados: true
  },
  {
    id: 'doc-3',
    obra_id: 'obra-001',
    nome: 'Projeto Executivo de Drenagem e Manejo Pluvial.dwg',
    titulo: 'Projeto Executivo de Drenagem e Manejo Pluvial',
    categoria: 'projetos',
    url: '#',
    data_upload: '2024-03-05',
    data_emissao: '2024-03-01',
    tamanho: '28.1 MB',
    tamanho_bytes: 29464371,
    tipo_extensao: 'dwg',
    codigo_revisao: 'R-02',
    responsavel_tecnico: 'Eng. Rennan Spechotto',
    visivel_convidados: false
  },
  {
    id: 'doc-4',
    obra_id: 'obra-001',
    nome: 'Alvará de Construção e Abertura de Vias - Pref. Mirassol.pdf',
    titulo: 'Alvará de Construção e Abertura de Vias - Pref. Mirassol',
    categoria: 'licencas',
    url: '#',
    data_upload: '2024-02-28',
    data_emissao: '2024-02-25',
    tamanho: '2.8 MB',
    tamanho_bytes: 2936012,
    tipo_extensao: 'pdf',
    codigo_revisao: 'Oficial nº 118/24',
    responsavel_tecnico: 'Pref. Municipal de Mirassol',
    visivel_convidados: true
  }
];

export const MOCK_VIABILIDADE: ViabilidadeEstudo = {
  id: 'viab-1',
  obra_id: 'obra-001',
  area_total: 85000,
  quantidade_lotes: 186,
  vgv_bruto: 39221779,
  vgv_estimado: 39221779,
  vgv_liquido: 35299600,
  custo_terreno: 8000000,
  custo_obras_infra: 14850000,
  custo_obras_estimado: 14850000,
  custo_projetos_licencas: 1200000,
  custo_marketing_admin: 1500000,
  comissoes_vendas: 2353300,
  impostos_receita: 1568870,
  lucro_estimado: 9827430,
  lucro_liquido_projetado: 9827430,
  margem_liquida_percentual: 25.1,
  roi_estimado: 38.4,
  roi_percentual: 38.4,
  tir_anual_percentual: 29.8,
  ponto_equilibrio_meses: 14,
  ponto_equilibrio_lotes: 78,
  prazo_meses: 24
};

export const MOCK_LOTES: Lote[] = [
  { id: 'lt-01', obra_id: 'obra-001', quadra: 'A', numero: '01', area_m2: 360, frente_m: 12, fundo_m: 30, valor_m2: 450, valor_total: 162000, status: 'vendido', topografia: 'Esquina', cliente_nome: 'Dr. Roberto Silveira' },
  { id: 'lt-02', obra_id: 'obra-001', quadra: 'A', numero: '02', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'disponivel', topografia: 'Plano' },
  { id: 'lt-03', obra_id: 'obra-001', quadra: 'A', numero: '03', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'reservado', topografia: 'Plano', corretor_nome: 'Marcos Vinicius' },
  { id: 'lt-04', obra_id: 'obra-001', quadra: 'A', numero: '04', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'disponivel', topografia: 'Plano' },
  { id: 'lt-05', obra_id: 'obra-001', quadra: 'B', numero: '14', area_m2: 320, frente_m: 10.6, fundo_m: 30.2, valor_m2: 440, valor_total: 140800, status: 'vendido', topografia: 'Plano', cliente_nome: 'Luciana Ferreira' },
  { id: 'lt-06', obra_id: 'obra-001', quadra: 'B', numero: '15', area_m2: 350, frente_m: 11.5, fundo_m: 30.4, valor_m2: 440, valor_total: 154000, status: 'disponivel', topografia: 'Aclive Suave' },
  { id: 'lt-07', obra_id: 'obra-001', quadra: 'C', numero: '01', area_m2: 410, frente_m: 14, fundo_m: 29.3, valor_m2: 460, valor_total: 188600, status: 'disponivel', topografia: 'Esquina' },
  { id: 'lt-08', obra_id: 'obra-001', quadra: 'C', numero: '02', area_m2: 300, frente_m: 10, fundo_m: 30, valor_m2: 430, valor_total: 129000, status: 'disponivel', topografia: 'Plano' }
];

export const MOCK_CONVITES: Convite[] = [
  {
    id: 'conv-1',
    obra_id: 'obra-001',
    obraId: 'obra-001',
    obraNome: 'Residencial Reserva dos Ipês',
    email: 'carlos.investor@gmail.com',
    nome: 'Carlos Eduardo Silva',
    telefone: '(17) 99123-4567',
    role: 'PROPRIETARIO_INVESTIDOR',
    ativo: true,
    data_criacao: '2024-03-10',
    dataCriacao: '2024-03-10',
    link_acesso: 'https://meurbanismo.app/?invite=conv-1',
    linkAcceso: 'https://meurbanismo.app/?invite=conv-1',
    status: 'COMPLETO',
    statusCadastro: 'COMPLETO'
  },
  {
    id: 'conv-2',
    obra_id: 'obra-001',
    obraId: 'obra-001',
    obraNome: 'Residencial Reserva dos Ipês',
    email: 'roberto.silveira@adv.br',
    nome: 'Dr. Roberto Silveira',
    telefone: '(17) 98877-6655',
    role: 'CLIENTE_COMPRADOR',
    quadraLote: 'Quadra A - Lote 01',
    ativo: true,
    data_criacao: '2024-04-02',
    dataCriacao: '2024-04-02',
    link_acesso: 'https://meurbanismo.app/?invite=conv-2',
    linkAcceso: 'https://meurbanismo.app/?invite=conv-2',
    status: 'COMPLETO',
    statusCadastro: 'COMPLETO'
  },
  {
    id: 'conv-3',
    obra_id: 'obra-001',
    obraId: 'obra-001',
    obraNome: 'Residencial Reserva dos Ipês',
    email: 'fernanda.corretora@remax.com',
    nome: 'Fernanda Lima',
    telefone: '(17) 99654-3210',
    role: 'CORRETOR',
    ativo: true,
    data_criacao: '2024-05-15',
    dataCriacao: '2024-05-15',
    link_acesso: 'https://meurbanismo.app/?invite=conv-3',
    linkAcceso: 'https://meurbanismo.app/?invite=conv-3',
    status: 'PENDENTE',
    statusCadastro: 'PENDENTE'
  }
];