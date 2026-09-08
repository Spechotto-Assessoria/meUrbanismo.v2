-- ==============================================================================
-- SEED DE DADOS DE EXEMPLO: meUrbanismo
--
-- Popula o banco com os mesmos dados de demonstração que antes viviam em
-- src/services/mockData.ts (localStorage), agora como registros reais nas
-- tabelas do Postgres — úteis para testar o app logo após aplicar o RLS.
--
-- COMO APLICAR:
--   1. Rode PRIMEIRO o src/services/schema.sql (se ainda não rodou).
--   2. Cole todo o conteúdo deste arquivo no SQL Editor do Supabase e clique
--      em "Run".
--
-- Este script é SEGURO PARA RODAR MAIS DE UMA VEZ: cada bloco verifica se o
-- registro já existe (por CNPJ / nome da obra) antes de inserir, então não
-- duplica dados em execuções repetidas.
--
-- IMPORTANTE SOBRE CONVITES: os convites abaixo usam e-mails de exemplo
-- (carlos.investor@gmail.com, fernanda.corretora@remax.com etc.). Eles só
-- passam a valer de verdade quando uma pessoa se cadastra no app usando
-- EXATAMENTE esse e-mail — é a função has_obra_access() no schema.sql que
-- faz essa checagem em tempo real. Substitua pelos e-mails reais dos seus
-- clientes/corretores/investidores antes ou depois de rodar o seed.
-- ==============================================================================

do $$
declare
  v_emp1_id uuid;
  v_emp2_id uuid;
  v_obra1_id uuid;
  v_obra2_id uuid;
  v_etapa_terraplanagem text := 'Terraplanagem e Corte/Aterro';
  v_etapa_drenagem text := 'Drenagem e Galerias Pluviais';
  v_etapa_pavimentacao text := 'Sub-base e Pavimentação Asfáltica (CBUQ)';
  v_etapa_agua text := 'Redes de Água e Esgoto Sanitário';
  v_etapa_eletrica text := 'Rede Elétrica e Iluminação LED';
  v_etapa_portaria text := 'Portaria, Muros e Paisagismo';
