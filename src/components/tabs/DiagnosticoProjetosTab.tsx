import React from 'react';
import { ArrowLeft, Ruler, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDiagnosticoProjetos } from '../../hooks/useDiagnosticoProjetos';
import { usePdfRenderer } from '../../hooks/usePdfRenderer';
import { DiagnosticoToolbar } from '../diagnostico/DiagnosticoToolbar';
import { DiagnosticoPdfViewer } from '../diagnostico/DiagnosticoPdfViewer';
import { DiagnosticoDadosPanel } from '../diagnostico/DiagnosticoDadosPanel';
import { DiagnosticoPromptModal } from '../diagnostico/DiagnosticoPromptModal';
import { DiagnosticoCalibracaoModal } from '../diagnostico/DiagnosticoCalibracaoModal';

interface Props {
  onBack: () => void;
}

export const DiagnosticoProjetosTab: React.FC<Props> = ({ onBack }) => {
  const { isMasterAdmin } = useAuth();
  const diag = useDiagnosticoProjetos();
  const pdf = usePdfRenderer(diag.url);

  if (!isMasterAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto mt-10">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Acesso restrito</h3>
        <p className="text-xs text-slate-500">A medição de projetos é exclusiva do administrador.</p>
        <button type="button" onClick={onBack} className="text-xs font-bold text-blue-700 cursor-pointer">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Painel geral
          </button>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-slate-700" /> Medição e diagnóstico
          </h1>
          <p className="text-xs text-slate-500">
            {diag.arquivoNome || 'Envie o PDF, calibre a escala e levante linhas e áreas do projeto.'}
          </p>
        </div>
      </div>

      {diag.aviso && (
        <div className="text-[11px] text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {diag.aviso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <DiagnosticoToolbar
            ferramenta={diag.ferramenta}
            onFerramenta={diag.setFerramenta}
            categoriaAtiva={diag.categoriaAtiva}
            onCategoria={diag.selecionarCategoria}
            escalaOk={Boolean(diag.calibracao)}
            rotuloEscala={
              diag.calibracao
                ? `${diag.calibracao.rotulo} = ${diag.calibracao.metrosReferencia} m`
                : undefined
            }
            pontosRascunho={diag.rascunho.length}
            pagina={pdf.pagina}
            totalPaginas={pdf.totalPaginas}
            onPagina={pdf.irPara}
            onZoom={(d) => pdf.setScale((s) => Math.min(3, Math.max(0.4, s + d)))}
            onConcluirArea={() => diag.confirmarArea(pdf.pagina)}
            onDesfazer={diag.limparRascunho}
            onExtrairIa={diag.extrairQuadroAreas}
            extraindo={diag.extraindo}
            temPdf={Boolean(diag.url)}
          />
          <DiagnosticoPdfViewer
            canvasRef={pdf.canvasRef}
            largura={pdf.largura}
            altura={pdf.altura}
            scale={pdf.scale}
            loading={pdf.loading}
            erro={pdf.erro}
            temPdf={Boolean(diag.url)}
            rascunho={diag.rascunho}
            medicoes={diag.medicoes.filter((m) => m.pagina === pdf.pagina && m.pontos.length > 0)}
            ferramentaAtiva={diag.ferramenta !== 'selecao'}
            onArquivo={diag.carregarArquivo}
            onPonto={(p) => diag.adicionarPonto(p, pdf.pagina)}
            onDuploClique={() => diag.confirmarArea(pdf.pagina)}
          />
        </div>
        <DiagnosticoDadosPanel medicoes={diag.medicoes} onRemover={diag.removerMedicao} />
      </div>

      <DiagnosticoCalibracaoModal
        aberto={Boolean(diag.pendenteCalibracao)}
        onCancelar={() => diag.setPendenteCalibracao(null)}
        onConfirmar={(metros, rotulo) => diag.confirmarCalibracao(metros, rotulo, pdf.pagina)}
      />

      <DiagnosticoPromptModal
        aberto={Boolean(diag.pendenteNome)}
        titulo="Nome do item"
        label="Nome (ex.: Portaria Social, Pet Place)"
        placeholder="Portaria Social"
        onCancelar={() => diag.setPendenteNome(null)}
        onConfirmar={diag.confirmarNomeItem}
      />
    </div>
  );
};
