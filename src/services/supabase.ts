import {
  MOCK_EMPRESAS,
  MOCK_OBRAS,
  MOCK_USERS,
  MOCK_MACRO_ETAPAS,
  MOCK_ORCAMENTOS,
  MOCK_CRONOGRAMAS,
  MOCK_DIARIOS,
  MOCK_MEDICOES,
  MOCK_FOTOS,
  MOCK_DOCUMENTOS,
  MOCK_VIABILIDADE,
  MOCK_LOTES,
  MOCK_CONVITES
} from './mockData';

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

class LocalStorageService {
  private getItem<T>(key: string, defaultData: T): T {
    try {
      const item = localStorage.getItem(`meurbanismo_${key}`);
      return item ? JSON.parse(item) : defaultData;
    } catch {
      return defaultData;
    }
  }

  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`meurbanismo_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
  }

  // EMPRESAS
  async getEmpresas(): Promise<Empresa[]> {
    return this.getItem<Empresa[]>('empresas', MOCK_EMPRESAS);
  }

  async saveEmpresa(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
    const list = await this.getEmpresas();
    const nova: Empresa = { ...empresa, id: `emp-${Date.now()}` };
    this.setItem('empresas', [nova, ...list]);
    return nova;
  }

  // OBRAS
  async getObras(): Promise<Obra[]> {
    return this.getItem<Obra[]>('obras', MOCK_OBRAS);
  }

  async saveObra(obra: Omit<Obra, 'id'>): Promise<Obra> {
    const list = await this.getObras();
    const nova: Obra = { ...obra, id: `obra-${Date.now()}` };
    this.setItem('obras', [nova, ...list]);
    return nova;
  }

  // USERS / PERFIS
  async getUsers(): Promise<UserProfile[]> {
    return this.getItem<UserProfile[]>('users', MOCK_USERS);
  }

  // MACRO ETAPAS
  async getMacroEtapas(): Promise<MacroEtapa[]> {
    return MOCK_MACRO_ETAPAS;
  }

  // ORÇAMENTO
  async getOrcamentos(obraId: string): Promise<OrcamentoItem[]> {
    const local = this.getItem<OrcamentoItem[]>('orcamentos', MOCK_ORCAMENTOS);
    return local.filter(i => i.obra_id === obraId || !obraId);
  }

  async saveOrcamento(item: Omit<OrcamentoItem, 'id'>): Promise<OrcamentoItem> {
    const list = this.getItem<OrcamentoItem[]>('orcamentos', MOCK_ORCAMENTOS);
    const novo: OrcamentoItem = { ...item, id: `orc-${Date.now()}` };
    this.setItem('orcamentos', [novo, ...list]);
    return novo;
  }

  // CRONOGRAMA
  async getCronograma(obraId: string): Promise<CronogramaItem[]> {
    const local = this.getItem<CronogramaItem[]>('cronograma', MOCK_CRONOGRAMAS);
    return local.filter(c => c.obra_id === obraId || !obraId);
  }

  // DIÁRIO DE OBRA
  async getDiarios(obraId: string, isPublicView = false): Promise<DiarioObra[]> {
    let local = this.getItem<DiarioObra[]>('diarios', MOCK_DIARIOS).filter(d => d.obra_id === obraId || !obraId);
    if (isPublicView) {
      local = local.filter(d => d.visivel_convidados);
    }
    return local;
  }

  async saveDiario(diario: Omit<DiarioObra, 'id'>): Promise<DiarioObra> {
    const list = this.getItem<DiarioObra[]>('diarios', MOCK_DIARIOS);
    const novo: DiarioObra = { ...diario, id: `diario-${Date.now()}` };
    this.setItem('diarios', [novo, ...list]);
    return novo;
  }

  // MEDIÇÕES
  async getMedicoes(obraId: string, isPublicView = false): Promise<MedicaoItem[]> {
    let local = this.getItem<MedicaoItem[]>('medicoes', MOCK_MEDICOES).filter(m => m.obra_id === obraId || !obraId);
    if (isPublicView) {
      local = local.filter(m => m.visivel_convidados);
    }
    return local;
  }

  async saveMedicao(medicao: Omit<MedicaoItem, 'id'>): Promise<MedicaoItem> {
    const list = this.getItem<MedicaoItem[]>('medicoes', MOCK_MEDICOES);
    const nova: MedicaoItem = { ...medicao, id: `med-${Date.now()}` };
    this.setItem('medicoes', [nova, ...list]);
    return nova;
  }

  // FOTOS DE OBRA
  async getFotos(obraId: string, isPublicView = false): Promise<FotoObra[]> {
    let local = this.getItem<FotoObra[]>('fotos', MOCK_FOTOS).filter(f => f.obra_id === obraId || !obraId);
    if (isPublicView) {
      local = local.filter(f => f.visivel_convidados);
    }
    return local;
  }

  async saveFoto(foto: Omit<FotoObra, 'id'>): Promise<FotoObra> {
    const list = this.getItem<FotoObra[]>('fotos', MOCK_FOTOS);
    const nova: FotoObra = { ...foto, id: `ft-${Date.now()}` };
    this.setItem('fotos', [nova, ...list]);
    return nova;
  }

  // DOCUMENTOS
  async getDocumentos(obraId: string, isPublicView = false): Promise<DocumentoObra[]> {
    let local = this.getItem<DocumentoObra[]>('documentos', MOCK_DOCUMENTOS).filter(d => d.obra_id === obraId || !obraId);
    if (isPublicView) {
      local = local.filter(d => d.visivel_convidados);
    }
    return local;
  }

  async saveDocumento(doc: Omit<DocumentoObra, 'id'>): Promise<DocumentoObra> {
    const list = this.getItem<DocumentoObra[]>('documentos', MOCK_DOCUMENTOS);
    const novo: DocumentoObra = { ...doc, id: `doc-${Date.now()}` };
    this.setItem('documentos', [novo, ...list]);
    return novo;
  }

  // VIABILIDADE
  async getViabilidade(obraId: string): Promise<ViabilidadeEstudo> {
    return MOCK_VIABILIDADE;
  }

  // LOTES / MAPA DE DISPONIBILIDADE
  async getLotes(obraId: string): Promise<Lote[]> {
    const local = this.getItem<Lote[]>('lotes', MOCK_LOTES);
    return local.filter(l => l.obra_id === obraId || !obraId);
  }

  async updateLoteStatus(loteId: string, status: Lote['status']): Promise<void> {
    const list = this.getItem<Lote[]>('lotes', MOCK_LOTES);
    const updated = list.map(l => l.id === loteId ? { ...l, status } : l);
    this.setItem('lotes', updated);
  }

  // CONVITES
  async getConvites(obraId?: string): Promise<Convite[]> {
    const local = this.getItem<Convite[]>('convites', MOCK_CONVITES);
    return local.filter(c => (c.obraId === obraId || c.obra_id === obraId) || !obraId);
  }

  async saveConvite(convite: Omit<Convite, 'id'>): Promise<Convite> {
    const list = this.getItem<Convite[]>('convites', MOCK_CONVITES);
    const novo: Convite = { ...convite, id: `conv-${Date.now()}` };
    this.setItem('convites', [novo, ...list]);
    return novo;
  }
}

export const dataService = new LocalStorageService();
export const apiService = dataService;