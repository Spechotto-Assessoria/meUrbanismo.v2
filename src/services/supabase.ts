import { createClient } from '@supabase/supabase-js';
import { 
  MOCK_EMPRESA, 
  MOCK_OBRAS, 
  MOCK_ORCAMENTOS, 
  MOCK_CRONOGRAMA, 
  MOCK_DIARIOS, 
  MOCK_MEDICOES, 
  MOCK_FOTOS, 
  MOCK_DOCUMENTOS, 
  MOCK_VIABILIDADE, 
  MOCK_LOTES, 
  MOCK_CONVITES 
} from './mockData';
import { 
  Obra, 
  OrcamentoItem, 
  CronogramaItem, 
  DiarioObra, 
  MedicaoItem, 
  FotoObra, 
  DocumentoObra, 
  ViabilidadeEstudo, 
  Lote, 
  Convite,
  Empresa
} from '../types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jckwmrwskgtbfttfgykb.supabase.co';
// Limpeza da URL para inicialização correta do cliente do Supabase
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Chaves do LocalStorage para persistência de estado local (Offline / Fallback Resiliente)
const STORAGE_KEYS = {
  EMPRESA: 'meurbanismo_empresa',
  OBRAS: 'meurbanismo_obras',
  ORCAMENTOS: 'meurbanismo_orcamentos',
  CRONOGRAMA: 'meurbanismo_cronograma',
  DIARIOS: 'meurbanismo_diarios',
  MEDICOES: 'meurbanismo_medicoes',
  FOTOS: 'meurbanismo_fotos',
  DOCUMENTOS: 'meurbanismo_documentos',
  VIABILIDADE: 'meurbanismo_viabilidade',
  LOTES: 'meurbanismo_lotes',
  CONVITES: 'meurbanismo_convites'
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Erro ao salvar no storage local:', err);
  }
}

// --------------------------------------------------------------------------------
// SERVIÇOS DE DADOS COM SUPABASE + FALLBACK RESILIENTE
// --------------------------------------------------------------------------------

