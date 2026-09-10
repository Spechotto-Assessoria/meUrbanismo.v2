-- ==============================================================================
-- SCHEMA SUPABASE: meUrbanismo v3 (RLS real + mascaramento financeiro por papel)
-- Spechotto Assessoria & Construção
--
-- COMO APLICAR:
--   1. Abra o painel do seu projeto em https://supabase.com/dashboard
--   2. Vá em "SQL Editor" → "New query"
--   3. Cole TODO o conteúdo deste arquivo e clique em "Run"
--   4. Este script é IDEMPOTENTE: pode ser executado novamente com segurança
--      a qualquer momento (ex.: após atualizações), sem duplicar dados.
--
-- IMPORTANTE: este script precisa ser rodado com a "service_role" do painel
-- SQL Editor (é o padrão quando você usa o SQL Editor do próprio Supabase).
-- A chave "anon/publishable" usada pelo app NUNCA tem permissão para alterar
-- schema — por isso esta migração deve ser aplicada manualmente uma vez.
-- ==============================================================================

-- 1. BUCKETS DE STORAGE
insert into storage.buckets (id, name, public)
values
  ('obra_arquivos', 'obra_arquivos', true),
  ('fotos_obra', 'fotos_obra', true),
  ('medicoes', 'medicoes', false),
  ('orcamentos', 'orcamentos', false),
  ('cronograma', 'cronograma', false),
  ('logos_empresas', 'logos_empresas', true),
  ('relatorios', 'relatorios', true)
on conflict (id) do nothing;

-- ==============================================================================
-- 2. TABELAS
-- ==============================================================================

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  logo_url text,
  contato text,
  responsavel_tecnico text,
  crea_cau text,
  telefone text,
  email text,
  endereco text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Backfill idempotente: garante a coluna "contato" mesmo em bancos já criados
-- por uma versão anterior deste schema (create table if not exists não adiciona
-- colunas novas em tabelas já existentes).
alter table public.empresas add column if not exists contato text;

