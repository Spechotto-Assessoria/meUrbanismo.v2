import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentoObra } from '../../types';
import { apiService } from '../../services/supabase';
import { SkeletonTable } from '../common/SkeletonLoader';
import { 
  FolderGit2, 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  Plus, 
  Filter, 
  CheckCircle, 
  X,
  FileCode2,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

export const DocumentosTab: React.FC = () => {
  const { activeObra, isAdmin, canViewFinancials } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [novoDoc, setNovoDoc] = useState({
    titulo: '',
    categoria: 'Urbanístico' as any,
    codigo_revisao: 'R01',
    tipo_extensao: 'PDF' as any,
    responsavel_tecnico: 'Eng. Rennan Spechotto (CREA 5069248190)',
    descricao: '',
    visivel_convidados: true
  });

  const loadData = async () => {
    if (!activeObra) return;
    setLoading(true);
    // Usuários sem acesso a dados internos (corretores e clientes) veem apenas documentos públicos
    const apenasConvidados = !canViewFinancials;
    const data = await apiService.getDocumentos(activeObra.id, apenasConvidados);
    setDocumentos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id, canViewFinancials]);

  const handleToggleVisibilidade = async (doc: DocumentoObra) => {
    if (!isAdmin) return;
    const atualizado: DocumentoObra = {
      ...doc,
      visivel_convidados: !doc.visivel_convidados
    };
    await apiService.saveDocumento(atualizado);
    setToastMessage(`Visibilidade alterada para ${atualizado.visivel_convidados ? '🌐 Convidados' : '🔒 Admin'}`);
    setTimeout(() => setToastMessage(null), 2500);
    await loadData();
  };

  const handleSalvarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObra || !novoDoc.titulo) return;

    const item: DocumentoObra = {
      id: `doc-${Date.now()}`,
      obra_id: activeObra.id,
      titulo: novoDoc.titulo,
      categoria: novoDoc.categoria,
      codigo_revisao: novoDoc.codigo_revisao || 'R01',
      data_emissao: new Date().toISOString().split('T')[0],
      tamanho_bytes: 8500000,
      tipo_extensao: novoDoc.tipo_extensao,
      arquivo_url: '#',
      visivel_convidados: novoDoc.visivel_convidados,
      responsavel_tecnico: novoDoc.responsavel_tecnico,
      descricao: novoDoc.descricao
    };

    await apiService.saveDocumento(item);
    await loadData();
    setShowAddModal(false);
    setNovoDoc({
      titulo: '',
      categoria: 'Urbanístico',
      codigo_revisao: 'R01',
      tipo_extensao: 'PDF',
      responsavel_tecnico: 'Eng. Rennan Spechotto (CREA 5069248190)',
      descricao: '',
      visivel_convidados: true
    });
  };

  const categorias = ['TODAS', ...Array.from(new Set(documentos.map(d => d.categoria)))];
  const docsFiltrados = categoriaFiltro === 'TODAS'
    ? documentos
    : documentos.filter(d => d.categoria === categoriaFiltro);

  const getExtensaoIcon = (ext: string) => {
    switch (ext) {
      case 'DWG':
        return <FileCode2 className="w-5 h-5 text-amber-400" />;
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      default:
        return <FileText className="w-5 h-5 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* HEADER DA ABA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-400" />
            Repositório de Projetos e Documentos
          </h3>
          <p className="text-xs text-slate-400">
            Arquivos técnicos aprovados, memoriais, alvarás e licenças ambientais
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-xs font-semibold text-white shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Documento
          </button>
        )}
      </div>

      {/* TOAST DE FEEDBACK DE VISIBILIDADE */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-brand-400" />
          {toastMessage}
        </div>
      )}

      {/* FILTRO DE CATEGORIAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold pl-1">
          <Filter className="w-3.5 h-3.5" />
        </span>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaFiltro(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              categoriaFiltro === cat
                ? 'bg-brand-500 text-white shadow-glow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LISTA COMPACTA SEM ESTOURO HORIZONTAL (OVERFLOW-X-HIDDEN COM 2 LINHAS) */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : (
        <div className="space-y-2.5">
          {docsFiltrados.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-navy-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2 max-w-full overflow-x-hidden"
            >
              {/* LINHA 1: ÍCONE, TÍTULO, BADGE DE CATEGORIA E TOGGLE VISIBILIDADE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-navy-950 border border-slate-800 shrink-0 mt-0.5">
                    {getExtensaoIcon(doc.tipo_extensao)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                      {doc.titulo}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 text-[10px] font-semibold border border-brand-500/20">
                        {doc.categoria}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.codigo_revisao}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÃO TOGGLE VISIBILIDADE (ADMIN) OU BADGE INFORMATIVO */}
                {isAdmin ? (
                  <button
                    onClick={() => handleToggleVisibilidade(doc)}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border transition-colors ${
                      doc.visivel_convidados
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                    title="Alternar visibilidade para Convidados"
                  >
                    {doc.visivel_convidados ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>🌐 Convidados</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-amber-400" />
                        <span>🔒 Admin</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> Público
                  </span>
                )}
              </div>

              {/* LINHA 2: DETALHES, RESPONSÁVEL TÉCNICO E BOTÕES DE AÇÃO */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="truncate max-w-[70%] text-slate-400">
                  <span className="text-slate-500">Resp.:</span> {doc.responsavel_tecnico}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {(doc.tamanho_bytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                  
                  <button
                    onClick={() => alert(`Download iniciado para: ${doc.titulo}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-brand-500/20 text-slate-200 hover:text-brand-300 border border-slate-700 hover:border-brand-500/40 font-semibold text-[10px] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Baixar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO DOCUMENTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white">Cadastrar Projeto / Documento</h3>

            <form onSubmit={handleSalvarDocumento} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título do Documento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Projeto Executivo de Redes de Água e Esgoto"
                  value={novoDoc.titulo}
                  onChange={e => setNovoDoc({ ...novoDoc, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoria Técnica</label>
                  <select
                    value={novoDoc.categoria}
                    onChange={e => setNovoDoc({ ...novoDoc, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="Urbanístico">Urbanístico</option>
                    <option value="Arquitetônico">Arquitetônico</option>
                    <option value="Estrutural">Estrutural</option>
                    <option value="Drenagem">Drenagem</option>
                    <option value="Elétrico">Elétrico</option>
                    <option value="Hidrossanitário">Hidrossanitário</option>
                    <option value="Licenças Ambientais">Licenças Ambientais</option>
                    <option value="Alvarás e Jurídico">Alvarás e Jurídico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Formato</label>
                  <select
                    value={novoDoc.tipo_extensao}
                    onChange={e => setNovoDoc({ ...novoDoc, tipo_extensao: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DWG">DWG (AutoCAD)</option>
                    <option value="XLSX">XLSX (Planilha)</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Revisão</label>
                  <input
                    type="text"
                    value={novoDoc.codigo_revisao}
                    onChange={e => setNovoDoc({ ...novoDoc, codigo_revisao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Responsável Técnico</label>
                  <input
                    type="text"
                    value={novoDoc.responsavel_tecnico}
                    onChange={e => setNovoDoc({ ...novoDoc, responsavel_tecnico: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={2}
                  value={novoDoc.descricao}
                  onChange={e => setNovoDoc({ ...novoDoc, descricao: e.target.value })}
                  placeholder="Informações adicionais da aprovação..."
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-navy-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="docVisivelCheck"
                  checked={novoDoc.visivel_convidados}
                  onChange={e => setNovoDoc({ ...novoDoc, visivel_convidados: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-500"
                />
                <label htmlFor="docVisivelCheck" className="text-xs text-slate-300 font-semibold">
                  Visível para Convidados e Clientes (🌐 Convidados)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
