import React, { useCallback, useState } from 'react';
import { Loader2, Map, Plus } from 'lucide-react';
import { EspelhoVendasSvg } from '../mapa/EspelhoVendasSvg';
import { LoteDetalheModal } from '../mapa/LoteDetalheModal';
import { LoteFormModal } from '../mapa/LoteFormModal';
import { MasterplanControles } from '../mapa/MasterplanControles';
import { useLotesObra } from '../../hooks/useLotesObra';
import { useObraAccess } from '../../hooks/useObraAccess';
import { lotesComSvg } from '../../lib/loteMapa';
import type { Lote } from '../../types';
import type { LoteFormData } from '../../lib/loteMapa';
import { Button } from './ui-components';

export const MapaDisponibilidadeTab: React.FC = () => {
  const { isMasterAdmin } = useObraAccess();
  const {
    obraId,
    activeObra,
    lotes,
    isLoading,
    uploadMasterplan,
    isUploadingMasterplan,
    deleteMasterplan,
    isDeletingMasterplan,
    updateMapa,
    isUpdatingMapa,
    createLote,
    isCreatingLote,
    updateLote,
    isUpdatingLote,
    deleteLote,
    isDeletingLote,
  } = useLotesObra();

  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  const masterplanUrl = activeObra?.mapa_masterplan_url;
  const viewBox = activeObra?.mapa_viewbox;
  const lotesMapeados = lotesComSvg(lotes);
  const lotesSemPath = lotes.length - lotesMapeados.length;

  const handleViewboxDetected = useCallback(
    async (novoViewBox: string) => {
      if (!obraId || viewBox?.trim()) return;
      await updateMapa({ mapa_viewbox: novoViewBox });
    },
    [obraId, viewBox, updateMapa]
  );

  const handleSalvarLote = useCallback(
    async (dados: LoteFormData) => {
      if (!selectedLote) return;
      const atualizado = await updateLote({ loteId: selectedLote.id, dados });
      setSelectedLote(atualizado);
    },
    [selectedLote, updateLote]
  );

  const handleExcluirLote = useCallback(async () => {
    if (!selectedLote) return;
    await deleteLote(selectedLote.id);
    setSelectedLote(null);
  }, [selectedLote, deleteLote]);

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Selecione uma obra para visualizar o espelho de vendas.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-fadeIn">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Espelho de Vendas
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Tempo Real
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" /> Mapa de Disponibilidade
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clique em um lote no mapa para ver detalhes comerciais
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponível
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reservado
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Vendido
            </span>
          </div>

          {isMasterAdmin && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() => setModalCriarAberto(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Novo Lote
              </Button>
              <MasterplanControles
                masterplanUrl={masterplanUrl}
                viewBox={viewBox}
                onUpload={(file, vb) => uploadMasterplan({ file, viewBox: vb })}
                onDelete={() => deleteMasterplan(masterplanUrl || '')}
                onSaveViewBox={(vb) => updateMapa({ mapa_viewbox: vb })}
                isUploading={isUploadingMasterplan}
                isDeleting={isDeletingMasterplan}
                isSavingViewBox={isUpdatingMapa}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando lotes...</span>
        </div>
      ) : (
        <>
          {!masterplanUrl && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              {isMasterAdmin
                ? 'Envie a planta do masterplan (imagem ou PDF) para exibir o fundo do mapa.'
                : 'A planta do empreendimento ainda não foi configurada pelo administrador.'}
            </div>
          )}

          {lotesSemPath > 0 && isMasterAdmin && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              {lotesSemPath} lote(s) sem mapeamento SVG — não aparecem no mapa.
            </div>
          )}

          <EspelhoVendasSvg
            masterplanUrl={masterplanUrl}
            viewBox={viewBox}
            lotes={lotes}
            selectedLoteId={selectedLote?.id}
            onSelect={setSelectedLote}
            onViewboxDetected={isMasterAdmin ? handleViewboxDetected : undefined}
          />

          {lotesMapeados.length === 0 && !isLoading && (
            <p className="text-center text-xs text-slate-500">
              {isMasterAdmin
                ? 'Nenhum lote mapeado. Use "Adicionar Novo Lote" para cadastrar.'
                : 'Nenhum lote disponível no mapa no momento.'}
            </p>
          )}
        </>
      )}

      <LoteDetalheModal
        lote={selectedLote}
        open={Boolean(selectedLote)}
        onClose={() => setSelectedLote(null)}
        podeEditar={isMasterAdmin}
        onSalvar={handleSalvarLote}
        onExcluir={handleExcluirLote}
        salvando={isUpdatingLote}
        excluindo={isDeletingLote}
      />

      <LoteFormModal
        open={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onSalvar={createLote}
        salvando={isCreatingLote}
      />
    </div>
  );
};