begin

  -- ------------------------------------------------------------------------
  -- EMPRESAS
  -- ------------------------------------------------------------------------
  select id into v_emp1_id from public.empresas where cnpj = '12.345.678/0001-90';
  if v_emp1_id is null then
    insert into public.empresas (nome, cnpj, email, telefone, responsavel_tecnico, crea_cau)
    values ('Conecta Urbanismo', '12.345.678/0001-90', 'contato@conectaurbanismo.com.br', '(17) 3211-9000', 'Eng. Rennan Spechotto', 'CREA-SP 5069248190')
    returning id into v_emp1_id;
  end if;

  select id into v_emp2_id from public.empresas where cnpj = '98.765.432/0001-10';
  if v_emp2_id is null then
    insert into public.empresas (nome, cnpj, email, telefone)
    values ('Linkage Empreendimentos', '98.765.432/0001-10', 'contato@linkage.com.br', '(17) 3222-4400')
    returning id into v_emp2_id;
  end if;

  -- ------------------------------------------------------------------------
  -- OBRAS
  -- ------------------------------------------------------------------------
  select id into v_obra1_id from public.obras where nome = 'Residencial Reserva dos Ipês' and empresa_id = v_emp1_id;
  if v_obra1_id is null then
    insert into public.obras (
      empresa_id, nome, tipo, cidade, uf, status, data_inicio, data_previsao,
      percentual_concluido, area_total_m2, total_lotes, lotes_disponiveis, lotes_vendidos,
      valor_vgv, custo_orcado, custo_realizado, foto_capa
    ) values (
      v_emp1_id, 'Residencial Reserva dos Ipês', 'Loteamento Fechado', 'Mirassol', 'SP', 'Em Andamento',
      '2024-03-01', '2025-12-20',
      64.5, 85000, 186, 58, 128,
      39221779, 14850000, 9580000,
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
    ) returning id into v_obra1_id;
  end if;

  select id into v_obra2_id from public.obras where nome = 'Villa Bella Urban Park' and empresa_id = v_emp2_id;
  if v_obra2_id is null then
    insert into public.obras (
      empresa_id, nome, tipo, cidade, uf, status, data_inicio, data_previsao,
      percentual_concluido, area_total_m2, total_lotes, lotes_disponiveis, lotes_vendidos,
      valor_vgv, custo_orcado, custo_realizado, foto_capa
    ) values (
      v_emp2_id, 'Villa Bella Urban Park', 'Loteamento Aberto', 'São José do Rio Preto', 'SP', 'Planejamento',
      '2024-08-01', '2026-06-30',
      15.0, 120000, 240, 195, 45,
      54000000, 21000000, 3150000,
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
    ) returning id into v_obra2_id;
  end if;

  -- ------------------------------------------------------------------------
  -- ORÇAMENTO (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.orcamentos where obra_id = v_obra1_id) then
    insert into public.orcamentos (obra_id, macro_etapa_nome, codigo_sinapi, descricao, unidade, quantidade, valor_unitario, valor_total, valor_executado, percentual_executado) values
    (v_obra1_id, v_etapa_terraplanagem, '74128/001', 'Escavação e carga de material de 1ª categoria com escavadeira hidráulica', 'm³', 45000, 14.50, 652500, 639450, 98),
    (v_obra1_id, v_etapa_drenagem, '93402', 'Tubo de concreto armado para drenagem PA-1 DN 800mm', 'm', 1800, 285.00, 513000, 436050, 85),
    (v_obra1_id, v_etapa_pavimentacao, '96384', 'Execução de pavimento com CBUQ espessura 4,0cm', 'm²', 32000, 68.00, 2176000, 1131520, 52),
    (v_obra1_id, v_etapa_agua, '98412', 'Rede distribuidora de água em tubo PVC DEFOFO DN 100mm', 'm', 4200, 92.00, 386400, 270480, 70),
    (v_obra1_id, v_etapa_eletrica, '101200', 'Poste de concreto duplo T 11m / 300daN com luminária LED 100W', 'un', 140, 1850.00, 259000, 77700, 30),
    (v_obra1_id, v_etapa_portaria, '102980', 'Muro periférico em bloco estrutural H=2,80m com reboco e pintura', 'm', 1600, 320.00, 512000, 76800, 15);
  end if;

  -- ------------------------------------------------------------------------
  -- CRONOGRAMA FÍSICO-FINANCEIRO (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.cronograma where obra_id = v_obra1_id) then
    insert into public.cronograma (obra_id, mes_ano, mes_label, percentual_previsto_mes, percentual_realizado_mes, percentual_previsto_acumulado, percentual_realizado_acumulado, valor_previsto_mes, valor_realizado_mes, valor_previsto_acumulado, valor_realizado_acumulado, status) values
    (v_obra1_id, '2024-03', 'Mar/24', 5.0, 5.5, 5.0, 5.5, 742500, 816750, 742500, 816750, 'concluido'),
    (v_obra1_id, '2024-04', 'Abr/24', 8.0, 8.2, 13.0, 13.7, 1188000, 1217700, 1930500, 2034450, 'concluido'),
    (v_obra1_id, '2024-05', 'Mai/24', 10.0, 9.8, 23.0, 23.5, 1485000, 1455300, 3415500, 3489750, 'concluido'),
    (v_obra1_id, '2024-06', 'Jun/24', 12.0, 12.0, 35.0, 35.5, 1782000, 1782000, 5197500, 5271750, 'concluido'),
    (v_obra1_id, '2024-07', 'Jul/24', 14.0, 13.8, 49.0, 49.3, 2079000, 2049300, 7276500, 7321050, 'concluido'),
    (v_obra1_id, '2024-08', 'Ago/24', 15.0, 15.2, 64.0, 64.5, 2227500, 2258950, 9504000, 9580000, 'em_andamento'),
    (v_obra1_id, '2024-09', 'Set/24', 12.0, 0, 76.0, 64.5, 1782000, 0, 11286000, 9580000, 'planejado'),
    (v_obra1_id, '2024-10', 'Out/24', 10.0, 0, 86.0, 64.5, 1485000, 0, 12771000, 9580000, 'planejado'),
    (v_obra1_id, '2024-11', 'Nov/24', 8.0, 0, 94.0, 64.5, 1188000, 0, 13959000, 9580000, 'planejado'),
    (v_obra1_id, '2024-12', 'Dez/24', 6.0, 0, 100.0, 64.5, 891000, 0, 14850000, 9580000, 'planejado');
  end if;

  -- ------------------------------------------------------------------------
  -- DIÁRIO DE OBRA (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.diario_obra where obra_id = v_obra1_id) then
    insert into public.diario_obra (obra_id, data, clima_manha, clima_tarde, condicao_solo, efetivo_proprio, efetivo_terceirizado, equipamentos_ativos, equipes_presentes, atividades_realizadas, ocorrencias, responsavel_nome, visivel_convidados) values
    (v_obra1_id, '2024-08-26', 'Ensolarado', 'Ensolarado', 'Seco e Firme', 12, 26,
      array['Escavadeira H-12', 'Motoniveladora', 'Rolo Compactador'],
      array['Terraplanagem', 'Drenagem', 'Topografia'],
      'Assentamento de tubos de concreto PA-1 na Alameda A. Terraplanagem na Quadra C com nivelamento e compactação do subleito.',
      'Nenhuma ocorrência registrada. Trabalho transcorreu dentro da normalidade.',
      'Eng. Rennan Spechotto', true),
    (v_obra1_id, '2024-08-25', 'Nublado', 'Chuva Leve', 'Úmido', 8, 16,
      array['Caminhão Muck', 'Retroescavadeira'],
      array['Elétrica', 'Muro Periférico'],
      'Abertura de valas para eletrodutos subterrâneos da rede de iluminação. Execução de alvenaria do muro periférico do setor norte.',
      'Paralisação parcial das máquinas às 15h devido à chuva fraca na região.',
      'Eng. Rennan Spechotto', true);
  end if;

  -- ------------------------------------------------------------------------
  -- MEDIÇÕES (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.medicoes where obra_id = v_obra1_id) then
    insert into public.medicoes (obra_id, numero_medicao, periodo_inicio, periodo_fim, fornecedor_empreiteiro, servico_executado, resumo_atividades, valor_medicao, valor_acumulado, percentual_medido_periodo, percentual_medido_acumulado, status, visivel_convidados) values
    (v_obra1_id, 6, '2024-08-01', '2024-08-15', 'Pavimentadora Triângulo Ltda', 'Imprimação asfáltica e assentamento de meio-fio extrusado',
      'Início da imprimação asfáltica e assentamento de meio-fio extrusado na Avenida Principal.', 1245800, 9580000, 8.3, 64.5, 'aprovado', true),
    (v_obra1_id, 7, '2024-08-16', '2024-08-26', 'Construtora Drenar S/A', 'Lançamento de camada BGS e poços de visita (PV)',
      'Lançamento de camada BGS de sub-base e montagem de poços de visita (PV) na drenagem.', 980000, 10560000, 6.6, 71.1, 'rascunho', false);
  end if;

  -- ------------------------------------------------------------------------
  -- FOTOS DA OBRA (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.fotos_obra where obra_id = v_obra1_id) then
    insert into public.fotos_obra (obra_id, url, titulo, descricao, categoria, etapa_relacionada, data_registro, autor_nome, visivel_convidados) values
    (v_obra1_id, 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=800', 'Vista Aérea da Alameda Principal - Pavimentação', 'Aplicação do CBUQ concluída na extensão de 800m.', 'pavimentacao', v_etapa_pavimentacao, '2024-08-24', 'Eng. Rennan Spechotto', true),
    (v_obra1_id, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', 'Assentamento de Tubulações de Drenagem', 'Tubos PA-1 DN 800mm instalados com berço de areia.', 'drenagem', v_etapa_drenagem, '2024-08-22', 'Técnico de Obras', true),
    (v_obra1_id, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', 'Obras de Estrutura da Portaria Social', 'Concretagem dos pilares principais da guarita.', 'portaria', v_etapa_portaria, '2024-08-18', 'Eng. Rennan Spechotto', true),
    (v_obra1_id, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Panorama Geral da Quadra B', 'Demarcação topográfica dos lotes residenciais.', 'geral', 'Serviços Preliminares', '2024-08-10', 'Topógrafo', true);
  end if;

  -- ------------------------------------------------------------------------
  -- DOCUMENTOS (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.obra_arquivos where obra_id = v_obra1_id) then
    insert into public.obra_arquivos (obra_id, titulo, categoria, codigo_revisao, data_emissao, tamanho_bytes, tipo_extensao, arquivo_url, responsavel_tecnico, visivel_convidados) values
    (v_obra1_id, 'Projeto Urbanístico Aprovado - Plantas e Perfis', 'projetos', 'R-04 (Final)', '2024-02-10', 19293798, 'pdf', '#', 'Arq. Mariana Mendes', true),
    (v_obra1_id, 'Licença de Instalação Ambiental (LI) nº 4022/2024', 'licencas', 'Vigente até 2026', '2024-01-15', 4404019, 'pdf', '#', 'Eng. Ambiental Lucas Garcia', true),
    (v_obra1_id, 'Projeto Executivo de Drenagem e Manejo Pluvial', 'projetos', 'R-02', '2024-03-01', 29464371, 'dwg', '#', 'Eng. Rennan Spechotto', false),
    (v_obra1_id, 'Alvará de Construção e Abertura de Vias - Pref. Mirassol', 'licencas', 'Oficial nº 118/24', '2024-02-25', 2936012, 'pdf', '#', 'Pref. Municipal de Mirassol', true);
  end if;

  -- ------------------------------------------------------------------------
  -- VIABILIDADE (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.viabilidade where obra_id = v_obra1_id) then
    insert into public.viabilidade (
      obra_id, area_total, quantidade_lotes, vgv_bruto, comissoes_vendas, impostos_receita, vgv_liquido,
      custo_terreno, custo_obras_infra, custo_projetos_licencas, custo_marketing_admin, custo_total,
      lucro_liquido_projetado, margem_liquida_percentual, roi_percentual, tir_anual_percentual,
      prazo_meses, ponto_equilibrio_meses, ponto_equilibrio_lotes
    ) values (
      v_obra1_id, 85000, 186, 39221779, 2353300, 1568870, 35299600,
      8000000, 14850000, 1200000, 1500000, 25550000,
      9827430, 25.1, 38.4, 29.8,
      24, 14, 78
    );
  end if;

  -- ------------------------------------------------------------------------
  -- LOTES (obra 1)
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.lotes where obra_id = v_obra1_id) then
    insert into public.lotes (obra_id, quadra, numero, area_m2, frente_m, fundo_m, valor_m2, valor_total, status, topografia, cliente_nome, corretor_nome) values
    (v_obra1_id, 'A', '01', 360, 12, 30, 450, 162000, 'vendido', 'Esquina', 'Dr. Roberto Silveira', null),
    (v_obra1_id, 'A', '02', 300, 10, 30, 430, 129000, 'disponivel', 'Plano', null, null),
    (v_obra1_id, 'A', '03', 300, 10, 30, 430, 129000, 'reservado', 'Plano', null, 'Marcos Vinicius'),
    (v_obra1_id, 'A', '04', 300, 10, 30, 430, 129000, 'disponivel', 'Plano', null, null),
    (v_obra1_id, 'B', '14', 320, 10.6, 30.2, 440, 140800, 'vendido', 'Plano', 'Luciana Ferreira', null),
    (v_obra1_id, 'B', '15', 350, 11.5, 30.4, 440, 154000, 'disponivel', 'Aclive Suave', null, null),
    (v_obra1_id, 'C', '01', 410, 14, 29.3, 460, 188600, 'disponivel', 'Esquina', null, null),
    (v_obra1_id, 'C', '02', 300, 10, 30, 430, 129000, 'disponivel', 'Plano', null, null);
  end if;

  -- ------------------------------------------------------------------------
  -- CONVITES (obra 1) — troque pelos e-mails reais dos seus contatos
  -- ------------------------------------------------------------------------
  if not exists (select 1 from public.convites where obra_id = v_obra1_id) then
    insert into public.convites (obra_id, nome, email, telefone, role, quadra_lote, ativo, status_cadastro, link_acesso) values
    (v_obra1_id, 'Carlos Eduardo Silva', 'carlos.investor@gmail.com', '(17) 99123-4567', 'PROPRIETARIO_INVESTIDOR', null, true, 'PENDENTE', null),
    (v_obra1_id, 'Dr. Roberto Silveira', 'roberto.silveira@adv.br', '(17) 98877-6655', 'CLIENTE_COMPRADOR', 'Quadra A - Lote 01', true, 'PENDENTE', null),
    (v_obra1_id, 'Fernanda Lima', 'fernanda.corretora@remax.com', '(17) 99654-3210', 'CORRETOR', null, true, 'PENDENTE', null);
  end if;

  raise notice 'Seed concluído. Empresa 1: %, Empresa 2: %, Obra 1: %, Obra 2: %', v_emp1_id, v_emp2_id, v_obra1_id, v_obra2_id;
end $$;