export const apiService = {
  // OBRAS
  async getObras(): Promise<Obra[]> {
    try {
      const { data, error } = await supabase.from('obras').select('*');
      if (error || !data || data.length === 0) {
        return getLocalData(STORAGE_KEYS.OBRAS, MOCK_OBRAS);
      }
      return data as Obra[];
    } catch {
      return getLocalData(STORAGE_KEYS.OBRAS, MOCK_OBRAS);
    }
  },

  async saveObra(obra: Obra): Promise<Obra> {
    const obras = getLocalData<Obra[]>(STORAGE_KEYS.OBRAS, MOCK_OBRAS);
    const index = obras.findIndex(o => o.id === obra.id);
    let updatedObras: Obra[];
    if (index >= 0) {
      updatedObras = [...obras];
      updatedObras[index] = obra;
    } else {
      updatedObras = [obra, ...obras];
    }
    setLocalData(STORAGE_KEYS.OBRAS, updatedObras);

    try {
      await supabase.from('obras').upsert(obra);
    } catch (e) {
      console.warn('Salvando offline:', e);
    }
    return obra;
  },

  // EMPRESA
  async getEmpresa(): Promise<Empresa> {
    try {
      const { data, error } = await supabase.from('empresas').select('*').limit(1).single();
      if (error || !data) {
        return getLocalData(STORAGE_KEYS.EMPRESA, MOCK_EMPRESA);
      }
      return data as Empresa;
    } catch {
      return getLocalData(STORAGE_KEYS.EMPRESA, MOCK_EMPRESA);
    }
  },

  async saveEmpresa(empresa: Empresa): Promise<Empresa> {
    setLocalData(STORAGE_KEYS.EMPRESA, empresa);
    try {
      await supabase.from('empresas').upsert(empresa);
    } catch (e) {
      console.warn('Salvando empresa offline:', e);
    }
    return empresa;
  },

  // ORÇAMENTOS
  async getOrcamentos(obraId: string): Promise<OrcamentoItem[]> {
    try {
      const { data, error } = await supabase.from('orcamentos').select('*').eq('obra_id', obraId);
      if (error || !data || data.length === 0) {
        const local = getLocalData<OrcamentoItem[]>(STORAGE_KEYS.ORCAMENTOS, MOCK_ORCAMENTOS);
        return local.filter(item => item.obra_id === obraId || !obraId);
      }
      return data as OrcamentoItem[];
    } catch {
      const local = getLocalData<OrcamentoItem[]>(STORAGE_KEYS.ORCAMENTOS, MOCK_ORCAMENTOS);
      return local.filter(item => item.obra_id === obraId || !obraId);
    }
  },

  async saveOrcamentoItem(item: OrcamentoItem): Promise<OrcamentoItem> {
    const list = getLocalData<OrcamentoItem[]>(STORAGE_KEYS.ORCAMENTOS, MOCK_ORCAMENTOS);
    const index = list.findIndex(i => i.id === item.id);
    let updated: OrcamentoItem[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = item;
    } else {
      updated = [item, ...list];
    }
    setLocalData(STORAGE_KEYS.ORCAMENTOS, updated);
    try {
      await supabase.from('orcamentos').upsert(item);
    } catch (e) {
      console.warn('Salvando item de orçamento offline:', e);
    }
    return item;
  },

  // CRONOGRAMA
  async getCronograma(obraId: string): Promise<CronogramaItem[]> {
    try {
      const { data, error } = await supabase.from('cronograma').select('*').eq('obra_id', obraId).order('mes_ano');
      if (error || !data || data.length === 0) {
        const local = getLocalData<CronogramaItem[]>(STORAGE_KEYS.CRONOGRAMA, MOCK_CRONOGRAMA);
        return local.filter(item => item.obra_id === obraId || !obraId);
      }
      return data as CronogramaItem[];
    } catch {
      const local = getLocalData<CronogramaItem[]>(STORAGE_KEYS.CRONOGRAMA, MOCK_CRONOGRAMA);
      return local.filter(item => item.obra_id === obraId || !obraId);
    }
  },

  // DIÁRIOS DE OBRA
  async getDiarios(obraId: string): Promise<DiarioObra[]> {
    try {
      const { data, error } = await supabase.from('diario_obra').select('*').eq('obra_id', obraId).order('data', { ascending: false });
      if (error || !data || data.length === 0) {
        const local = getLocalData<DiarioObra[]>(STORAGE_KEYS.DIARIOS, MOCK_DIARIOS);
        return local.filter(d => d.obra_id === obraId || !obraId);
      }
      return data as DiarioObra[];
    } catch {
      const local = getLocalData<DiarioObra[]>(STORAGE_KEYS.DIARIOS, MOCK_DIARIOS);
      return local.filter(d => d.obra_id === obraId || !obraId);
    }
  },

  async saveDiario(diario: DiarioObra): Promise<DiarioObra> {
    const list = getLocalData<DiarioObra[]>(STORAGE_KEYS.DIARIOS, MOCK_DIARIOS);
    const updated = [diario, ...list.filter(d => d.id !== diario.id)];
    setLocalData(STORAGE_KEYS.DIARIOS, updated);
    try {
      await supabase.from('diario_obra').upsert(diario);
    } catch (e) {
      console.warn('Salvando diário offline:', e);
    }
    return diario;
  },

  // MEDIÇÕES
  async getMedicoes(obraId: string): Promise<MedicaoItem[]> {
    try {
      const { data, error } = await supabase.from('medicoes').select('*').eq('obra_id', obraId).order('numero_medicao', { ascending: false });
      if (error || !data || data.length === 0) {
        const local = getLocalData<MedicaoItem[]>(STORAGE_KEYS.MEDICOES, MOCK_MEDICOES);
        return local.filter(m => m.obra_id === obraId || !obraId);
      }
      return data as MedicaoItem[];
    } catch {
      const local = getLocalData<MedicaoItem[]>(STORAGE_KEYS.MEDICOES, MOCK_MEDICOES);
      return local.filter(m => m.obra_id === obraId || !obraId);
    }
  },

  async saveMedicao(medicao: MedicaoItem): Promise<MedicaoItem> {
    const list = getLocalData<MedicaoItem[]>(STORAGE_KEYS.MEDICOES, MOCK_MEDICOES);
    const updated = [medicao, ...list.filter(m => m.id !== medicao.id)];
    setLocalData(STORAGE_KEYS.MEDICOES, updated);
    try {
      await supabase.from('medicoes').upsert(medicao);
    } catch (e) {
      console.warn('Salvando medição offline:', e);
    }
    return medicao;
  },

  // FOTOS DE OBRA
  async getFotos(obraId: string, apenasVisivelConvidados: boolean = false): Promise<FotoObra[]> {
    try {
      let query = supabase.from('fotos_obra').select('*').eq('obra_id', obraId);
      if (apenasVisivelConvidados) {
        query = query.eq('visivel_convidados', true);
      }
      const { data, error } = await query.order('data_registro', { ascending: false });
      if (error || !data || data.length === 0) {
        let local = getLocalData<FotoObra[]>(STORAGE_KEYS.FOTOS, MOCK_FOTOS);
        local = local.filter(f => f.obra_id === obraId || !obraId);
        if (apenasVisivelConvidados) {
          local = local.filter(f => f.visivel_convidados);
        }
        return local;
      }
      return data as FotoObra[];
    } catch {
      let local = getLocalData<FotoObra[]>(STORAGE_KEYS.FOTOS, MOCK_FOTOS);
      local = local.filter(f => f.obra_id === obraId || !obraId);
      if (apenasVisivelConvidados) {
        local = local.filter(f => f.visivel_convidados);
      }
      return local;
    }
  },

  async saveFoto(foto: FotoObra): Promise<FotoObra> {
    const list = getLocalData<FotoObra[]>(STORAGE_KEYS.FOTOS, MOCK_FOTOS);
    const index = list.findIndex(f => f.id === foto.id);
    let updated: FotoObra[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = foto;
    } else {
      updated = [foto, ...list];
    }
    setLocalData(STORAGE_KEYS.FOTOS, updated);
    try {
      await supabase.from('fotos_obra').upsert(foto);
    } catch (e) {
      console.warn('Salvando foto offline:', e);
    }
    return foto;
  },

  // DOCUMENTOS E PROJETOS
  async getDocumentos(obraId: string, apenasVisivelConvidados: boolean = false): Promise<DocumentoObra[]> {
    try {
      let query = supabase.from('obra_arquivos').select('*').eq('obra_id', obraId);
      if (apenasVisivelConvidados) {
        query = query.eq('visivel_convidados', true);
      }
      const { data, error } = await query.order('data_emissao', { ascending: false });
      if (error || !data || data.length === 0) {
        let local = getLocalData<DocumentoObra[]>(STORAGE_KEYS.DOCUMENTOS, MOCK_DOCUMENTOS);
        local = local.filter(d => d.obra_id === obraId || !obraId);
        if (apenasVisivelConvidados) {
          local = local.filter(d => d.visivel_convidados);
        }
        return local;
      }
      return data as DocumentoObra[];
    } catch {
      let local = getLocalData<DocumentoObra[]>(STORAGE_KEYS.DOCUMENTOS, MOCK_DOCUMENTOS);
      local = local.filter(d => d.obra_id === obraId || !obraId);
      if (apenasVisivelConvidados) {
        local = local.filter(d => d.visivel_convidados);
      }
      return local;
    }
  },

  async saveDocumento(doc: DocumentoObra): Promise<DocumentoObra> {
    const list = getLocalData<DocumentoObra[]>(STORAGE_KEYS.DOCUMENTOS, MOCK_DOCUMENTOS);
    const index = list.findIndex(d => d.id === doc.id);
    let updated: DocumentoObra[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = doc;
    } else {
      updated = [doc, ...list];
    }
    setLocalData(STORAGE_KEYS.DOCUMENTOS, updated);
    try {
      await supabase.from('obra_arquivos').upsert(doc);
    } catch (e) {
      console.warn('Salvando documento offline:', e);
    }
    return doc;
  },

  // ESTUDO DE VIABILIDADE
  async getViabilidade(obraId: string): Promise<ViabilidadeEstudo> {
    try {
      const { data, error } = await supabase.from('viabilidade').select('*').eq('obra_id', obraId).single();
      if (error || !data) {
        return getLocalData(STORAGE_KEYS.VIABILIDADE, MOCK_VIABILIDADE);
      }
      return data as ViabilidadeEstudo;
    } catch {
      return getLocalData(STORAGE_KEYS.VIABILIDADE, MOCK_VIABILIDADE);
    }
  },

  async saveViabilidade(viabilidade: ViabilidadeEstudo): Promise<ViabilidadeEstudo> {
    setLocalData(STORAGE_KEYS.VIABILIDADE, viabilidade);
    try {
      await supabase.from('viabilidade').upsert(viabilidade);
    } catch (e) {
      console.warn('Salvando viabilidade offline:', e);
    }
    return viabilidade;
  },

  // LOTES (MAPA DE DISPONIBILIDADE)
  async getLotes(obraId: string): Promise<Lote[]> {
    try {
      const { data, error } = await supabase.from('lotes').select('*').eq('obra_id', obraId);
      if (error || !data || data.length === 0) {
        const local = getLocalData<Lote[]>(STORAGE_KEYS.LOTES, MOCK_LOTES);
        return local.filter(l => l.obra_id === obraId || !obraId);
      }
      return data as Lote[];
    } catch {
      const local = getLocalData<Lote[]>(STORAGE_KEYS.LOTES, MOCK_LOTES);
      return local.filter(l => l.obra_id === obraId || !obraId);
    }
  },

  async saveLote(lote: Lote): Promise<Lote> {
    const list = getLocalData<Lote[]>(STORAGE_KEYS.LOTES, MOCK_LOTES);
    const updated = list.map(l => l.id === lote.id ? lote : l);
    setLocalData(STORAGE_KEYS.LOTES, updated);
    try {
      await supabase.from('lotes').upsert(lote);
    } catch (e) {
      console.warn('Salvando lote offline:', e);
    }
    return lote;
  },

  // CONVITES INTELIGENTES
  async getConvites(obraId: string): Promise<Convite[]> {
    try {
      const { data, error } = await supabase.from('convites').select('*').eq('obra_id', obraId).order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        const local = getLocalData<Convite[]>(STORAGE_KEYS.CONVITES, MOCK_CONVITES);
        return local.filter(c => c.obra_id === obraId || !obraId);
      }
      return data as Convite[];
    } catch {
      const local = getLocalData<Convite[]>(STORAGE_KEYS.CONVITES, MOCK_CONVITES);
      return local.filter(c => c.obra_id === obraId || !obraId);
    }
  },

  async createConvite(convite: Convite): Promise<Convite> {
    const list = getLocalData<Convite[]>(STORAGE_KEYS.CONVITES, MOCK_CONVITES);
    const updated = [convite, ...list];
    setLocalData(STORAGE_KEYS.CONVITES, updated);
    try {
      await supabase.from('convites').insert(convite);
    } catch (e) {
      console.warn('Salvando convite offline:', e);
    }
    return convite;
  }
};
