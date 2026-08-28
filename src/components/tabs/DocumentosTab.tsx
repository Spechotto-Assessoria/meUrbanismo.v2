import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/supabase';
import { DocumentoObra } from '../../types';
import {
  FileText,
  Download,
  Plus,
  Eye,
  EyeOff,
  FileCheck,
  FileCode
} from 'lucide-react';

export const DocumentosTab: React.FC = () => {
  const auth = useAuth();
  const activeObra = auth.activeObra;
  const isPublicView = auth.isPublicView ?? false;

  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [novoDoc, setNovoDoc] = useState({
    titulo: '',
    categoria: 'Urbanístico',
    codigo_revisao: 'R-01',
    tipo_extensao: 'pdf',
    tamanho_bytes: 2097152,
    responsavel_tecnico: '',
    visivel_convidados: true,
    descricao: ''
  });

  useEffect(() => {
    if (activeObra) {
      carregarDocumentos();
    }
  }, [activeObra, isPublicView]);

  const carregarDocumentos = async () => {
    if (!activeObra) return;
    setLoading(true);
    try {
      const data = await apiService.getDocumentos(activeObra.id, isPublicView);
      setDocumentos(data);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObra || !novoDoc.titulo) return;

    try {
      const item: DocumentoObra = {
        id: `doc-${Date.now()}`,
        obra_id: activeObra.id,
        titulo: novoDoc.titulo,
        nome: novoDoc.titulo,
        categoria: novoDoc.categoria,
        codigo_revisao: novoDoc.codigo_revisao,
        data_emissao: new Date().toISOString().split('T')[0],
        data_upload: new Date().toISOString().split('T')[0],
        tamanho_bytes: Number(novoDoc.tamanho_bytes),
        tamanho: `${(Number(novoDoc.tamanho_bytes) / 1024 / 1024).toFixed(1)} MB`,
        tipo_extensao: novoDoc.tipo_extensao,
        url: '#',
        arquivo_url: '#',
        visivel_convidados: novoDoc.visivel_convidados,
        responsavel_tecnico: novoDoc.responsavel_tecnico || 'Equipe Técnica',
        descricao: novoDoc.descricao
      };

      await apiService.saveDocumento(item);
      setShowModal(false);
      setNovoDoc({
        titulo: '',
        categoria: 'Urbanístico',
        codigo_revisao: 'R-01',
        tipo_extensao: 'pdf',
        tamanho_bytes: 2097152,
        responsavel_tecnico: '',
        visivel_convidados: true,
        descricao: ''
      });
      carregarDocumentos();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
    }
  };

  const getExtensaoIcon = (extensao?: string) => {
    const ext = extensao?.toLowerCase();
    switch (ext) {
      case 'dwg':
        return <FileCode className="w-5 h-5 text-amber-400" />;
      case 'pdf':
        return <FileCheck className="w-5 h-5 text-rose-400" />;
      default:
        return <FileText className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xs">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" />
            Repositório de Documentos e Projetos
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Projetos executivos aprovados, licenças ambientais e alvarás oficiais.
          </p>
        </div>

        {!isPublicView && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-brand-500/10 text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Documento
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando acervo documental...</div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
          Nenhum documento cadastrado para este empreendimento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    {getExtensaoIcon(doc.tipo_extensao)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {doc.codigo_revisao || 'v1.0'}
                    </span>
                    {!isPublicView && (
                      <span className={`p-1.5 rounded-md border ${doc.visivel_convidados ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                        {doc.visivel_convidados ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-white text-base leading-snug group-hover:text-brand-300 transition-colors">
                  {doc.titulo || doc.nome}
                </h3>

                <span className="text-xs font-semibold text-brand-400 block mt-1">
                  {doc.categoria}
                </span>

                {doc.descricao && (
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2">
                    {doc.descricao}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Resp.:</span> {doc.responsavel_tecnico || 'N/A'}
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {doc.tamanho || (doc.tamanho_bytes ? `${(doc.tamanho_bytes / 1024 / 1024).toFixed(1)} MB` : 'PDF')}
                  </div>
                </div>
                <button
                  onClick={() => alert(`Download iniciado para: ${doc.titulo || doc.nome}`)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-brand-500 text-slate-300 hover:text-slate-950 transition-colors border border-slate-700 hover:border-brand-500"
                  title="Baixar Documento"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO DOCUMENTO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Documento</h3>
            <form onSubmit={handleSalvarDocumento} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Título do Documento</label>
                <input
                  type="text"
                  required
                  value={novoDoc.titulo}
                  onChange={e => setNovoDoc({ ...novoDoc, titulo: e.target.value })}
                  placeholder="Ex: Projeto Executivo de Drenagem"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Categoria</label>
                  <select
                    value={novoDoc.categoria}
                    onChange={e => setNovoDoc({ ...novoDoc, categoria: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                  >
                    <option value="Urbanístico">Urbanístico</option>
                    <option value="Licenças Ambientais">Licenças Ambientais</option>
                    <option value="Drenagem">Drenagem</option>
                    <option value="Alvarás e Jurídico">Alvarás e Jurídico</option>
                    <option value="projetos">Projetos</option>
                    <option value="licencas">Licenças</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Código Revisão</label>
                  <input
                    type="text"
                    value={novoDoc.codigo_revisao}
                    onChange={e => setNovoDoc({ ...novoDoc, codigo_revisao: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Extensão</label>
                  <select
                    value={novoDoc.tipo_extensao}
                    onChange={e => setNovoDoc({ ...novoDoc, tipo_extensao: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="dwg">DWG (AutoCAD)</option>
                    <option value="zip">ZIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Resp. Técnico</label>
                  <input
                    type="text"
                    value={novoDoc.responsavel_tecnico}
                    onChange={e => setNovoDoc({ ...novoDoc, responsavel_tecnico: e.target.value })}
                    placeholder="Eng. Responsável"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={novoDoc.descricao}
                  onChange={e => setNovoDoc({ ...novoDoc, descricao: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="visivel_doc"
                  checked={novoDoc.visivel_convidados}
                  onChange={e => setNovoDoc({ ...novoDoc, visivel_convidados: e.target.checked })}
                  className="rounded-md border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-800"
                />
                <label htmlFor="visivel_doc" className="text-xs text-slate-300">
                  Visível para investidores e clientes convidados
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors"
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