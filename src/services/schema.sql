-- ==============================================================================
-- SCHEMA SUPABASE: meUrbanismo v2
-- Spechotto Assessoria & Construção
-- ==============================================================================

-- 1. CRIAÇÃO DOS BUCKETS DE STORAGE
-- Buckets: obra_arquivos, fotos_obra, medicoes, orcamentos, cronograma
insert into storage.buckets (id, name, public)
values 
  ('obra_arquivos', 'obra_arquivos', true),
  ('fotos_obra', 'fotos_obra', true),
  ('medicoes', 'medicoes', false),
  ('orcamentos', 'orcamentos', false),
  ('cronograma', 'cronograma', false)
on conflict (id) do nothing;

-- 2. TABELA DE EMPRESAS
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  logo_url text,
  responsavel_tecnico text,
  crea_cau text,
  telefone text,
  email text,
  endereco text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE PERFIS DE USUÁRIOS (RBAC)
create table if not exists public.perfis (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  nome text not null,
  role text not null check (role in ('ADMINISTRADOR', 'PROPRIETARIO_INVESTIDOR', 'CORRETOR', 'CLIENTE_COMPRADOR')),
  avatar_url text,
  telefone text,
  empresa_id uuid references public.empresas(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABELA DE OBRAS / LOTEAMENTOS
create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  nome text not null,
  tipo text not null default 'Loteamento Fechado',
  cidade text not null,
  uf text not null default 'SP',
  status text not null default 'Em Andamento',
  data_inicio date not null,
  data_previsao date not null,
  percentual_concluido numeric(5,2) default 0,
  area_total_m2 numeric(12,2) default 0,
  total_lotes integer default 0,
  lotes_disponiveis integer default 0,
  lotes_reservados integer default 0,
  lotes_vendidos integer default 0,
  vgv_total numeric(15,2) default 0,
  custo_orcado numeric(15,2) default 0,
  custo_realizado numeric(15,2) default 0,
  imagem_capa text,
  endereco_completo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABELA DE ORÇAMENTOS
create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  codigo_sinapi text,
  categoria text not null,
  descricao text not null,
  unidade text not null,
  quantidade numeric(12,2) not null,
  valor_unitario numeric(12,2) not null,
  valor_total numeric(15,2) not null,
  percentual_executado numeric(5,2) default 0,
  valor_executado numeric(15,2) default 0,
  data_atualizacao timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABELA DE CRONOGRAMA FÍSICO-FINANCEIRO
create table if not exists public.cronograma (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  mes_ano text not null,
  mes_label text not null,
  percentual_previsto_mes numeric(5,2) default 0,
  percentual_realizado_mes numeric(5,2) default 0,
  percentual_previsto_acumulado numeric(5,2) default 0,
  percentual_realizado_acumulado numeric(5,2) default 0,
  valor_previsto_mes numeric(15,2) default 0,
  valor_realizado_mes numeric(15,2) default 0,
  valor_previsto_acumulado numeric(15,2) default 0,
  valor_realizado_acumulado numeric(15,2) default 0,
  status text not null default 'Futuro',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABELA DE DIÁRIO DE OBRA
create table if not exists public.diario_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  data date not null default current_date,
  clima_manha text not null default 'Ensolarado',
  clima_tarde text not null default 'Ensolarado',
  condicao_solo text not null default 'Praticável',
  efetivo_proprio integer default 0,
  efetivo_terceirizado integer default 0,
  equipamentos_ativos text[],
  atividades_realizadas text not null,
  ocorrencias text,
  responsavel_nome text not null,
  fotos_urls text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TABELA DE MEDIÇÕES
create table if not exists public.medicoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  numero_medicao integer not null,
  periodo_inicio date not null,
  periodo_fim date not null,
  fornecedor_empreiteiro text not null,
  servico_executado text not null,
  valor_medicao numeric(15,2) not null,
  valor_acumulado numeric(15,2) not null,
  percentual_medido_periodo numeric(5,2) default 0,
  percentual_medido_acumulado numeric(5,2) default 0,
  status text not null default 'Em Análise',
  aprovado_por text,
  data_aprovacao timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TABELA DE FOTOS DA OBRA
create table if not exists public.fotos_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  url text not null,
  titulo text not null,
  descricao text,
  categoria text not null default 'Evolução Geral',
  data_registro date not null default current_date,
  visivel_convidados boolean default false, -- Flag essencial
  autor_nome text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. TABELA DE DOCUMENTOS E PROJETOS
create table if not exists public.obra_arquivos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  titulo text not null,
  categoria text not null default 'Urbanístico',
  codigo_revisao text default 'R00',
  data_emissao date default current_date,
  tamanho_bytes bigint default 0,
  tipo_extensao text not null default 'PDF',
  arquivo_url text not null,
  visivel_convidados boolean default false, -- Flag toggle 🌐 vs 🔒
  responsavel_tecnico text not null,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. TABELA DE VIABILIDADE FINANCEIRA
create table if not exists public.viabilidade (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade unique,
  vgv_bruto numeric(15,2) not null,
  comissoes_vendas numeric(15,2) default 0,
  impostos_receita numeric(15,2) default 0,
  vgv_liquido numeric(15,2) not null,
  custo_terreno numeric(15,2) default 0,
  custo_obras_infra numeric(15,2) default 0,
  custo_projetos_licencas numeric(15,2) default 0,
  custo_marketing_admin numeric(15,2) default 0,
  custo_total numeric(15,2) not null,
  lucro_liquido_projetado numeric(15,2) not null,
  margem_liquida_percentual numeric(5,2) default 0,
  roi_percentual numeric(5,2) default 0,
  tir_anual_percentual numeric(5,2) default 0,
  prazo_meses integer default 24,
  ponto_equilibrio_meses integer default 8,
  ponto_equilibrio_lotes integer default 45,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. TABELA DE LOTES (MAPA DE DISPONIBILIDADE)
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  quadra text not null,
  numero text not null,
  area_m2 numeric(8,2) not null,
  frente_m numeric(6,2),
  fundo_m numeric(6,2),
  valor_m2 numeric(10,2) not null,
  valor_total numeric(12,2) not null,
  status text not null default 'Disponível' check (status in ('Disponível', 'Reservado', 'Vendido', 'Bloqueado')),
  topografia text default 'Plano',
  cliente_nome text,
  corretor_nome text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. TABELA DE CONVITES
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  role text not null check (role in ('ADMINISTRADOR', 'PROPRIETARIO_INVESTIDOR', 'CORRETOR', 'CLIENTE_COMPRADOR')),
  token text not null unique,
  status text not null default 'Pendente',
  link_acesso text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expira_em timestamp with time zone not null
);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.empresas enable row level security;
alter table public.perfis enable row level security;
alter table public.obras enable row level security;
alter table public.orcamentos enable row level security;
alter table public.cronograma enable row level security;
alter table public.diario_obra enable row level security;
alter table public.medicoes enable row level security;
alter table public.fotos_obra enable row level security;
alter table public.obra_arquivos enable row level security;
alter table public.viabilidade enable row level security;
alter table public.lotes enable row level security;
alter table public.convites enable row level security;

-- POLÍTICAS PARA ADMIN (Acesso total)
create policy "Admin total perfis" on public.perfis for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

create policy "Admin total empresas" on public.empresas for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

create policy "Admin total obras" on public.obras for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

create policy "Admin total orcamentos" on public.orcamentos for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

create policy "Admin total cronograma" on public.cronograma for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

create policy "Admin total viabilidade" on public.viabilidade for all using (
  auth.jwt() ->> 'email' = 'rennan.spechotto@gmail.com' or exists (
    select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
  )
);

-- POLÍTICAS PARA PROPRIETÁRIO / INVESTIDOR (Leitura de orçamento, cronograma, viabilidade, fotos, docs)
create policy "Proprietario leitura orcamentos" on public.orcamentos for select using (
  exists (select 1 from public.perfis where id = auth.uid() and role = 'PROPRIETARIO_INVESTIDOR')
);

create policy "Proprietario leitura viabilidade" on public.viabilidade for select using (
  exists (select 1 from public.perfis where id = auth.uid() and role = 'PROPRIETARIO_INVESTIDOR')
);

-- POLÍTICAS DE FOTOS E DOCUMENTOS PÚBLICOS / CONVIDADOS
create policy "Fotos visiveis a convidados" on public.fotos_obra for select using (
  visivel_convidados = true or exists (
    select 1 from public.perfis where id = auth.uid() and role in ('ADMINISTRADOR', 'PROPRIETARIO_INVESTIDOR')
  )
);

create policy "Documentos visiveis a convidados" on public.obra_arquivos for select using (
  visivel_convidados = true or exists (
    select 1 from public.perfis where id = auth.uid() and role in ('ADMINISTRADOR', 'PROPRIETARIO_INVESTIDOR')
  )
);
