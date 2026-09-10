import { supabase } from '../lib/supabaseClient';
import { MOCK_MACRO_ETAPAS } from './mockData';
import { progressoPonderado } from '../lib/andamento';

import {
  Empresa,
  Obra,
  MacroEtapa,
  OrcamentoItem,
  CronogramaItem,
  CronogramaMes,
  AndamentoEtapa,
  DiarioObra,
  MedicaoItem,
  FotoObra,
  DocumentoObra,
  ViabilidadeEstudo,
  EstudoViabilidade,
  Lote,
  Convite,
  UserProfile,
  Notificacao,
  RelatorioObra
} from '../types';
import { mapConviteRow } from './conviteResgate';

/**
 * Camada de acesso a dados REAL do Supabase (Postgres + RLS).
 *
 * Regras de segurança aplicadas no banco (ver src/services/schema.sql):
 *  - Leituras de "obras", "cronograma" e "medições" acontecem através das
 *    views "obras_publicas" / "cronograma_publico" / "medicoes_publicas",
 *    que mascaram (retornam NULL) colunas monetárias para quem não tem
 *    permissão — a máscara é aplicada no Postgres, não apenas na tela.
 *  - Escritas (criar/editar obra, orçamento, etc.) exigem papel ADMINISTRADOR
 *    e são bloqueadas pelo próprio banco via RLS mesmo que o front-end seja
 *    manipulado.
 *
 * Se uma consulta falhar porque as tabelas/views ainda não existem no seu
 * projeto Supabase, cada método aqui registra um aviso claro no console e
 * devolve uma lista/objeto vazio, em vez de quebrar a aplicação.
 */

/**
 * Detecta o erro PGRST205 do PostgREST: "Could not find the table/column X
 * in the schema cache". Isso NÃO significa que a tabela não existe (ela pode
 * existir e aparecer normalmente no Table Editor) — significa que o cache de
 * metadados da API REST do Supabase está desatualizado e precisa ser
 * recarregado. É comum acontecer após rodar DDL manualmente no SQL Editor ou
 * após o projeto (plano free) "hibernar" por inatividade e voltar.
 *
 * Correção: no SQL Editor do Supabase, executar `NOTIFY pgrst, 'reload schema';`
 * (ou em Project Settings → API → "Reload schema" / reiniciar o projeto).
 */
function isSchemaCacheError(error: any): boolean {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return (
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42703' ||
    /schema cache/i.test(message) ||
    /could not find the .* column/i.test(message)
  );
}

function isRlsError(error: any): boolean {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return code === '42501' || /row-level security|permission denied/i.test(message);
}

function mensagemErroObra(error: { code?: string; message?: string }): string {
  if (isRlsError(error)) {
    return 'Permissão negada (RLS). Apenas administradores podem cadastrar ou editar obras.';
  }
  if (isSchemaCacheError(error)) {
    return 'O banco de dados está com o schema ou o cache da API desatualizado. Execute o schema.sql atualizado no SQL Editor e rode "NOTIFY pgrst, \'reload schema\';".';
  }
  return error?.message || 'Não foi possível salvar a obra. Tente novamente.';
}

const SCHEMA_CACHE_HINT =
  'Verifique se o script src/services/schema.sql já foi executado no SQL Editor do seu projeto Supabase.';

const SCHEMA_CACHE_RELOAD_HINT =
  'Cache da API do Supabase desatualizado (PGRST205). Rode "NOTIFY pgrst, \'reload schema\';" no SQL Editor do projeto, ou em Project Settings → API clique em "Reload schema" / reinicie o projeto.';

