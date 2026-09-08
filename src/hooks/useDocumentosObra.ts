import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useObraAccess } from './useObraAccess';
import { apiService } from '../services/supabase';
import { agruparDocumentosPorPasta } from '../lib/documentos-constants';
import type { DocumentoObra } from '../types';

export function useDocumentosObra() {
  const { activeObra, isMasterAdmin } = useAuth();
  const access = useObraAccess();

  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const podeGerenciar = isMasterAdmin;
  const podeVerArquivados = access.canViewPrivateDocs;

  const loadData = useCallback(async () => {
    if (!activeObra?.id) return;
    setLoading(true);
    setErro(null);
    try {
      const data = await apiService.getDocumentos(activeObra.id);
      setDocumentos(data);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, [activeObra?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const ativos = useMemo(
    () => documentos.filter((d) => !d.arquivado),
    [documentos]
  );

  const arquivados = useMemo(
    () => documentos.filter((d) => d.arquivado),
    [documentos]
  );

  const pastasAtivas = useMemo(
    () => agruparDocumentosPorPasta(ativos, false),
    [ativos]
  );

  const pastasArquivadas = useMemo(
    () => agruparDocumentosPorPasta(arquivados, true),
    [arquivados]
  );

  return {
    activeObra,
    documentos,
    ativos,
    arquivados,
    pastasAtivas,
    pastasArquivadas,
    loading,
    erro,
    setErro,
    loadData,
    podeGerenciar,
    podeVerArquivados,
    isCliente: access.isCliente,
    mostrarArquivados,
    setMostrarArquivados,
  };
}