create table if not exists public.perfis (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  nome text not null,
  role text not null default 'CLIENTE_COMPRADOR',
  avatar_url text,
  telefone text,
  empresa_id uuid references public.empresas(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  nome text not null,
  tipo text not null default 'Condomínio Horizontal Fechado',
  cidade text not null,
  uf text not null default 'SP',
  status text not null default 'Em Andamento',
  descricao text,
  endereco text,
  data_inicio date,
  data_previsao date,
  percentual_concluido numeric(5,2) default 0,
  area_total_m2 numeric(12,2) default 0,
  area_vendavel_m2 numeric(12,2) default 0,
  metragem_padrao_lote numeric(8,2) default 0,
  total_lotes integer default 0,
  lotes_disponiveis integer default 0,
  lotes_reservados integer default 0,
  lotes_vendidos integer default 0,
  valor_vgv numeric(15,2) default 0,
  custo_orcado numeric(15,2) default 0,
  custo_realizado numeric(15,2) default 0,
  foto_capa text,
  arquivada boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Backfill: bancos já existentes não recebem a coluna pelo CREATE TABLE IF NOT EXISTS.
alter table public.obras add column if not exists arquivada boolean not null default false;
alter table public.obras add column if not exists area_vendavel_m2 numeric(12,2) default 0;
alter table public.obras add column if not exists mapa_masterplan_url text;
alter table public.obras add column if not exists mapa_viewbox text default '0 0 1200 800';
alter table public.obras add column if not exists mapa_img_transform jsonb default '{"scale":100,"offsetX":0,"offsetY":0}'::jsonb;
alter table public.obras alter column tipo set default 'Condomínio Horizontal Fechado';

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  macro_etapa_id text,
  macro_etapa_nome text,
  codigo_sinapi text,
  categoria text,
  descricao text not null,
  unidade text not null,
  quantidade numeric(12,2) not null default 0,
  valor_unitario numeric(12,2) not null default 0,
  valor_total numeric(15,2) not null default 0,
  percentual_executado numeric(5,2) default 0,
  valor_executado numeric(15,2) default 0,
  avanco_manual numeric(5,2),
  visivel_convidados boolean not null default true,
  data_atualizacao timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orcamentos add column if not exists avanco_manual numeric(5,2);
alter table public.orcamentos add column if not exists visivel_convidados boolean not null default true;

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
  status text not null default 'planejado',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Grade físico-financeira: % previsto/realizado por etapa (orcamentos.id) e mês.
create table if not exists public.cronograma_meses (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references public.orcamentos(id) on delete cascade,
  ano_mes date not null,
  percentual_previsto numeric(6,2) not null default 0,
  percentual_realizado numeric(6,2) not null default 0,
  unique (etapa_id, ano_mes)
);

create table if not exists public.diario_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  data date not null default current_date,
  clima_manha text default 'Ensolarado',
  clima_tarde text default 'Ensolarado',
  condicao_solo text default 'Praticável',
  efetivo_proprio integer default 0,
  efetivo_terceirizado integer default 0,
  equipamentos_ativos text[],
  equipes_presentes text[],
  atividades_realizadas text not null,
  ocorrencias text,
  responsavel_nome text not null,
  fotos_urls text[],
  visivel_convidados boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Backfill idempotente: bancos criados antes da aba Acompanhamento podem não ter
-- estas tabelas/colunas mesmo com o restante do schema aplicado.
alter table public.diario_obra add column if not exists clima_manha text default 'Ensolarado';
alter table public.diario_obra add column if not exists clima_tarde text default 'Ensolarado';
alter table public.diario_obra add column if not exists condicao_solo text default 'Praticável';
alter table public.diario_obra add column if not exists efetivo_proprio integer default 0;
alter table public.diario_obra add column if not exists efetivo_terceirizado integer default 0;
alter table public.diario_obra add column if not exists equipamentos_ativos text[];
alter table public.diario_obra add column if not exists equipes_presentes text[];
alter table public.diario_obra add column if not exists fotos_urls text[];
alter table public.diario_obra add column if not exists visivel_convidados boolean default false;

create table if not exists public.medicoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  numero_medicao integer not null,
  periodo_inicio date,
  periodo_fim date,
  fornecedor_empreiteiro text,
  servico_executado text,
  resumo_atividades text,
  valor_medicao numeric(15,2) not null default 0,
  valor_acumulado numeric(15,2) not null default 0,
  percentual_medido_periodo numeric(5,2) default 0,
  percentual_medido_acumulado numeric(5,2) default 0,
  status text not null default 'rascunho',
  link_relatorio_pdf text,
  visivel_convidados boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.fotos_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  url text not null,
  titulo text not null,
  descricao text,
  categoria text default 'Evolução Geral',
  etapa_relacionada text,
  data_registro date not null default current_date,
  visivel_convidados boolean default false,
  autor_nome text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.fotos_obra add column if not exists categoria text default 'Evolução Geral';
alter table public.fotos_obra add column if not exists data_registro date not null default current_date;
alter table public.fotos_obra add column if not exists visivel_convidados boolean default false;
alter table public.fotos_obra add column if not exists autor_nome text;

create table if not exists public.obra_arquivos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  titulo text not null,
  categoria text default 'Urbanístico',
  codigo_revisao text default 'R00',
  data_emissao date default current_date,
  tamanho_bytes bigint default 0,
  tipo_extensao text not null default 'pdf',
  arquivo_url text not null,
  visivel_convidados boolean default false,
  responsavel_tecnico text,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.obra_arquivos add column if not exists arquivado boolean not null default false;

create table if not exists public.relatorios_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null check (tipo in ('orcamento', 'cronograma', 'andamento', 'acompanhamento', 'global')),
  titulo text not null,
  periodo_inicio date,
  periodo_fim date,
  inclui_financeiro boolean not null default false,
  arquivo_url text not null,
  tamanho_bytes bigint default 0,
  gerado_por uuid references auth.users(id),
  gerado_por_nome text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.viabilidade (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade unique,
  area_total numeric(12,2),
  quantidade_lotes integer,
  vgv_bruto numeric(15,2) not null default 0,
  comissoes_vendas numeric(15,2) default 0,
  impostos_receita numeric(15,2) default 0,
  vgv_liquido numeric(15,2) not null default 0,
  custo_terreno numeric(15,2) default 0,
  custo_obras_infra numeric(15,2) default 0,
  custo_projetos_licencas numeric(15,2) default 0,
  custo_marketing_admin numeric(15,2) default 0,
  custo_total numeric(15,2) not null default 0,
  lucro_liquido_projetado numeric(15,2) not null default 0,
  margem_liquida_percentual numeric(5,2) default 0,
  roi_percentual numeric(5,2) default 0,
  tir_anual_percentual numeric(5,2) default 0,
  prazo_meses integer default 24,
  ponto_equilibrio_meses integer default 8,
  ponto_equilibrio_lotes integer default 45,
  premissas jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Backfill: bancos criados antes desta coluna.
alter table public.viabilidade
  add column if not exists premissas jsonb not null default '{}'::jsonb;

-- Estudos de viabilidade INICIAL (pré-obra, N por empresa). NÃO confundir com
-- public.viabilidade, que é 1:1 com obra_id e alimenta a aba financeira da obra.
create table if not exists public.estudos_viabilidade (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  empresa_nome text,
  destinatario text,
  cnpj text,
  localizacao text,
  tipo text not null default 'loteamento',
  status text not null default 'rascunho',
  area_terreno numeric(14,2) not null default 0,
  area_app numeric(14,2) not null default 0,
  pct_viario numeric(6,2) not null default 0,
  pct_verde numeric(6,2) not null default 0,
  pct_institucional numeric(6,2) not null default 0,
  pct_vendavel numeric(6,2) not null default 0,
  lote_medio numeric(10,2) not null default 0,
  custo_m2_privativo numeric(12,2) not null default 0,
  valor_venda_m2 numeric(12,2) not null default 0,
  custo_total numeric(15,2) not null default 0,
  vgv_total numeric(15,2) not null default 0,
  valor_lote numeric(12,2) not null default 0,
  prazo_obra_meses integer not null default 24,
  prazo_vendas_meses integer not null default 36,
  taxa_desconto_aa numeric(6,2) not null default 12,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint estudos_viabilidade_tipo_check check (tipo in ('loteamento', 'condominio')),
  constraint estudos_viabilidade_status_check check (status in ('rascunho', 'enviado', 'aprovado', 'arquivado'))
);

create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  quadra text not null,
  numero text not null,
  area_m2 numeric(8,2) not null default 0,
  frente_m numeric(6,2),
  fundo_m numeric(6,2),
  valor_m2 numeric(10,2) default 0,
  valor_total numeric(12,2) default 0,
  status text not null default 'disponivel',
  topografia text default 'Plano',
  cliente_nome text,
  corretor_nome text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lotes add column if not exists svg_path text;
alter table public.lotes add column if not exists label_x numeric(8,2);
alter table public.lotes add column if not exists label_y numeric(8,2);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid references auth.users on delete set null,
  nome text,
  email text not null,
  telefone text,
  role text not null default 'CLIENTE_COMPRADOR',
  quadra_lote text,
  ativo boolean default true,
  status_cadastro text not null default 'PENDENTE',
  link_acesso text,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migração incremental para bancos já existentes
alter table public.convites add column if not exists user_id uuid references auth.users on delete set null;
alter table public.convites add column if not exists redeemed_at timestamp with time zone;

create unique index if not exists convites_email_obra_unique
  on public.convites (lower(email), obra_id);

-- RLS: convites_self_select permite SELECT onde lower(email) = lower(auth.jwt() ->> 'email')
-- ou user_id = auth.uid(). Se o resgate falhar, confirme que o JWT contém o claim 'email'
-- após login. Em projetos com confirmação de e-mail, a sessão só existe após confirmar.

-- Garante que os valores de "role" aceitos incluam todos os papéis usados no app.
do $$
begin
  alter table public.perfis drop constraint if exists perfis_role_check;
  alter table public.perfis add constraint perfis_role_check
    check (role in ('ADMINISTRADOR','PROPRIETARIO_INVESTIDOR','CORRETOR','CLIENTE_COMPRADOR','GESTOR','ENGENHEIRO','CONSULTOR','INVESTIDOR'));

  alter table public.convites drop constraint if exists convites_role_check;
  alter table public.convites add constraint convites_role_check
    check (role in ('ADMINISTRADOR','PROPRIETARIO_INVESTIDOR','CORRETOR','CLIENTE_COMPRADOR','GESTOR','ENGENHEIRO','CONSULTOR','INVESTIDOR'));

  alter table public.lotes drop constraint if exists lotes_status_check;
  alter table public.lotes add constraint lotes_status_check
    check (status in ('disponivel','reservado','vendido','bloqueado'));
end $$;

-- ==============================================================================
-- 3. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
--
-- IMPORTANTE: usamos funções SECURITY DEFINER em vez de subqueries diretas na
-- própria tabela "perfis" dentro das políticas de RLS de "perfis" para evitar
-- o erro clássico do Postgres "infinite recursion detected in policy for
-- relation perfis" (uma policy de SELECT/ALL em "perfis" que consulta a
-- própria "perfis" recursivamente). As funções abaixo rodam com privilégio
-- elevado (bypassando RLS internamente) apenas para essa checagem pontual,
-- e devolvem um resultado simples (boolean/texto) para as políticas usarem.
-- ==============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'email', '') ilike 'rennan.spechotto@gmail.com'
    or coalesce(auth.jwt() ->> 'email', '') ilike 'rennan_seidl@hotmail.com'
    or exists (
      select 1 from public.perfis where id = auth.uid() and role = 'ADMINISTRADOR'
    );
$$;

create or replace function public.is_master_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') ilike 'rennan.spechotto@gmail.com';
$$;

create or replace function public.can_access_relatorios_for_obra(target_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_obra_access(target_obra_id)
    and (
      public.is_admin()
      or public.role_for_obra(target_obra_id) = 'PROPRIETARIO_INVESTIDOR'
    );
$$;

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.perfis where id = auth.uid();
$$;

-- Papéis que têm permissão de ver valores monetários (orçamento, custos, VGV, TIR/VPL).
-- Legado global: usa perfis.role. Preferir can_view_financials_for_obra(obra_id).
create or replace function public.can_view_financials()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.current_role_name() in ('PROPRIETARIO_INVESTIDOR', 'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'INVESTIDOR');
$$;

-- Papel efetivo do usuário em uma obra específica (fonte: convites.role por obra).
create or replace function public.role_for_obra(target_obra_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin() then 'ADMINISTRADOR'
    else coalesce(
      (
        select c.role from public.convites c
        where c.obra_id = target_obra_id
          and coalesce(c.ativo, true) = true
          and (
            c.user_id = auth.uid()
            or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        limit 1
      ),
      public.current_role_name(),
      'CLIENTE_COMPRADOR'
    )
  end;
$$;

-- Mascaramento financeiro por obra (RBAC real no servidor).
create or replace function public.can_view_financials_for_obra(target_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.role_for_obra(target_obra_id) in (
      'PROPRIETARIO_INVESTIDOR', 'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'INVESTIDOR'
    );
$$;

-- Verifica se o usuário autenticado tem convite ativo vinculado à obra informada.
create or replace function public.has_obra_access(target_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.convites c
      where c.obra_id = target_obra_id
        and coalesce(c.ativo, true) = true
        and (
          c.user_id = auth.uid()
          or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

-- Resgate automático: vincula auth.uid() aos convites pendentes do e-mail autenticado.
create or replace function public.redeem_user_convites()
returns setof public.convites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if v_uid is null or v_email = '' then
    return;
  end if;

  return query
  update public.convites c
  set
    user_id = v_uid,
    status_cadastro = 'COMPLETO',
    redeemed_at = timezone('utc', now())
  where coalesce(c.ativo, true) = true
    and lower(trim(c.email)) = v_email
    and (c.user_id is null or c.user_id = v_uid)
  returning c.*;
end;
$$;

grant execute on function public.redeem_user_convites() to authenticated;

-- ==============================================================================
-- 4. AUTO-PROVISIONAMENTO DE PERFIL NO CADASTRO (auth.users → public.perfis)
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when lower(new.email) in ('rennan.spechotto@gmail.com', 'rennan_seidl@hotmail.com') then 'ADMINISTRADOR'
      else 'CLIENTE_COMPRADOR'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: garante que usuários já existentes em auth.users tenham uma linha em perfis.
insert into public.perfis (id, email, nome, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'nome', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  case
    when lower(u.email) in ('rennan.spechotto@gmail.com', 'rennan_seidl@hotmail.com') then 'ADMINISTRADOR'
    else 'CLIENTE_COMPRADOR'
  end
from auth.users u
on conflict (id) do nothing;

-- ==============================================================================
-- 5. PRIVILÉGIOS DE TABELA (necessários para que o RLS abaixo passe a valer)
--
-- GRANT apenas concede a possibilidade de acesso; quem realmente decide o que
-- cada usuário pode ler/gravar são as POLICIES de RLS da seção seguinte.
-- ==============================================================================

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on
  public.empresas,
  public.perfis,
  public.obras,
  public.orcamentos,
  public.cronograma,
  public.cronograma_meses,
  public.diario_obra,
  public.medicoes,
  public.fotos_obra,
  public.obra_arquivos,
  public.relatorios_obra,
  public.viabilidade,
  public.estudos_viabilidade,
  public.lotes,
  public.convites
to authenticated;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY
-- ==============================================================================

alter table public.empresas enable row level security;
alter table public.perfis enable row level security;
alter table public.obras enable row level security;
alter table public.orcamentos enable row level security;
alter table public.cronograma enable row level security;
alter table public.cronograma_meses enable row level security;
alter table public.diario_obra enable row level security;
alter table public.medicoes enable row level security;
alter table public.fotos_obra enable row level security;
alter table public.obra_arquivos enable row level security;
alter table public.relatorios_obra enable row level security;
alter table public.viabilidade enable row level security;
alter table public.estudos_viabilidade enable row level security;
alter table public.lotes enable row level security;
alter table public.convites enable row level security;

-- PERFIS: admin vê/edita tudo; usuário comum só enxerga o próprio perfil (não pode alterar seu papel).
drop policy if exists "perfis_admin_all" on public.perfis;
create policy "perfis_admin_all" on public.perfis for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "perfis_self_select" on public.perfis;
create policy "perfis_self_select" on public.perfis for select
  using (id = auth.uid());

-- EMPRESAS: escrita exclusiva do administrador. Convidados só leem empresas
-- das obras às quais têm convite (para visualizar a lista, sem editar).
drop policy if exists "empresas_admin_all" on public.empresas;
create policy "empresas_admin_all" on public.empresas for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.can_view_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.obras o
      where o.empresa_id = target_empresa_id
        and public.has_obra_access(o.id)
    );
$$;

drop policy if exists "empresas_convidado_select" on public.empresas;
create policy "empresas_convidado_select" on public.empresas for select
  using (public.can_view_empresa(id));

-- LOGO DAS EMPRESAS (Storage): bucket público "logos_empresas" — leitura liberada
-- para qualquer um (necessário para exibir o logo nas telas das obras), mas só o
-- administrador master pode enviar/substituir/remover arquivos.
drop policy if exists "logos_empresas_admin_write" on storage.objects;
create policy "logos_empresas_admin_write" on storage.objects for all
  using (bucket_id = 'logos_empresas' and public.is_admin())
  with check (bucket_id = 'logos_empresas' and public.is_admin());

drop policy if exists "logos_empresas_public_select" on storage.objects;
create policy "logos_empresas_public_select" on storage.objects for select
  using (bucket_id = 'logos_empresas');

-- CAPA / FOTOS DA OBRA (Storage): bucket público "fotos_obra" — leitura liberada
-- (necessário para exibir a capa nos cards e módulos), escrita só do admin.
drop policy if exists "fotos_obra_admin_write" on storage.objects;
create policy "fotos_obra_admin_write" on storage.objects for all
  using (bucket_id = 'fotos_obra' and public.is_admin())
  with check (bucket_id = 'fotos_obra' and public.is_admin());

drop policy if exists "fotos_obra_public_select" on storage.objects;
create policy "fotos_obra_public_select" on storage.objects for select
  using (bucket_id = 'fotos_obra');

-- DOCUMENTOS DA OBRA (Storage): bucket público "obra_arquivos" — leitura liberada
-- para download/visualização; escrita restrita ao administrador.
drop policy if exists "obra_arquivos_admin_write" on storage.objects;
create policy "obra_arquivos_admin_write" on storage.objects for all
  using (bucket_id = 'obra_arquivos' and public.is_admin())
  with check (bucket_id = 'obra_arquivos' and public.is_admin());

drop policy if exists "obra_arquivos_public_select" on storage.objects;
create policy "obra_arquivos_public_select" on storage.objects for select
  using (bucket_id = 'obra_arquivos');

-- RELATÓRIOS EXECUTIVOS (Storage): bucket público "relatorios"
drop policy if exists "relatorios_admin_write" on storage.objects;
create policy "relatorios_admin_write" on storage.objects for all
  using (bucket_id = 'relatorios' and public.is_admin())
  with check (bucket_id = 'relatorios' and public.is_admin());

drop policy if exists "relatorios_proprietario_insert" on storage.objects;
create policy "relatorios_proprietario_insert" on storage.objects for insert
  with check (
    bucket_id = 'relatorios'
    and exists (
      select 1 from public.obras o
      where o.id::text = split_part(name, '/', 1)
        and public.role_for_obra(o.id) = 'PROPRIETARIO_INVESTIDOR'
        and public.has_obra_access(o.id)
    )
  );

drop policy if exists "relatorios_master_delete" on storage.objects;
create policy "relatorios_master_delete" on storage.objects for delete
  using (bucket_id = 'relatorios' and public.is_master_email());

drop policy if exists "relatorios_public_select" on storage.objects;
create policy "relatorios_public_select" on storage.objects for select
  using (bucket_id = 'relatorios');

-- OBRAS (tabela base): SOMENTE administradores consultam/alteram diretamente.
-- Todo mundo mais deve ler através da view "obras_publicas" (mascara campos
-- financeiros conforme o papel do usuário).
drop policy if exists "obras_admin_all" on public.obras;
create policy "obras_admin_all" on public.obras for all
  using (public.is_admin()) with check (public.is_admin());

-- CONVITES: admin gerencia tudo; o convidado pode ver o próprio convite (para
-- exibir status/obra na tela dele, se necessário).
drop policy if exists "convites_admin_all" on public.convites;
create policy "convites_admin_all" on public.convites for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "convites_self_select" on public.convites;
create policy "convites_self_select" on public.convites for select
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or user_id = auth.uid()
  );

-- ORÇAMENTOS: 100% financeiro. Só admin e papéis com canViewFinancials, e só
-- para obras às quais o usuário tem acesso.
drop policy if exists "orcamentos_admin_all" on public.orcamentos;
create policy "orcamentos_admin_all" on public.orcamentos for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orcamentos_financeiro_select" on public.orcamentos;
create policy "orcamentos_financeiro_select" on public.orcamentos for select
  using (public.can_view_financials_for_obra(obra_id) and public.has_obra_access(obra_id));

-- CRONOGRAMA (tabela base): leitura completa (com valores em R$) restrita a
-- quem pode ver financeiro. Corretor/Cliente devem usar a view "cronograma_publico".
drop policy if exists "cronograma_admin_all" on public.cronograma;
create policy "cronograma_admin_all" on public.cronograma for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cronograma_financeiro_select" on public.cronograma;
create policy "cronograma_financeiro_select" on public.cronograma for select
  using (public.can_view_financials_for_obra(obra_id) and public.has_obra_access(obra_id));

-- CRONOGRAMA_MESES: % por etapa/mês. Admin grava; quem vê financeiro lê na obra.
drop policy if exists "cronograma_meses_admin_all" on public.cronograma_meses;
create policy "cronograma_meses_admin_all" on public.cronograma_meses for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cronograma_meses_financeiro_select" on public.cronograma_meses;
create policy "cronograma_meses_financeiro_select" on public.cronograma_meses for select
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = etapa_id
        and public.has_obra_access(o.obra_id)
        and public.can_view_financials_for_obra(o.obra_id)
    )
  );

-- DIÁRIO DE OBRA: staff interno (financeiro) vê tudo; convidados só o que
-- estiver marcado como público.
drop policy if exists "diario_admin_all" on public.diario_obra;
create policy "diario_admin_all" on public.diario_obra for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "diario_select" on public.diario_obra;
create policy "diario_select" on public.diario_obra for select
  using (
    public.has_obra_access(obra_id)
    and (visivel_convidados = true or public.can_view_financials_for_obra(obra_id))
  );

-- MEDIÇÕES (tabela base, com valores em R$): staff financeiro vê tudo.
-- Corretor/Cliente devem usar a view "medicoes_publicas".
drop policy if exists "medicoes_admin_all" on public.medicoes;
create policy "medicoes_admin_all" on public.medicoes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "medicoes_financeiro_select" on public.medicoes;
create policy "medicoes_financeiro_select" on public.medicoes for select
  using (public.can_view_financials_for_obra(obra_id) and public.has_obra_access(obra_id));

-- FOTOS DA OBRA
drop policy if exists "fotos_admin_all" on public.fotos_obra;
create policy "fotos_admin_all" on public.fotos_obra for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fotos_select" on public.fotos_obra;
create policy "fotos_select" on public.fotos_obra for select
  using (
    public.has_obra_access(obra_id)
    and (visivel_convidados = true or public.can_view_financials_for_obra(obra_id))
  );

-- DOCUMENTOS / ARQUIVOS DA OBRA
drop policy if exists "arquivos_admin_all" on public.obra_arquivos;
create policy "arquivos_admin_all" on public.obra_arquivos for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "arquivos_select" on public.obra_arquivos;
create policy "arquivos_select" on public.obra_arquivos for select
  using (
    public.has_obra_access(obra_id)
    and (not arquivado or public.can_view_financials_for_obra(obra_id))
    and (visivel_convidados = true or public.can_view_financials_for_obra(obra_id))
  );

-- RELATÓRIOS EXECUTIVOS (PDF arquivado por obra)
drop policy if exists "relatorios_admin_all" on public.relatorios_obra;
create policy "relatorios_admin_all" on public.relatorios_obra for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "relatorios_select" on public.relatorios_obra;
create policy "relatorios_select" on public.relatorios_obra for select
  using (public.can_access_relatorios_for_obra(obra_id));

drop policy if exists "relatorios_proprietario_insert" on public.relatorios_obra;
create policy "relatorios_proprietario_insert" on public.relatorios_obra for insert
  with check (
    public.role_for_obra(obra_id) = 'PROPRIETARIO_INVESTIDOR'
    and public.has_obra_access(obra_id)
  );

drop policy if exists "relatorios_master_delete" on public.relatorios_obra;
create policy "relatorios_master_delete" on public.relatorios_obra for delete
  using (public.is_master_email());

-- VIABILIDADE: 100% financeiro/estratégico. Apenas admin e financeiro.
drop policy if exists "viabilidade_admin_all" on public.viabilidade;
create policy "viabilidade_admin_all" on public.viabilidade for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "viabilidade_financeiro_select" on public.viabilidade;
create policy "viabilidade_financeiro_select" on public.viabilidade for select
  using (public.can_view_financials_for_obra(obra_id) and public.has_obra_access(obra_id));

-- ESTUDOS DE VIABILIDADE INICIAL: 100% financeiro, pré-obra, só admin.
drop policy if exists "estudos_viabilidade_admin_all" on public.estudos_viabilidade;
create policy "estudos_viabilidade_admin_all" on public.estudos_viabilidade for all
  using (public.is_admin()) with check (public.is_admin());

-- LOTES: preço de venda do lote é informação comercial (não "financeiro interno"),
-- visível a todos com acesso à obra — corretores e clientes precisam ver preços
-- para vender/acompanhar a compra. Apenas admin e corretor podem alterar status.
drop policy if exists "lotes_admin_all" on public.lotes;
create policy "lotes_admin_all" on public.lotes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lotes_select" on public.lotes;
create policy "lotes_select" on public.lotes for select
  using (public.has_obra_access(obra_id));

drop policy if exists "lotes_corretor_update" on public.lotes;
create policy "lotes_corretor_update" on public.lotes for update
  using (public.role_for_obra(obra_id) = 'CORRETOR' and public.has_obra_access(obra_id))
  with check (public.role_for_obra(obra_id) = 'CORRETOR' and public.has_obra_access(obra_id));

drop policy if exists "lotes_investidor_update" on public.lotes;
create policy "lotes_investidor_update" on public.lotes for update
  using (
    public.role_for_obra(obra_id) in ('PROPRIETARIO_INVESTIDOR', 'INVESTIDOR')
    and public.has_obra_access(obra_id)
  )
  with check (
    public.role_for_obra(obra_id) in ('PROPRIETARIO_INVESTIDOR', 'INVESTIDOR')
    and public.has_obra_access(obra_id)
  );

-- ==============================================================================
-- 7. VIEWS DE MASCARAMENTO FINANCEIRO
--
-- Views clássicas do Postgres (sem "security_invoker") rodam com o privilégio
-- do dono da view. No Supabase, isso significa que elas enxergam as tabelas
-- base "por baixo" da RLS de "obras"/"cronograma"/"medicoes" (que hoje só
-- libera acesso direto para administradores). A view então aplica sua PRÓPRIA
-- regra de visibilidade (has_obra_access) e mascara colunas monetárias com
-- CASE WHEN can_view_financials() — ou seja, mesmo que um usuário sem
-- permissão tente consultar a view diretamente via API, as colunas de valor
-- retornam NULL de verdade, aplicado no banco, não apenas escondido na tela.
-- ==============================================================================

-- CREATE OR REPLACE VIEW não pode trocar nome/ordem de colunas já existentes.
-- A coluna "arquivada" precisa entrar no FINAL (ou a view precisa ser dropada).
drop view if exists public.obras_publicas;
create view public.obras_publicas as
select
  o.id,
  o.empresa_id,
  e.nome as empresa_nome,
  o.nome,
  o.tipo,
  o.cidade,
  o.uf,
  o.status,
  o.descricao,
  o.endereco,
  o.data_inicio,
  o.data_previsao,
  o.percentual_concluido,
  o.area_total_m2,
  o.area_vendavel_m2,
  o.metragem_padrao_lote,
  o.total_lotes,
  o.lotes_disponiveis,
  o.lotes_reservados,
  o.lotes_vendidos,
  o.foto_capa,
  o.mapa_masterplan_url,
  o.mapa_viewbox,
  o.mapa_img_transform,
  o.created_at,
  case when public.can_view_financials_for_obra(o.id) then o.valor_vgv end as valor_vgv,
  case when public.can_view_financials_for_obra(o.id) then o.custo_orcado end as custo_orcado,
  case when public.can_view_financials_for_obra(o.id) then o.custo_realizado end as custo_realizado,
  coalesce(o.arquivada, false) as arquivada
from public.obras o
left join public.empresas e on e.id = o.empresa_id
where public.has_obra_access(o.id);

grant select on public.obras_publicas to authenticated;

create or replace view public.cronograma_publico as
select
  c.id,
  c.obra_id,
  c.mes_ano,
  c.mes_label,
  c.percentual_previsto_mes,
  c.percentual_realizado_mes,
  c.percentual_previsto_acumulado,
  c.percentual_realizado_acumulado,
  c.status,
  c.created_at,
  case when public.can_view_financials_for_obra(c.obra_id) then c.valor_previsto_mes end as valor_previsto_mes,
  case when public.can_view_financials_for_obra(c.obra_id) then c.valor_realizado_mes end as valor_realizado_mes,
  case when public.can_view_financials_for_obra(c.obra_id) then c.valor_previsto_acumulado end as valor_previsto_acumulado,
  case when public.can_view_financials_for_obra(c.obra_id) then c.valor_realizado_acumulado end as valor_realizado_acumulado
from public.cronograma c
where public.has_obra_access(c.obra_id);

grant select on public.cronograma_publico to authenticated;

-- Andamento físico: etapas do orçamento visíveis a quem tem acesso à obra.
-- R$ só para quem vê financeiro. Convidado (não admin) só vê etapas com olho aberto.
create or replace view public.andamento_publico as
with base as (
  select
    o.id,
    o.obra_id,
    o.descricao as nome,
    o.avanco_manual,
    coalesce(o.visivel_convidados, true) as visivel_convidados,
    o.valor_total,
    least(100::numeric, greatest(0::numeric, coalesce((
      select sum(cm.percentual_previsto) from public.cronograma_meses cm where cm.etapa_id = o.id
    ), 0))) as previsto,
    least(100::numeric, greatest(0::numeric, coalesce(
      o.avanco_manual,
      (
        select sum(cm.percentual_realizado) from public.cronograma_meses cm where cm.etapa_id = o.id
      ),
      0
    ))) as realizado
  from public.orcamentos o
  where public.has_obra_access(o.obra_id)
    and (
      public.is_admin()
      or coalesce(o.visivel_convidados, true)
    )
)
select
  b.id,
  b.obra_id,
  b.nome,
  b.avanco_manual,
  b.visivel_convidados,
  b.previsto,
  b.realizado,
  case when public.can_view_financials_for_obra(b.obra_id) then b.valor_total end as valor_total,
  case
    when sum(b.valor_total) over (partition by b.obra_id) > 0
    then b.valor_total / sum(b.valor_total) over (partition by b.obra_id)
    else 0
  end as peso_fracao
from base b;

grant select on public.andamento_publico to authenticated;

create or replace view public.medicoes_publicas as
select
  m.id,
  m.obra_id,
  m.numero_medicao,
  m.periodo_inicio,
  m.periodo_fim,
  m.fornecedor_empreiteiro,
  m.servico_executado,
  m.resumo_atividades,
  m.percentual_medido_periodo,
  m.percentual_medido_acumulado,
  m.status,
  m.link_relatorio_pdf,
  m.visivel_convidados,
  m.created_at,
  case when public.can_view_financials_for_obra(m.obra_id) then m.valor_medicao end as valor_medicao,
  case when public.can_view_financials_for_obra(m.obra_id) then m.valor_acumulado end as valor_acumulado
from public.medicoes m
where public.has_obra_access(m.obra_id)
  and (m.visivel_convidados = true or public.can_view_financials_for_obra(m.obra_id));

grant select on public.medicoes_publicas to authenticated;

-- ==============================================================================
-- 8. NOTIFICAÇÕES DA OBRA (sino + push)
--
-- Cada atualização visível da obra gera um aviso para os CONVITES daquela
-- obra (nunca para o administrador que fez a alteração). Fotos/arquivos
-- enviados em sequência no mesmo horário são agrupados numa única linha.
-- O app lê essa tabela no sino e, com permissão do navegador/dispositivo,
-- exibe um push. Tokens FCM/Capacitor ficam em dispositivos_push para o
-- app publicado.
-- ==============================================================================

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  obra_nome text,
  destinatario_email text not null,
  tipo text not null default 'geral',
  titulo text not null,
  mensagem text not null,
  quantidade integer not null default 1,
  agrupamento_chave text,
  lida boolean not null default false,
  lida_em timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists notificacoes_destinatario_idx
  on public.notificacoes (destinatario_email, lida, created_at desc);

create table if not exists public.dispositivos_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  token text not null,
  plataforma text not null default 'web',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (token)
);

grant select, update on public.notificacoes to authenticated;
grant select, insert, update, delete on public.dispositivos_push to authenticated;

alter table public.notificacoes enable row level security;
alter table public.dispositivos_push enable row level security;

drop policy if exists "notificacoes_destinatario_select" on public.notificacoes;
create policy "notificacoes_destinatario_select" on public.notificacoes for select
  using (lower(destinatario_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "notificacoes_destinatario_update" on public.notificacoes;
create policy "notificacoes_destinatario_update" on public.notificacoes for update
  using (lower(destinatario_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(destinatario_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "dispositivos_push_own" on public.dispositivos_push;
create policy "dispositivos_push_own" on public.dispositivos_push for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.papel_recebe_notificacao(p_tipo text, p_role text)
returns boolean
language sql
immutable
as $$
  select case
    when coalesce(p_tipo, 'geral') in ('fotos', 'andamento', 'geral') then
      p_role in (
        'PROPRIETARIO_INVESTIDOR', 'INVESTIDOR', 'CORRETOR', 'CLIENTE_COMPRADOR',
        'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'ADMINISTRADOR'
      )
    when p_tipo = 'documento' then
      p_role in (
        'PROPRIETARIO_INVESTIDOR', 'INVESTIDOR', 'CLIENTE_COMPRADOR',
        'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'ADMINISTRADOR'
      )
    when p_tipo in ('diario', 'medicao') then
      p_role in (
        'PROPRIETARIO_INVESTIDOR', 'INVESTIDOR',
        'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'ADMINISTRADOR'
      )
    when p_tipo = 'lote' then
      p_role in (
        'PROPRIETARIO_INVESTIDOR', 'INVESTIDOR', 'CORRETOR',
        'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'ADMINISTRADOR'
      )
    else false
  end;
$$;

create or replace function public.notificar_obra(
  p_obra_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem_unitaria text,
  p_mensagem_plural text,
  p_agrupamento_chave text,
  p_escopo text default 'todos',
  p_incremento integer default 1
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_ator text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_obra_nome text;
  r record;
  v_existente uuid;
  v_qtd integer;
  v_msg text;
begin
  if p_obra_id is null then
    return;
  end if;

  if not public.is_admin() then
    raise exception 'Apenas o administrador pode emitir notificações da obra.';
  end if;

  select o.nome into v_obra_nome from public.obras o where o.id = p_obra_id;

  for r in
    select distinct lower(trim(c.email)) as email
    from public.convites c
    where c.obra_id = p_obra_id
      and coalesce(c.ativo, true) = true
      and nullif(trim(c.email), '') is not null
      and lower(trim(c.email)) <> v_email_ator
      and public.papel_recebe_notificacao(p_tipo, c.role)
      and (
        coalesce(p_escopo, 'todos') = 'todos'
        or c.role in ('PROPRIETARIO_INVESTIDOR', 'INVESTIDOR', 'GESTOR', 'ENGENHEIRO', 'CONSULTOR')
      )
  loop
    v_existente := null;
    v_qtd := 0;

    select n.id, n.quantidade
      into v_existente, v_qtd
    from public.notificacoes n
    where lower(n.destinatario_email) = r.email
      and n.obra_id = p_obra_id
      and n.agrupamento_chave = p_agrupamento_chave
      and n.lida = false
      and n.created_at > timezone('utc', now()) - interval '30 minutes'
    order by n.created_at desc
    limit 1;

    if v_existente is not null then
      v_qtd := coalesce(v_qtd, 1) + coalesce(p_incremento, 1);
      v_msg := case
        when v_qtd > 1 then replace(p_mensagem_plural, '%s', v_qtd::text)
        else p_mensagem_unitaria
      end;
      update public.notificacoes
      set
        quantidade = v_qtd,
        titulo = p_titulo,
        mensagem = v_msg,
        obra_nome = v_obra_nome,
        created_at = timezone('utc', now())
      where id = v_existente;
    else
      v_qtd := coalesce(p_incremento, 1);
      v_msg := case
        when v_qtd > 1 then replace(p_mensagem_plural, '%s', v_qtd::text)
        else p_mensagem_unitaria
      end;
      insert into public.notificacoes (
        obra_id, obra_nome, destinatario_email, tipo, titulo, mensagem, quantidade, agrupamento_chave
      ) values (
        p_obra_id, v_obra_nome, r.email, p_tipo, p_titulo, v_msg, v_qtd, p_agrupamento_chave
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.notificar_obra(uuid, text, text, text, text, text, text, integer) to authenticated;
grant execute on function public.papel_recebe_notificacao(text, text) to authenticated;

create or replace function public.chave_agrupamento(p_tipo text, p_obra_id uuid)
returns text
language sql
stable
as $$
  select p_tipo || ':' || p_obra_id::text || ':' || to_char(timezone('utc', now()), 'YYYYMMDDHH24');
$$;

create or replace function public.trg_notificar_fotos_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  if tg_op = 'INSERT' and coalesce(new.visivel_convidados, false) is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and not (
    coalesce(old.visivel_convidados, false) is not true
    and coalesce(new.visivel_convidados, false) is true
  ) then
    return new;
  end if;

  select nome into v_nome from public.obras where id = new.obra_id;
  perform public.notificar_obra(
    new.obra_id,
    'fotos',
    'Novas fotos no acompanhamento',
    'Uma nova foto foi publicada em ' || coalesce(v_nome, 'a obra') || '.',
    '%s novas fotos foram publicadas em ' || coalesce(v_nome, 'a obra') || '.',
    public.chave_agrupamento('fotos', new.obra_id),
    'todos',
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_fotos_obra_ins on public.fotos_obra;
create trigger trg_notificar_fotos_obra_ins
  after insert on public.fotos_obra
  for each row execute function public.trg_notificar_fotos_obra();

drop trigger if exists trg_notificar_fotos_obra_upd on public.fotos_obra;
create trigger trg_notificar_fotos_obra_upd
  after update of visivel_convidados on public.fotos_obra
  for each row execute function public.trg_notificar_fotos_obra();

create or replace function public.trg_notificar_arquivos_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  if tg_op = 'INSERT' and coalesce(new.visivel_convidados, false) is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and not (
    coalesce(old.visivel_convidados, false) is not true
    and coalesce(new.visivel_convidados, false) is true
  ) then
    return new;
  end if;

  select nome into v_nome from public.obras where id = new.obra_id;
  perform public.notificar_obra(
    new.obra_id,
    'documento',
    'Novo documento disponível',
    'Um novo arquivo foi anexado em ' || coalesce(v_nome, 'a obra') || ': ' || coalesce(new.titulo, 'documento') || '.',
    '%s novos arquivos foram anexados em ' || coalesce(v_nome, 'a obra') || '.',
    public.chave_agrupamento('documento', new.obra_id),
    'todos',
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_arquivos_obra_ins on public.obra_arquivos;
create trigger trg_notificar_arquivos_obra_ins
  after insert on public.obra_arquivos
  for each row execute function public.trg_notificar_arquivos_obra();

drop trigger if exists trg_notificar_arquivos_obra_upd on public.obra_arquivos;
create trigger trg_notificar_arquivos_obra_upd
  after update of visivel_convidados on public.obra_arquivos
  for each row execute function public.trg_notificar_arquivos_obra();

create or replace function public.trg_notificar_diario_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  select nome into v_nome from public.obras where id = new.obra_id;
  perform public.notificar_obra(
    new.obra_id,
    'diario',
    'Diário de obra atualizado',
    'Um novo registro de diário foi lançado em ' || coalesce(v_nome, 'a obra') || '.',
    '%s novos registros de diário em ' || coalesce(v_nome, 'a obra') || '.',
    public.chave_agrupamento('diario', new.obra_id),
    'financeiro',
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_diario_obra_ins on public.diario_obra;
create trigger trg_notificar_diario_obra_ins
  after insert on public.diario_obra
  for each row execute function public.trg_notificar_diario_obra();

create or replace function public.trg_notificar_medicoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_escopo text := 'financeiro';
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then
    return new;
  end if;
  if coalesce(new.visivel_convidados, false) then
    v_escopo := 'todos';
  end if;
  select nome into v_nome from public.obras where id = new.obra_id;
  perform public.notificar_obra(
    new.obra_id,
    'medicao',
    'Medição atualizada',
    'A medição nº ' || coalesce(new.numero_medicao::text, '—') || ' de ' || coalesce(v_nome, 'a obra') || ' foi atualizada.',
    '%s medições foram atualizadas em ' || coalesce(v_nome, 'a obra') || '.',
    public.chave_agrupamento('medicao', new.obra_id),
    v_escopo,
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_medicoes_ins on public.medicoes;
create trigger trg_notificar_medicoes_ins
  after insert on public.medicoes
  for each row execute function public.trg_notificar_medicoes();

drop trigger if exists trg_notificar_medicoes_upd on public.medicoes;
create trigger trg_notificar_medicoes_upd
  after update of status on public.medicoes
  for each row execute function public.trg_notificar_medicoes();

create or replace function public.trg_notificar_andamento_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- O % concluído é atualizado pelo save do andamento, que já chama notificar_obra.
  -- Este trigger só avisa mudança de status para não duplicar o sino.
  if old.status is not distinct from new.status then
    return new;
  end if;

  perform public.notificar_obra(
    new.id,
    'geral',
    'Status da obra atualizado',
    'O status de ' || coalesce(new.nome, 'a obra') || ' mudou para ' || coalesce(new.status, '—') || '.',
    'O status de ' || coalesce(new.nome, 'a obra') || ' foi atualizado.',
    public.chave_agrupamento('status', new.id),
    'todos',
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_andamento_obra on public.obras;
create trigger trg_notificar_andamento_obra
  after update of status on public.obras
  for each row execute function public.trg_notificar_andamento_obra();

create or replace function public.trg_notificar_lote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  if lower(coalesce(new.status, '')) not in ('vendido', 'reservado') then
    return new;
  end if;
  select nome into v_nome from public.obras where id = new.obra_id;
  perform public.notificar_obra(
    new.obra_id,
    'lote',
    'Atualização no mapa de lotes',
    'O lote ' || coalesce(new.quadra, '') || '-' || coalesce(new.numero, '') ||
      ' de ' || coalesce(v_nome, 'a obra') || ' agora está ' || new.status || '.',
    '%s lotes foram atualizados em ' || coalesce(v_nome, 'a obra') || '.',
    public.chave_agrupamento('lote', new.obra_id),
    'todos',
    1
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_lote_upd on public.lotes;
create trigger trg_notificar_lote_upd
  after update of status on public.lotes
  for each row execute function public.trg_notificar_lote();

alter table public.notificacoes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notificacoes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Seed demo: lotes com svg_path para a primeira obra sem mapeamento (grid 4x3).
do $$
declare
  v_obra_id uuid;
begin
  select o.id into v_obra_id
  from public.obras o
  where not exists (
    select 1 from public.lotes l where l.obra_id = o.id and l.svg_path is not null
  )
  order by o.created_at asc
  limit 1;

  if v_obra_id is null then
    return;
  end if;

  update public.obras
  set mapa_viewbox = coalesce(mapa_viewbox, '0 0 1200 800')
  where id = v_obra_id;

  insert into public.lotes (
    obra_id, quadra, numero, area_m2, valor_m2, valor_total, status,
    svg_path, label_x, label_y
  ) values
    (v_obra_id, 'Quadra A', '01', 300, 600, 180000, 'disponivel',
      'M 50 50 L 310 50 L 310 270 L 50 270 Z', 180, 160),
    (v_obra_id, 'Quadra A', '02', 320, 600, 192000, 'disponivel',
      'M 330 50 L 590 50 L 590 270 L 330 270 Z', 460, 160),
    (v_obra_id, 'Quadra A', '03', 310, 600, 186000, 'reservado',
      'M 610 50 L 870 50 L 870 270 L 610 270 Z', 740, 160),
    (v_obra_id, 'Quadra A', '04', 305, 600, 183000, 'vendido',
      'M 890 50 L 1150 50 L 1150 270 L 890 270 Z', 1020, 160),
    (v_obra_id, 'Quadra B', '05', 298, 620, 184760, 'disponivel',
      'M 50 290 L 310 290 L 310 510 L 50 510 Z', 180, 400),
    (v_obra_id, 'Quadra B', '06', 315, 620, 195300, 'reservado',
      'M 330 290 L 590 290 L 590 510 L 330 510 Z', 460, 400),
    (v_obra_id, 'Quadra B', '07', 300, 620, 186000, 'disponivel',
      'M 610 290 L 870 290 L 870 510 L 610 510 Z', 740, 400),
    (v_obra_id, 'Quadra B', '08', 308, 620, 190960, 'vendido',
      'M 890 290 L 1150 290 L 1150 510 L 890 510 Z', 1020, 400),
    (v_obra_id, 'Quadra C', '09', 302, 640, 193280, 'disponivel',
      'M 50 530 L 310 530 L 310 750 L 50 750 Z', 180, 640),
    (v_obra_id, 'Quadra C', '10', 318, 640, 203520, 'disponivel',
      'M 330 530 L 590 530 L 590 750 L 330 750 Z', 460, 640),
    (v_obra_id, 'Quadra C', '11', 295, 640, 188800, 'reservado',
      'M 610 530 L 870 530 L 870 750 L 610 750 Z', 740, 640),
    (v_obra_id, 'Quadra C', '12', 312, 640, 199680, 'vendido',
      'M 890 530 L 1150 530 L 1150 750 L 890 750 Z', 1020, 640);
end $$;

-- Recarrega o cache da Data API (PostgREST) para enxergar colunas/views novas.
notify pgrst, 'reload schema';

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- ==============================================================================