function logSupabaseError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[dataService] ❌ Falha em "${context}": ${message}\n` +
    (isSchemaCacheError(error) ? SCHEMA_CACHE_RELOAD_HINT : SCHEMA_CACHE_HINT)
  );
}

/** Remove chaves com valor undefined antes de enviar ao Supabase. */
function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

class SupabaseDataService {
  // ============================================================
  // EMPRESAS (somente administrador — ver schema.sql)
  // ============================================================
  async getEmpresas(): Promise<Empresa[]> {
    const { data, error } = await supabase.from('empresas').select('*').order('nome');
    if (error) {
      logSupabaseError('getEmpresas', error);
      return [];
    }
    return (data || []) as Empresa[];
  }

  async saveEmpresa(empresa: Omit<Empresa, 'id'> & { id?: string }): Promise<Empresa> {
    const payload = clean({
      nome: empresa.nome,
      cnpj: empresa.cnpj || null,
      contato: empresa.contato || null,
      email: empresa.email || null,
      telefone: empresa.telefone || null,
      responsavel_tecnico: empresa.responsavel_tecnico || null,
      crea_cau: empresa.crea_cau || null,
      logo_url: empresa.logo_url || null
    });

    const throwSaveError = (error: { code?: string; message?: string }) => {
      logSupabaseError('saveEmpresa', error);
      if (error.code === '23505' || /duplicate key|cnpj/i.test(error.message || '')) {
        throw new Error('Já existe uma empresa cadastrada com este CNPJ.');
      }
      if (isSchemaCacheError(error)) {
        throw new Error(
          'O banco de dados está com o cache da API desatualizado. Peça ao administrador para recarregar o schema no painel do Supabase (SQL Editor → executar "NOTIFY pgrst, \'reload schema\';") e tente novamente.'
        );
      }
      throw new Error('Não foi possível salvar a empresa. Verifique suas permissões e a configuração do banco.');
    };

    if (empresa.id) {
      const { data, error } = await supabase.from('empresas').update(payload).eq('id', empresa.id).select().single();
      if (error) throwSaveError(error);
      return data as Empresa;
    }

    const { data, error } = await supabase.from('empresas').insert(payload).select().single();
    if (error) throwSaveError(error);
    return data as Empresa;
  }

  /**
   * Atualiza apenas a URL do logo de uma empresa já cadastrada — usado após o
   * upload do arquivo para o Storage (o registro precisa existir antes, pois
   * o caminho do arquivo no bucket "logos_empresas" é organizado por empresa_id).
   */
  async updateEmpresaLogo(id: string, logoUrl: string): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .update({ logo_url: logoUrl })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      logSupabaseError('updateEmpresaLogo', error);
      throw new Error('A empresa foi cadastrada, mas não foi possível salvar o logo. Tente enviá-lo novamente na edição.');
    }
    return data as Empresa;
  }

  async deleteEmpresa(id: string): Promise<void> {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteEmpresa', error);
      throw new Error('Não foi possível excluir a empresa. Se houver obras vinculadas, arquive-as ou exclua-as antes.');
    }
  }

  // ============================================================
  // OBRAS — leitura sempre via view mascarada "obras_publicas"
  // ============================================================
  async getObras(): Promise<Obra[]> {
    const { data, error } = await supabase
      .from('obras_publicas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      logSupabaseError('getObras', error);
      return [];
    }
    return (data || []) as Obra[];
  }

  async saveObra(obra: Omit<Obra, 'id'> & { id?: string }): Promise<Obra> {
    // Aceita tanto o formato snake_case (banco) quanto o camelCase legado
    // usado pelo formulário "Nova Obra".
    const anyObra = obra as any;
    const nome = String(obra.nome || '').trim();
    const cidade = String(obra.cidade || '').trim();
    const empresaId = anyObra.empresa_id || anyObra.empresaId || null;
    const totalLotes = obra.total_lotes ?? anyObra.qtdLotes ?? 0;
    const dataInicio = obra.data_inicio || anyObra.dataInicio || null;
    const dataPrevisao = obra.data_previsao || anyObra.dataEntrega || null;

    if (!nome) {
      throw new Error('Nome da obra é obrigatório.');
    }
    if (!empresaId) {
      throw new Error('Selecione uma empresa.');
    }
    if (!cidade) {
      throw new Error('Informe a cidade da obra.');
    }

    const camposFormulario = clean({
      empresa_id: empresaId,
      nome,
      tipo: obra.tipo || 'Condomínio Horizontal Fechado',
      cidade,
      uf: (obra.uf || 'SP').trim().toUpperCase().slice(0, 2) || 'SP',
      status: obra.status || 'Planejamento',
      descricao: obra.descricao?.trim() || null,
      endereco: obra.endereco?.trim() || null,
      data_inicio: dataInicio || null,
      data_previsao: dataPrevisao || null,
      area_total_m2: obra.area_total_m2 ?? anyObra.areaM2 ?? 0,
      area_vendavel_m2: obra.area_vendavel_m2 ?? anyObra.areaVendavelM2 ?? 0,
      metragem_padrao_lote: anyObra.metragem_padrao_lote ?? anyObra.metragemPadraoLote ?? 0,
      total_lotes: totalLotes,
      valor_vgv: obra.valor_vgv ?? anyObra.valorGlobal ?? 0,
      foto_capa: obra.foto_capa || null,
      arquivada: obra.arquivada === true || obra.status === 'Arquivada'
    });

    const throwSaveError = (error: { code?: string; message?: string }) => {
      logSupabaseError('saveObra', error);
      throw new Error(mensagemErroObra(error));
    };

    if (obra.id) {
      const { data, error } = await supabase
        .from('obras')
        .update(camposFormulario)
        .eq('id', obra.id)
        .select()
        .single();
      if (error) throwSaveError(error);
      return data as Obra;
    }

    const payloadInsert = {
      ...camposFormulario,
      lotes_vendidos: obra.lotes_vendidos ?? 0,
      lotes_disponiveis: obra.lotes_disponiveis ?? totalLotes,
      custo_orcado: obra.custo_orcado ?? 0,
      custo_realizado: obra.custo_realizado ?? 0,
      percentual_concluido: obra.percentual_concluido ?? 0
    };

    const { data, error } = await supabase.from('obras').insert(payloadInsert).select().single();
    if (error) throwSaveError(error);
    return data as Obra;
  }

  async updateObraFotoCapa(id: string, fotoCapa: string): Promise<Obra> {
    const { data, error } = await supabase
      .from('obras')
      .update({ foto_capa: fotoCapa })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      logSupabaseError('updateObraFotoCapa', error);
      throw new Error('A obra foi salva, mas não foi possível gravar a imagem de capa. Tente enviá-la novamente na edição.');
    }
    return data as Obra;
  }

  async deleteObra(id: string): Promise<void> {
    const { error } = await supabase.from('obras').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteObra', error);
      if (isSchemaCacheError(error)) {
        throw new Error(
          'O banco de dados está com o cache da API desatualizado. Recarregue o schema no painel do Supabase e tente novamente.'
        );
      }
      throw new Error('Não foi possível excluir a obra. Apenas administradores podem remover empreendimentos.');
    }
  }

  async updateObraPercentual(id: string, percentual: number): Promise<void> {
    const { error } = await supabase
      .from('obras')
      .update({ percentual_concluido: percentual })
      .eq('id', id);
    if (error) {
      logSupabaseError('updateObraPercentual', error);
      throw new Error('Não foi possível gravar o andamento da obra.');
    }
  }

  async setObraArquivada(id: string, arquivada: boolean): Promise<Obra> {
    const payload: { arquivada: boolean; status?: string } = { arquivada };

    if (!arquivada) {
      const { data: atual } = await supabase.from('obras').select('status').eq('id', id).single();
      if (atual?.status === 'Arquivada') {
        payload.status = 'Concluída';
      }
    }

    const { data, error } = await supabase
      .from('obras')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      logSupabaseError('setObraArquivada', error);
      throw new Error('Não foi possível arquivar a obra. Verifique se o schema.sql atualizado já foi executado no Supabase.');
    }
    return data as Obra;
  }

  // ============================================================
  // PERFIS DE USUÁRIO
  // ============================================================
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('perfis').select('*').order('nome');
    if (error) {
      logSupabaseError('getUsers', error);
      return [];
    }
    return (data || []) as UserProfile[];
  }

  // ============================================================
  // MACRO ETAPAS (metodologia fixa, não é dado sensível por obra)
  // ============================================================
  async getMacroEtapas(): Promise<MacroEtapa[]> {
    return MOCK_MACRO_ETAPAS;
  }

  async getAndamento(obraId: string): Promise<AndamentoEtapa[]> {
    const { data, error } = await supabase
      .from('andamento_publico')
      .select('*')
      .eq('obra_id', obraId)
      .order('nome');
    if (error) {
      logSupabaseError('getAndamento', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      id: r.id,
      obra_id: r.obra_id,
      nome: r.nome,
      avanco_manual: r.avanco_manual == null ? null : Number(r.avanco_manual),
      visivel_convidados: r.visivel_convidados !== false,
      previsto: Number(r.previsto) || 0,
      realizado: Number(r.realizado) || 0,
      valor_total: r.valor_total == null ? null : Number(r.valor_total),
      peso_fracao: Number(r.peso_fracao) || 0
    }));
  }

  async salvarAvanco(obraId: string, etapa: AndamentoEtapa, percentual: number): Promise<void> {
    const pct = Math.max(0, Math.min(100, percentual));
    const { error } = await supabase
      .from('orcamentos')
      .update({ avanco_manual: pct, data_atualizacao: new Date().toISOString() })
      .eq('id', etapa.id);
    if (error) {
      logSupabaseError('salvarAvanco', error);
      throw new Error('Não foi possível salvar o avanço da etapa.');
    }

    const todas = await this.getAndamento(obraId);
    const geral = progressoPonderado(todas, 'realizado');
    await this.updateObraPercentual(obraId, Number(geral.toFixed(1)));

    const visivel = etapa.visivel_convidados !== false;
    const { error: nErr } = await supabase.rpc('notificar_obra', {
      p_obra_id: obraId,
      p_tipo: 'andamento',
      p_titulo: 'Andamento da obra atualizado',
      p_mensagem_unitaria: `A etapa ${etapa.nome} está em ${Math.round(pct)}%.`,
      p_mensagem_plural: '%s etapas tiveram o andamento atualizado.',
      p_agrupamento_chave: `andamento:${obraId}`,
      p_escopo: visivel ? 'todos' : 'financeiro',
      p_incremento: 1
    });
    if (nErr) {
      logSupabaseError('salvarAvanco.notificar', nErr);
    }
  }

  async salvarVisibilidade(etapaId: string, visivel: boolean): Promise<void> {
    const { error } = await supabase
      .from('orcamentos')
      .update({ visivel_convidados: visivel })
      .eq('id', etapaId);
    if (error) {
      logSupabaseError('salvarVisibilidade', error);
      throw new Error('Não foi possível alterar a visibilidade da etapa.');
    }
  }

  // ============================================================
  // ORÇAMENTO (100% financeiro — RLS restringe a quem pode ver)
  // ============================================================
  async getOrcamentos(obraId: string): Promise<OrcamentoItem[]> {
    let query = supabase.from('orcamentos').select('*').order('data_atualizacao', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getOrcamentos', error);
      return [];
    }
    return (data || []) as OrcamentoItem[];
  }

  async saveOrcamento(item: Partial<OrcamentoItem>): Promise<OrcamentoItem> {
    const payload = clean({
      obra_id: item.obra_id,
      macro_etapa_id: item.macro_etapa_id || null,
      macro_etapa_nome: item.macro_etapa_nome || null,
      codigo_sinapi: item.codigo_sinapi || null,
      categoria: item.categoria || null,
      descricao: item.descricao,
      unidade: item.unidade || 'un',
      quantidade: item.quantidade ?? 0,
      valor_unitario: item.valor_unitario ?? 0,
      valor_total: item.valor_total ?? 0,
      valor_executado: item.valor_executado ?? 0,
      percentual_executado: item.percentual_executado ?? 0,
      data_atualizacao: new Date().toISOString()
    });

    const query = item.id
      ? supabase.from('orcamentos').update(payload).eq('id', item.id).select().single()
      : supabase.from('orcamentos').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveOrcamento', error);
      throw new Error('Não foi possível salvar o item de orçamento.');
    }
    return data as OrcamentoItem;
  }

  async deleteOrcamento(id: string): Promise<void> {
    const { error: cronoErr } = await supabase.from('cronograma_meses').delete().eq('etapa_id', id);
    if (cronoErr && !isSchemaCacheError(cronoErr)) {
      logSupabaseError('deleteOrcamento.cronograma', cronoErr);
      throw new Error('Não foi possível excluir o cronograma da etapa.');
    }
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteOrcamento', error);
      throw new Error('Não foi possível excluir a etapa.');
    }
  }

  async deleteOrcamentosDaObra(obraId: string): Promise<void> {
    const { data: etapas, error: selErr } = await supabase
      .from('orcamentos')
      .select('id')
      .eq('obra_id', obraId);
    if (selErr) {
      logSupabaseError('deleteOrcamentosDaObra.select', selErr);
      throw new Error('Não foi possível limpar o orçamento da obra.');
    }
    const ids = (etapas || []).map((e: { id: string }) => e.id);
    if (ids.length > 0) {
      const { error: cronoErr } = await supabase.from('cronograma_meses').delete().in('etapa_id', ids);
      if (cronoErr && !isSchemaCacheError(cronoErr)) {
        logSupabaseError('deleteOrcamentosDaObra.cronograma', cronoErr);
        throw new Error('Não foi possível excluir o cronograma vinculado ao orçamento.');
      }
    }
    const { error } = await supabase.from('orcamentos').delete().eq('obra_id', obraId);
    if (error) {
      logSupabaseError('deleteOrcamentosDaObra', error);
      throw new Error('Não foi possível limpar o orçamento da obra.');
    }
  }

  async importarEtapasOrcamento(
    obraId: string,
    etapas: { nome: string; valor_total: number; codigo?: string | null }[]
  ): Promise<void> {
    await this.deleteOrcamentosDaObra(obraId);
    const agora = new Date().toISOString();
    const payload = etapas.map((e) => ({
      obra_id: obraId,
      descricao: e.nome,
      categoria: e.nome,
      macro_etapa_nome: e.nome,
      codigo_sinapi: e.codigo || null,
      unidade: 'vb',
      quantidade: 1,
      valor_unitario: e.valor_total,
      valor_total: e.valor_total,
      valor_executado: 0,
      percentual_executado: 0,
      data_atualizacao: agora
    }));
    if (payload.length === 0) return;
    const { error } = await supabase.from('orcamentos').insert(payload);
    if (error) {
      logSupabaseError('importarEtapasOrcamento', error);
      throw new Error('Não foi possível importar as etapas do orçamento.');
    }
  }

  // ============================================================
  // CRONOGRAMA — leitura sempre via view mascarada "cronograma_publico"
  // ============================================================
  async getCronograma(obraId: string): Promise<CronogramaItem[]> {
    let query = supabase.from('cronograma_publico').select('*').order('mes_ano');
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getCronograma', error);
      return [];
    }
    return (data || []) as CronogramaItem[];
  }

  async getCronogramaMeses(etapaIds: string[]): Promise<CronogramaMes[]> {
    if (etapaIds.length === 0) return [];
    const { data, error } = await supabase
      .from('cronograma_meses')
      .select('*')
      .in('etapa_id', etapaIds);
    if (error) {
      logSupabaseError('getCronogramaMeses', error);
      return [];
    }
    return (data || []) as CronogramaMes[];
  }

  async salvarCronogramaMeses(
    etapaIds: string[],
    rows: Omit<CronogramaMes, 'id'>[]
  ): Promise<void> {
    if (etapaIds.length > 0) {
      const { error: delErr } = await supabase
        .from('cronograma_meses')
        .delete()
        .in('etapa_id', etapaIds);
      if (delErr) {
        logSupabaseError('salvarCronogramaMeses.delete', delErr);
        throw new Error('Não foi possível atualizar o cronograma.');
      }
    }
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      etapa_id: r.etapa_id,
      ano_mes: r.ano_mes,
      percentual_previsto: r.percentual_previsto,
      percentual_realizado: r.percentual_realizado
    }));
    const { error } = await supabase.from('cronograma_meses').insert(payload);
    if (error) {
      logSupabaseError('salvarCronogramaMeses.insert', error);
      throw new Error('Não foi possível salvar o cronograma.');
    }
  }

  // ============================================================
  // DIÁRIO DE OBRA
  // ============================================================
  async getDiarios(obraId: string, _isPublicView = false): Promise<DiarioObra[]> {
    // O próprio RLS já filtra por "visivel_convidados" quando o usuário não
    // tem permissão financeira, então não é necessário nenhum parâmetro extra.
    let query = supabase.from('diario_obra').select('*').order('data', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getDiarios', error);
      return [];
    }
    return (data || []) as DiarioObra[];
  }

  async saveDiario(diario: Partial<DiarioObra>): Promise<DiarioObra> {
    const payload = clean({
      obra_id: diario.obra_id,
      data: diario.data,
      clima_manha: diario.clima_manha,
      clima_tarde: diario.clima_tarde,
      condicao_solo: diario.condicao_solo,
      efetivo_proprio: diario.efetivo_proprio,
      efetivo_terceirizado: diario.efetivo_terceirizado,
      equipamentos_ativos: diario.equipamentos_ativos,
      equipes_presentes: diario.equipes_presentes,
      atividades_realizadas: diario.atividades_realizadas,
      ocorrencias: diario.ocorrencias,
      responsavel_nome: diario.responsavel_nome,
      visivel_convidados: diario.visivel_convidados,
    });

    const query = diario.id
      ? supabase.from('diario_obra').update(payload).eq('id', diario.id).select().single()
      : supabase.from('diario_obra').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveDiario', error);
      if (isSchemaCacheError(error)) {
        throw new Error(
          'Tabela diario_obra não encontrada ou cache da API desatualizado. Execute src/services/schema.sql no SQL Editor do Supabase (projeto tvokopoxxwhimejwkzlr) e rode NOTIFY pgrst, \'reload schema\';'
        );
      }
      if (isRlsError(error)) {
        throw new Error('Permissão negada. Apenas administradores podem salvar o diário de obra.');
      }
      throw new Error(error.message || 'Não foi possível salvar o diário de obra.');
    }
    return data as DiarioObra;
  }

  // ============================================================
  // MEDIÇÕES — leitura sempre via view mascarada "medicoes_publicas"
  // ============================================================
  async getMedicoes(obraId: string, _isPublicView = false): Promise<MedicaoItem[]> {
    let query = supabase.from('medicoes_publicas').select('*').order('numero_medicao', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getMedicoes', error);
      return [];
    }
    return (data || []).map((m) => ({
      ...(m as MedicaoItem),
      data_medicao: (m as MedicaoItem).periodo_fim || (m as MedicaoItem).data_medicao,
    })) as MedicaoItem[];
  }

  async saveMedicao(medicao: Partial<MedicaoItem>): Promise<MedicaoItem> {
    const payload = clean({
      obra_id: medicao.obra_id,
      numero_medicao: medicao.numero_medicao,
      periodo_inicio: medicao.periodo_inicio,
      periodo_fim: medicao.periodo_fim || medicao.data_medicao,
      fornecedor_empreiteiro: medicao.fornecedor_empreiteiro,
      servico_executado: medicao.servico_executado,
      resumo_atividades: medicao.resumo_atividades,
      valor_medicao: medicao.valor_medicao ?? medicao.valor_medido ?? 0,
      valor_acumulado: medicao.valor_acumulado ?? 0,
      percentual_medido_periodo: medicao.percentual_periodo ?? medicao.percentual_medido_periodo ?? 0,
      percentual_medido_acumulado: medicao.percentual_medido_acumulado ?? 0,
      status: medicao.status ?? 'registrada',
      link_relatorio_pdf: medicao.link_relatorio_pdf,
      visivel_convidados: medicao.visivel_convidados,
    });

    const query = medicao.id
      ? supabase.from('medicoes').update(payload).eq('id', medicao.id).select().single()
      : supabase.from('medicoes').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveMedicao', error);
      if (isSchemaCacheError(error)) {
        throw new Error(
          'Tabela medicoes não encontrada ou cache da API desatualizado. Execute src/services/schema.sql no SQL Editor e rode NOTIFY pgrst, \'reload schema\';'
        );
      }
      if (isRlsError(error)) {
        throw new Error('Permissão negada. Apenas administradores podem salvar medições.');
      }
      throw new Error(error.message || 'Não foi possível salvar a medição.');
    }
    return data as MedicaoItem;
  }

  // ============================================================
  // FOTOS DE OBRA
  // ============================================================
  async getFotos(obraId: string, _isPublicView = false): Promise<FotoObra[]> {
    let query = supabase.from('fotos_obra').select('*').order('data_registro', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getFotos', error);
      return [];
    }
    return (data || []) as FotoObra[];
  }

  async saveFoto(foto: Partial<FotoObra>): Promise<FotoObra> {
    const payload = clean({ ...foto });
    delete (payload as any).id;

    const query = foto.id
      ? supabase.from('fotos_obra').update(payload).eq('id', foto.id).select().single()
      : supabase.from('fotos_obra').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveFoto', error);
      throw new Error('Não foi possível salvar a foto.');
    }
    return data as FotoObra;
  }

  async deleteFoto(id: string): Promise<void> {
    const { error } = await supabase.from('fotos_obra').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteFoto', error);
      throw new Error('Não foi possível excluir a foto.');
    }
  }

  async deleteDiario(id: string): Promise<void> {
    const { error } = await supabase.from('diario_obra').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteDiario', error);
      throw new Error('Não foi possível excluir o registro do diário.');
    }
  }

  async deleteMedicao(id: string): Promise<void> {
    const { error } = await supabase.from('medicoes').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteMedicao', error);
      throw new Error('Não foi possível excluir a medição.');
    }
  }

  // ============================================================
  // DOCUMENTOS
  // ============================================================
  async getDocumentos(obraId: string, _isPublicView = false): Promise<DocumentoObra[]> {
    let query = supabase.from('obra_arquivos').select('*').order('data_emissao', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getDocumentos', error);
      return [];
    }
    return (data || []) as DocumentoObra[];
  }

  async saveDocumento(doc: Partial<DocumentoObra>): Promise<DocumentoObra> {
    const isUuid = doc.id && /^[0-9a-f-]{36}$/i.test(doc.id);
    const payload = clean({
      obra_id: doc.obra_id,
      titulo: doc.titulo || 'Documento',
      categoria: doc.categoria || null,
      codigo_revisao: doc.codigo_revisao || null,
      data_emissao: doc.data_emissao || null,
      tamanho_bytes: doc.tamanho_bytes ?? null,
      tipo_extensao: doc.tipo_extensao || 'pdf',
      arquivo_url: doc.arquivo_url,
      visivel_convidados: doc.visivel_convidados ?? false,
      arquivado: doc.arquivado ?? false,
      responsavel_tecnico: doc.responsavel_tecnico || null,
      descricao: doc.descricao || null,
    });

    const query = isUuid
      ? supabase.from('obra_arquivos').update(payload).eq('id', doc.id!).select().single()
      : supabase.from('obra_arquivos').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveDocumento', error);
      if (isSchemaCacheError(error)) {
        throw new Error(
          'Tabela obra_arquivos não encontrada ou cache da API desatualizado. Execute schema.sql e NOTIFY pgrst, \'reload schema\';'
        );
      }
      if (isRlsError(error)) {
        throw new Error('Permissão negada. Apenas administradores podem salvar documentos.');
      }
      throw new Error(error.message || 'Não foi possível salvar o documento.');
    }
    return data as DocumentoObra;
  }

  async deleteDocumento(id: string): Promise<void> {
    const { error } = await supabase.from('obra_arquivos').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteDocumento', error);
      throw new Error('Não foi possível excluir o documento.');
    }
  }

  async toggleVisibilidadeDocumento(id: string, visivel: boolean): Promise<void> {
    const { error } = await supabase
      .from('obra_arquivos')
      .update({ visivel_convidados: visivel })
      .eq('id', id);
    if (error) {
      logSupabaseError('toggleVisibilidadeDocumento', error);
      throw new Error('Não foi possível alterar a visibilidade.');
    }
  }

  async arquivarDocumento(id: string, arquivado = true): Promise<void> {
    const { error } = await supabase.from('obra_arquivos').update({ arquivado }).eq('id', id);
    if (error) {
      logSupabaseError('arquivarDocumento', error);
      throw new Error('Não foi possível arquivar o documento.');
    }
  }

  async arquivarPasta(obraId: string, categoria: string): Promise<void> {
    const { error } = await supabase
      .from('obra_arquivos')
      .update({ arquivado: true })
      .eq('obra_id', obraId)
      .eq('categoria', categoria);
    if (error) {
      logSupabaseError('arquivarPasta', error);
      throw new Error('Não foi possível arquivar a pasta.');
    }
  }

  async renomearPasta(obraId: string, categoriaAntiga: string, categoriaNova: string): Promise<void> {
    const { error } = await supabase
      .from('obra_arquivos')
      .update({ categoria: categoriaNova })
      .eq('obra_id', obraId)
      .eq('categoria', categoriaAntiga);
    if (error) {
      logSupabaseError('renomearPasta', error);
      throw new Error('Não foi possível renomear a pasta.');
    }
  }

  // ============================================================
  // VIABILIDADE (100% financeiro)
  // ============================================================
  async getViabilidade(obraId: string): Promise<ViabilidadeEstudo> {
    let query = supabase.from('viabilidade').select('*');
    query = obraId ? query.eq('obra_id', obraId) : query;
    const { data, error } = await query.maybeSingle();
    if (error) {
      logSupabaseError('getViabilidade', error);
      return {} as ViabilidadeEstudo;
    }
    return (data || {}) as ViabilidadeEstudo;
  }

  async saveViabilidade(
    payload: Partial<ViabilidadeEstudo> & { obra_id: string }
  ): Promise<ViabilidadeEstudo> {
    const { data, error } = await supabase
      .from('viabilidade')
      .upsert(payload, { onConflict: 'obra_id' })
      .select()
      .single();
    if (error) {
      logSupabaseError('saveViabilidade', error);
      throw new Error('Não foi possível salvar o estudo de viabilidade.');
    }
    return data as ViabilidadeEstudo;
  }

  // ============================================================
  // ESTUDOS DE VIABILIDADE INICIAL (pré-obra, tabela estudos_viabilidade)
  // ============================================================
  async listEstudosViabilidade(): Promise<EstudoViabilidade[]> {
    const { data, error } = await supabase
      .from('estudos_viabilidade')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      logSupabaseError('listEstudosViabilidade', error);
      throw new Error('Não foi possível carregar os estudos de viabilidade.');
    }
    return (data || []) as EstudoViabilidade[];
  }

  async saveEstudoViabilidade(
    estudo: Partial<EstudoViabilidade> & { titulo: string }
  ): Promise<EstudoViabilidade> {
    const agora = new Date().toISOString();
    const payload = clean({
      titulo: estudo.titulo,
      empresa_nome: estudo.empresa_nome || null,
      destinatario: estudo.destinatario || null,
      cnpj: estudo.cnpj || null,
      localizacao: estudo.localizacao || null,
      tipo: estudo.tipo || 'loteamento',
      status: estudo.status || 'rascunho',
      area_terreno: estudo.area_terreno ?? 0,
      area_app: estudo.area_app ?? 0,
      pct_viario: estudo.pct_viario ?? 0,
      pct_verde: estudo.pct_verde ?? 0,
      pct_institucional: estudo.pct_institucional ?? 0,
      pct_vendavel: estudo.pct_vendavel ?? 0,
      lote_medio: estudo.lote_medio ?? 0,
      custo_m2_privativo: estudo.custo_m2_privativo ?? 0,
      valor_venda_m2: estudo.valor_venda_m2 ?? 0,
      custo_total: estudo.custo_total ?? 0,
      vgv_total: estudo.vgv_total ?? 0,
      valor_lote: estudo.valor_lote ?? 0,
      prazo_obra_meses: estudo.prazo_obra_meses ?? 24,
      prazo_vendas_meses: estudo.prazo_vendas_meses ?? 36,
      taxa_desconto_aa: estudo.taxa_desconto_aa ?? 12,
      updated_at: agora
    });

    const query = estudo.id
      ? supabase.from('estudos_viabilidade').update(payload).eq('id', estudo.id).select().single()
      : supabase.from('estudos_viabilidade').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveEstudoViabilidade', error);
      throw new Error('Não foi possível salvar o estudo de viabilidade.');
    }
    return data as EstudoViabilidade;
  }

  async updateEstudoViabilidadeStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('estudos_viabilidade')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      logSupabaseError('updateEstudoViabilidadeStatus', error);
      throw new Error('Não foi possível atualizar o status do estudo.');
    }
  }

  async deleteEstudoViabilidade(id: string): Promise<void> {
    const { error } = await supabase.from('estudos_viabilidade').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteEstudoViabilidade', error);
      throw new Error('Não foi possível excluir o estudo de viabilidade.');
    }
  }

  // ============================================================
  // LOTES / MAPA DE DISPONIBILIDADE
  // ============================================================
  async getLotes(obraId: string): Promise<Lote[]> {
    let query = supabase.from('lotes').select('*').order('quadra').order('numero');
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getLotes', error);
      return [];
    }
    return (data || []) as Lote[];
  }

  async getLoteById(loteId: string): Promise<Lote | null> {
    if (!loteId) return null;
    const { data, error } = await supabase.from('lotes').select('*').eq('id', loteId).maybeSingle();
    if (error) {
      logSupabaseError('getLoteById', error);
      return null;
    }
    return (data as Lote) || null;
  }

  async updateLoteStatus(loteId: string, status: Lote['status']): Promise<void> {
    const normalizado = String(status || '').toLowerCase();
    const { error } = await supabase.from('lotes').update({ status: normalizado }).eq('id', loteId);
    if (error) {
      logSupabaseError('updateLoteStatus', error);
      throw new Error('Não foi possível atualizar o status do lote.');
    }
  }

  async createLote(obraId: string, dados: {
    quadra: string;
    numero: string;
    area_m2: number;
    valor_total: number;
    valor_m2: number;
    status: string;
    svg_path: string;
    label_x?: number;
    label_y?: number;
  }): Promise<Lote> {
    const quadra = dados.quadra.trim();
    const numero = dados.numero.trim();
    const svg_path = dados.svg_path.trim();

    if (!obraId) throw new Error('Obra não informada.');
    if (!quadra) throw new Error('Quadra é obrigatória.');
    if (!numero) throw new Error('Número do lote é obrigatório.');
    if (!svg_path) throw new Error('SVG Path é obrigatório.');

    const payload = {
      obra_id: obraId,
      quadra,
      numero,
      area_m2: dados.area_m2,
      valor_total: dados.valor_total,
      valor_m2: dados.valor_m2,
      status: String(dados.status || 'disponivel').toLowerCase(),
      svg_path,
      label_x: dados.label_x ?? null,
      label_y: dados.label_y ?? null,
    };

    const { data, error } = await supabase.from('lotes').insert(payload).select().single();
    if (error) {
      logSupabaseError('createLote', error);
      throw new Error('Não foi possível criar o lote.');
    }
    return data as Lote;
  }

  async updateLote(
    loteId: string,
    dados: Partial<Pick<Lote,
      'quadra' | 'numero' | 'status' | 'area_m2' | 'valor_total' | 'valor_m2' | 'svg_path' | 'label_x' | 'label_y'
    >>
  ): Promise<Lote> {
    const payload: Record<string, unknown> = {};
    if (dados.quadra !== undefined) payload.quadra = dados.quadra.trim();
    if (dados.numero !== undefined) payload.numero = dados.numero.trim();
    if (dados.status !== undefined) payload.status = String(dados.status).toLowerCase();
    if (dados.area_m2 !== undefined) payload.area_m2 = dados.area_m2;
    if (dados.valor_total !== undefined) payload.valor_total = dados.valor_total;
    if (dados.valor_m2 !== undefined) payload.valor_m2 = dados.valor_m2;
    if (dados.svg_path !== undefined) payload.svg_path = dados.svg_path.trim();
    if (dados.label_x !== undefined) payload.label_x = dados.label_x;
    if (dados.label_y !== undefined) payload.label_y = dados.label_y;

    const { data, error } = await supabase
      .from('lotes')
      .update(payload)
      .eq('id', loteId)
      .select()
      .single();

    if (error) {
      logSupabaseError('updateLote', error);
      throw new Error('Não foi possível atualizar o lote.');
    }
    return data as Lote;
  }

  async deleteLote(loteId: string): Promise<void> {
    const { error } = await supabase.from('lotes').delete().eq('id', loteId);
    if (error) {
      logSupabaseError('deleteLote', error);
      throw new Error('Não foi possível excluir o lote.');
    }
  }

  async createLotesBatch(
    obraId: string,
    lotes: Array<{
      quadra: string;
      numero: string;
      area_m2: number;
      valor_total: number;
      valor_m2: number;
      status: string;
      svg_path: string;
      label_x?: number;
      label_y?: number;
    }>
  ): Promise<Lote[]> {
    if (!obraId) throw new Error('Obra não informada.');
    if (!lotes.length) throw new Error('Nenhum lote para importar.');

    const payloads = lotes.map((l) => ({
      obra_id: obraId,
      quadra: l.quadra.trim(),
      numero: l.numero.trim(),
      area_m2: l.area_m2,
      valor_total: l.valor_total,
      valor_m2: l.valor_m2,
      status: String(l.status || 'disponivel').toLowerCase(),
      svg_path: l.svg_path.trim(),
      label_x: l.label_x ?? null,
      label_y: l.label_y ?? null,
    }));

    const { data, error } = await supabase.from('lotes').insert(payloads).select();
    if (error) {
      logSupabaseError('createLotesBatch', error);
      throw new Error('Não foi possível importar os lotes em lote.');
    }
    return (data || []) as Lote[];
  }

  async updateObraMapa(
    obraId: string,
    dados: {
      mapa_masterplan_url?: string | null;
      mapa_viewbox?: string | null;
      mapa_img_transform?: Record<string, number> | null;
    }
  ): Promise<Obra> {
    const payload: Record<string, unknown> = {};
    if ('mapa_masterplan_url' in dados) payload.mapa_masterplan_url = dados.mapa_masterplan_url;
    if ('mapa_viewbox' in dados) payload.mapa_viewbox = dados.mapa_viewbox;
    if ('mapa_img_transform' in dados) payload.mapa_img_transform = dados.mapa_img_transform;

    const { data, error } = await supabase
      .from('obras')
      .update(payload)
      .eq('id', obraId)
      .select()
      .single();

    if (error) {
      logSupabaseError('updateObraMapa', error);
      throw new Error('Não foi possível atualizar o mapa da obra.');
    }
    return data as Obra;
  }

  // ============================================================
  // CONVITES (fonte real de RBAC por obra — ver has_obra_access() no schema.sql)
  // ============================================================
  async getConvites(obraId?: string): Promise<Convite[]> {
    let query = supabase.from('convites').select('*').order('created_at', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError('getConvites', error);
      return [];
    }
    // Aliases camelCase para compatibilidade com telas que usam o formato legado.
    return (data || []).map((row: Record<string, unknown>) => mapConviteRow(row)) as Convite[];
  }

  async saveConvite(convite: Partial<Convite> & { obra_id: string; email: string }): Promise<Convite> {
    const anyConvite = convite as any;
    const payload = clean({
      obra_id: convite.obra_id,
      nome: convite.nome || null,
      email: convite.email.toLowerCase().trim(),
      telefone: convite.telefone || null,
      role: convite.role || 'CLIENTE_COMPRADOR',
      quadra_lote: anyConvite.quadraLote || anyConvite.quadra_lote || null,
      ativo: convite.ativo ?? true,
      status_cadastro: anyConvite.statusCadastro || 'PENDENTE',
      link_acesso: convite.link_acesso || anyConvite.linkAcceso || null
    });

    const query = convite.id
      ? supabase.from('convites').update(payload).eq('id', convite.id).select().single()
      : supabase.from('convites').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveConvite', error);
      throw new Error('Não foi possível salvar o convite. Apenas administradores podem gerenciar convites.');
    }
    return mapConviteRow(data as Record<string, unknown>);
  }

  async deleteConvite(id: string): Promise<void> {
    const { error } = await supabase.from('convites').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteConvite', error);
      throw new Error('Não foi possível excluir o convite.');
    }
  }

  // ============================================================
  // NOTIFICAÇÕES (sino do convidado)
  // ============================================================
  async getNotificacoes(): Promise<Notificacao[]> {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) {
      logSupabaseError('getNotificacoes', error);
      return [];
    }
    return (data || []) as Notificacao[];
  }

  async marcarNotificacaoLida(id: string): Promise<void> {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      logSupabaseError('marcarNotificacaoLida', error);
    }
  }

  async marcarTodasNotificacoesLidas(): Promise<void> {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('lida', false);
    if (error) {
      logSupabaseError('marcarTodasNotificacoesLidas', error);
    }
  }

  async registrarDispositivoPush(token: string, plataforma: 'web' | 'android' | 'ios' = 'web'): Promise<void> {
    const { data: sessao } = await supabase.auth.getUser();
    const user = sessao?.user;
    if (!user?.email) return;
    const { error } = await supabase.from('dispositivos_push').upsert(
      {
        user_id: user.id,
        email: user.email.toLowerCase(),
        token,
        plataforma
      },
      { onConflict: 'token' }
    );
    if (error) {
      logSupabaseError('registrarDispositivoPush', error);
    }
  }

  // ============================================================
  // RELATÓRIOS EXECUTIVOS (PDF)
  // ============================================================
  async getRelatoriosObra(obraId: string): Promise<RelatorioObra[]> {
    const { data, error } = await supabase
      .from('relatorios_obra')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });
    if (error) {
      logSupabaseError('getRelatoriosObra', error);
      return [];
    }
    return (data || []) as RelatorioObra[];
  }

  async createRelatorioObra(payload: Omit<RelatorioObra, 'id' | 'created_at'>): Promise<RelatorioObra> {
    const { data, error } = await supabase
      .from('relatorios_obra')
      .insert(clean(payload))
      .select()
      .single();
    if (error) {
      logSupabaseError('createRelatorioObra', error);
      throw new Error('Não foi possível salvar o relatório.');
    }
    return data as RelatorioObra;
  }

  async deleteRelatorioObra(id: string): Promise<void> {
    const { error } = await supabase.from('relatorios_obra').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteRelatorioObra', error);
      throw new Error('Não foi possível excluir o relatório.');
    }
  }
}

export const dataService = new SupabaseDataService();
export const apiService = dataService;
