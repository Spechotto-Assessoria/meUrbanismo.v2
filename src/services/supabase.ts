import { supabase } from '../lib/supabaseClient';
import { MOCK_MACRO_ETAPAS } from './mockData';

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

function logSupabaseError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[dataService] ❌ Falha em "${context}": ${message}\n` +
    'Verifique se o script src/services/schema.sql já foi executado no SQL Editor do seu projeto Supabase.'
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

  async saveEmpresa(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
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

    const { data, error } = await supabase.from('empresas').insert(payload).select().single();
    if (error) {
      logSupabaseError('saveEmpresa', error);
      // Código 23505 = violação de restrição "unique" no Postgres. Neste caso é
      // sempre o CNPJ (única coluna com "unique" na tabela "empresas").
      if (error.code === '23505' || /duplicate key|cnpj/i.test(error.message)) {
        throw new Error('Já existe uma empresa cadastrada com este CNPJ.');
      }
      throw new Error('Não foi possível salvar a empresa. Verifique suas permissões e a configuração do banco.');
    }
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

  async saveObra(obra: Omit<Obra, 'id'>): Promise<Obra> {
    // Aceita tanto o formato snake_case (banco) quanto o camelCase legado
    // usado pelo formulário "Nova Obra".
    const anyObra = obra as any;
    const payload = clean({
      empresa_id: anyObra.empresa_id || anyObra.empresaId || null,
      nome: obra.nome,
      tipo: obra.tipo || 'Loteamento Fechado',
      cidade: obra.cidade || '',
      uf: obra.uf || 'SP',
      status: obra.status || 'Planejamento',
      descricao: obra.descricao || null,
      endereco: obra.endereco || null,
      data_inicio: obra.data_inicio || anyObra.dataInicio || null,
      data_previsao: obra.data_previsao || anyObra.dataEntrega || null,
      area_total_m2: obra.area_total_m2 ?? anyObra.areaM2 ?? 0,
      metragem_padrao_lote: anyObra.metragemPadraoLote ?? 0,
      total_lotes: obra.total_lotes ?? anyObra.qtdLotes ?? 0,
      lotes_vendidos: obra.lotes_vendidos ?? 0,
      lotes_disponiveis: obra.lotes_disponiveis ?? (obra.total_lotes ?? anyObra.qtdLotes ?? 0),
      valor_vgv: obra.valor_vgv ?? anyObra.valorGlobal ?? 0,
      custo_orcado: obra.custo_orcado ?? 0,
      custo_realizado: obra.custo_realizado ?? 0,
      percentual_concluido: obra.percentual_concluido ?? 0,
      foto_capa: obra.foto_capa || null
    });

    const { data, error } = await supabase.from('obras').insert(payload).select().single();
    if (error) {
      logSupabaseError('saveObra', error);
      throw new Error('Não foi possível salvar a obra. Apenas administradores podem cadastrar novas obras.');
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
    const payload = clean({ ...diario });
    delete (payload as any).id;

    const query = diario.id
      ? supabase.from('diario_obra').update(payload).eq('id', diario.id).select().single()
      : supabase.from('diario_obra').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveDiario', error);
      throw new Error('Não foi possível salvar o diário de obra.');
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
    return (data || []) as MedicaoItem[];
  }

  async saveMedicao(medicao: Partial<MedicaoItem>): Promise<MedicaoItem> {
    const payload = clean({ ...medicao });
    delete (payload as any).id;

    // Medições são gravadas na tabela base (não na view) — apenas quem tem
    // permissão financeira/admin consegue inserir, conforme RLS.
    const query = medicao.id
      ? supabase.from('medicoes').update(payload).eq('id', medicao.id).select().single()
      : supabase.from('medicoes').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveMedicao', error);
      throw new Error('Não foi possível salvar a medição.');
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
    const anyDoc = doc as any;
    const payload = clean({
      obra_id: doc.obra_id,
      titulo: doc.titulo || anyDoc.nome || 'Documento',
      categoria: doc.categoria || null,
      codigo_revisao: doc.codigo_revisao || null,
      data_emissao: doc.data_emissao || null,
      tamanho_bytes: doc.tamanho_bytes ?? null,
      tipo_extensao: doc.tipo_extensao || 'pdf',
      arquivo_url: doc.arquivo_url || anyDoc.url || '#',
      visivel_convidados: doc.visivel_convidados ?? false,
      responsavel_tecnico: doc.responsavel_tecnico || null,
      descricao: doc.descricao || null
    });

    const query = doc.id
      ? supabase.from('obra_arquivos').update(payload).eq('id', doc.id).select().single()
      : supabase.from('obra_arquivos').insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      logSupabaseError('saveDocumento', error);
      throw new Error('Não foi possível salvar o documento.');
    }
    return data as DocumentoObra;
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

  async updateLoteStatus(loteId: string, status: Lote['status']): Promise<void> {
    const normalizado = String(status || '').toLowerCase();
    const { error } = await supabase.from('lotes').update({ status: normalizado }).eq('id', loteId);
    if (error) {
      logSupabaseError('updateLoteStatus', error);
      throw new Error('Não foi possível atualizar o status do lote.');
    }
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
    return (data || []).map((row: any) => ({
      ...row,
      obraId: row.obra_id,
      quadraLote: row.quadra_lote,
      statusCadastro: row.status_cadastro,
      dataCriacao: row.created_at,
      linkAcceso: row.link_acesso
    })) as Convite[];
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
    return data as Convite;
  }

  async deleteConvite(id: string): Promise<void> {
    const { error } = await supabase.from('convites').delete().eq('id', id);
    if (error) {
      logSupabaseError('deleteConvite', error);
      throw new Error('Não foi possível excluir o convite.');
    }
  }
}

export const dataService = new SupabaseDataService();
export const apiService = dataService;
