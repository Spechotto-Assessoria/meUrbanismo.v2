import React from 'react';
import { FileText } from 'lucide-react';
import { SkeletonCard } from '../common/SkeletonLoader';
import { useDocumentosObra } from '../../hooks/useDocumentosObra';
import { DocumentosPastasPanel } from '../documentos/DocumentosPastasPanel';

export const DocumentosTab: React.FC = () => {
  const ctx = useDocumentosObra();

  if (!ctx.activeObra) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Selecione uma obra para ver os documentos.
      </div>
    );
  }

  if (ctx.loading) {
    return (
      <div className="p-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-12">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Projetos e Documentos</h2>
        </div>
        <p className="text-xs text-slate-500">
          {ctx.activeObra.nome}
          {ctx.isCliente && ' · Apenas documentos liberados pelo administrador'}
        </p>
      </header>

      {ctx.erro && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {ctx.erro}
        </div>
      )}

      <DocumentosPastasPanel
        obraId={ctx.activeObra.id}
        obraNome={ctx.activeObra.nome}
        documentos={ctx.documentos}
        pastasAtivas={ctx.pastasAtivas}
        pastasArquivadas={ctx.pastasArquivadas}
        podeGerenciar={ctx.podeGerenciar}
        podeVerArquivados={ctx.podeVerArquivados}
        mostrarArquivados={ctx.mostrarArquivados}
        onToggleArquivados={() => ctx.setMostrarArquivados((v) => !v)}
        onReload={ctx.loadData}
      />
    </div>
  );
};
