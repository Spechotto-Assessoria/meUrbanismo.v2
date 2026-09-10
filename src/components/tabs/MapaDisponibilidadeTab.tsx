import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, Map, Plus } from 'lucide-react';
import { DxfImportPanel } from '../mapa/DxfImportPanel';
import { EspelhoVendasSvg } from '../mapa/EspelhoVendasSvg';
import { LoteDetalheModal } from '../mapa/LoteDetalheModal';
import { LoteFormModal } from '../mapa/LoteFormModal';
import { MasterplanControles } from '../mapa/MasterplanControles';
import { useDxfImport } from '../../hooks/useDxfImport';
import { useLotesObra } from '../../hooks/useLotesObra';
import { useObraAccess } from '../../hooks/useObraAccess';
import { lotesComSvg, parseImgTransform } from '../../lib/loteMapa';
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
    salvarLoteamento,
    isSalvandoLoteamento,
    createLote,
    isCreatingLote,
    updateLote,
    isUpdatingLote,
    deleteLote,
    isDeletingLote,
  } = useLotesObra();

  const dxf = useDxfImport(activeObra?.mapa_img_transform);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [dxfNome, setDxfNome] = useState<string | null>(null);

  const emPreviewDxf = dxf.previewLotes.length > 0;
  const masterplanUrl = emPreviewDxf ? dxf.imagemPreviewUrl : activeObra?.mapa_masterplan_url;
  const viewBox = emPreviewDxf ? dxf.viewBoxDxf : activeObra?.mapa_viewbox;
  const imgTransform = emPreviewDxf
    ? dxf.transform
    : parseImgTransform(activeObra?.mapa_img_transform);

  const lotesExibir = emPreviewDxf ? dxf.previewLotes : lotes;
  const lotesMapeados = lotesComSvg(lotesExibir);
  const lotesSemPath = lotes.length - lotesComSvg(lotes).length;

  const handleViewboxDetected = useCallback(
    async (novoViewBox: string) => {
      if (!obraId || emPreviewDxf || activeObra?.mapa_viewbox?.trim()) return;
      await updateMapa({ mapa_viewbox: novoViewBox });
    },
    [obraId, emPreviewDxf, activeObra?.mapa_viewbox, updateMapa]
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

  const handleSalvarLoteamento = useCallback(async () => {
    if (!dxf.imagemArquivo || !dxf.resultadoDxf) return;
    if (lotes.length > 0 && !confirm(`Importar ${dxf.resultadoDxf.poligonos.length} lotes? Os lotes existentes permanecerão.`)) {
      return;
    }
    try {
      await salvarLoteamento({
        imagem: dxf.imagemArquivo,
        viewBox: dxf.resultadoDxf.viewBox,
        transform: dxf.transform,
        poligonos: dxf.resultadoDxf.poligonos,
      });
      dxf.limparPreview();
      setDxfNome(null);
    } catch (e: unknown) {
      dxf.setErro(e instanceof Error ? e.message : 'Falha ao salvar loteamento.');
    }
  }, [dxf, lotes.length, salvarLoteamento]);

  const legenda = useMemo(
    () => (
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
    ),
    []
  );

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
            {emPreviewDxf && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                Preview DXF
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" /> Mapa de Disponibilidade
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {emPreviewDxf
              ? 'Ajuste o alinhamento e clique em Salvar Loteamento'
              : 'Clique em um lote no mapa para ver ou editar detalhes'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {legenda}
          {isMasterAdmin && !emPreviewDxf && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 justify-end">
              <Button type="button" size="sm" className="gap-1.5" onClick={() => setModalCriarAberto(true)}>
                <Plus className="w-3.5 h-3.5" /> Adicionar Novo Lote
              </Button>
              <MasterplanControles
                masterplanUrl={activeObra.mapa_masterplan_url}
                viewBox={activeObra.mapa_viewbox}
                onUpload={(file, vb) => uploadMasterplan({ file, viewBox: vb })}
                onDelete={() => deleteMasterplan(activeObra.mapa_masterplan_url || '')}
                onSaveViewBox={(vb) => updateMapa({ mapa_viewbox: vb })}
                isUploading={isUploadingMasterplan}
                isDeleting={isDeletingMasterplan}
                isSavingViewBox={isUpdatingMapa}
              />
            </div>
          )}
        </div>
      </div>

      <div className={isMasterAdmin ? 'grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start' : ''}>
        {isMasterAdmin && (
          <DxfImportPanel
            imagemNome={dxf.imagemArquivo?.name}
            dxfNome={dxfNome}
            poligonosCount={dxf.resultadoDxf?.poligonos.length ?? 0}
            transform={dxf.transform}
            onTransformChange={dxf.setTransform}
            onImagemSelect={dxf.selecionarImagem}
            onDxfSelect={(file) => {
              setDxfNome(file.name);
              void dxf.selecionarDxf(file);
            }}
            onSalvar={handleSalvarLoteamento}
            prontoParaSalvar={dxf.prontoParaSalvar}
            salvando={isSalvandoLoteamento}
            erro={dxf.erro}
          />
        )}

        <div className="space-y-3 min-w-0">
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
                    ? 'Use o painel à esquerda para enviar a imagem do masterplan e o arquivo DXF.'
                    : 'A planta do empreendimento ainda não foi configurada pelo administrador.'}
                </div>
              )}

              {lotesSemPath > 0 && isMasterAdmin && !emPreviewDxf && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  {lotesSemPath} lote(s) sem mapeamento SVG — não aparecem no mapa.
                </div>
              )}

              <EspelhoVendasSvg
                masterplanUrl={masterplanUrl}
                viewBox={viewBox}
                imgTransform={imgTransform}
                lotes={lotesExibir}
                selectedLoteId={selectedLote?.id}
                onSelect={setSelectedLote}
                onViewboxDetected={isMasterAdmin ? handleViewboxDetected : undefined}
                bloquearAutoViewbox={emPreviewDxf}
              />

              {lotesMapeados.length === 0 && !isLoading && (
                <p className="text-center text-xs text-slate-500">
                  {isMasterAdmin
                    ? 'Importe um DXF ou adicione lotes manualmente.'
                    : 'Nenhum lote disponível no mapa no momento.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

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
