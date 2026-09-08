import React, { useEffect, useState } from 'react';
import { Calculator, Layers, ArrowLeft, Save, FilePlus2, FileDown, Sheet, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './ui-components';
import { PipelineBoard } from '../viabilidade/PipelineBoard';
import { EstudoViabilidadeForm } from '../viabilidade/EstudoViabilidadeForm';
import { EstudoViabilidadePrint } from '../viabilidade/EstudoViabilidadePrint';
import { useEstudosViabilidade } from '../../hooks/useEstudosViabilidade';
import { useEstudoViabilidadeForm } from '../../hooks/useEstudoViabilidadeForm';
import type { ViabilidadeInicialInput, ViabilidadeInicialResult } from '../../lib/viabilidade-inicial';
import type { EstudoRow } from '../viabilidade/EstudoCard';

const downloadCsv = (input: ViabilidadeInicialInput, result: ViabilidadeInicialResult) => {
  const linhas = [
    ['Relatorio de Viabilidade Inicial'], [''],
    ['IDENTIFICACAO'], ['Empreendimento', input.obraNome], ['Empresa', input.empresaNome], ['Localizacao', input.localizacao], [''],
    ['RESULTADOS FINANCEIROS'], ['VGV Total Estimado', result.vgvTotal], ['Custo Total', result.custoTotal],
    ['Quantidade de Lotes', result.qtdLotes], ['ROI Inicial (%)', result.roi], ['Margem Bruta', result.margemBruta],
    ['Margem sobre VGV (%)', result.margemPct], ['Valor de Venda por Lote', result.valorVendaLote], ['Custo por Lote', result.custoPorLote]
  ];
  const csv = 'data:text/csv;charset=utf-8,' + linhas.map(l => l.join(';')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', `Viabilidade_${input.obraNome || 'Estudo'}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

interface Props { onBack: () => void; }

export const EstudoViabilidadeTab: React.FC<Props> = ({ onBack }) => {
  const { isMasterAdmin } = useAuth();
  const lista = useEstudosViabilidade();
  const form = useEstudoViabilidadeForm();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [pdfPendente, setPdfPendente] = useState(false);

  useEffect(() => {
    if (!pdfPendente || form.viewMode !== 'form') return;
    const id = requestAnimationFrame(() => {
      window.print();
      setPdfPendente(false);
      setGerandoPdf(false);
    });
    return () => cancelAnimationFrame(id);
  }, [pdfPendente, form.viewMode]);

  const handleSalvar = async (comoNovo: boolean) => {
    lista.limparMensagens();
    if (!form.obraNome.trim()) {
      lista.setMensagemErro('Atenção: O Nome do Empreendimento é obrigatório.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const salvo = await lista.salvar(form.montarPayload(), comoNovo);
    if (salvo) {
      form.setEstudoId(salvo.id);
      form.setViewMode('pipeline');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirPdf = (e?: EstudoRow) => {
    if (e) form.hidratar(e);
    else form.setViewMode('form');
    setGerandoPdf(true);
    setPdfPendente(true);
  };

  if (!isMasterAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto mt-10">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-xs text-slate-500">
          Esta calculadora contém dados financeiros sigilosos e está disponível apenas para administradores.
        </p>
        <button type="button" onClick={onBack} className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {lista.mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm print:hidden">
          <span>{lista.mensagemSucesso}</span>
          <button type="button" onClick={() => lista.setMensagemSucesso(null)} className="text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}
      {lista.mensagemErro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm print:hidden">
          <span>{lista.mensagemErro}</span>
          <button type="button" onClick={() => lista.setMensagemErro(null)} className="text-red-900 font-bold ml-2">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-800" /> Estudo de Viabilidade Inicial
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Acompanhe o pipeline em Kanban ou monte simulações profissionais</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button type="button" onClick={() => form.setViewMode('pipeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${form.viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Layers className="w-4 h-4" /> Pipeline Kanban
          </button>
          <button type="button" onClick={form.resetar} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${form.viewMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Calculator className="w-4 h-4" /> Novo Estudo / Simulador
          </button>
        </div>
      </div>

      {form.viewMode === 'pipeline' ? (
        lista.carregando ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-800" /></div>
        ) : (
          <div className="print:hidden">
            <PipelineBoard
              estudos={lista.estudos}
              estudoId={form.estudoId}
              gerandoCard={gerandoPdf ? form.estudoId : null}
              onEditar={form.hidratar}
              onPdf={abrirPdf}
              onExcluir={(e) => void lista.excluir(e.id)}
              onStatus={(e, s) => void lista.mudarStatus(e.id, s)}
            />
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
            <Button onClick={() => void handleSalvar(false)} disabled={lista.salvando} className="bg-blue-800 hover:bg-blue-900 text-white">
              <Save className="w-4 h-4 mr-1.5" /> {form.estudoId ? 'Salvar Estudo Selecionado' : 'Salvar Estudo'}
            </Button>
            <Button onClick={() => void handleSalvar(true)} disabled={lista.salvando} variant="outline">
              <FilePlus2 className="w-4 h-4 mr-1.5" /> Salvar como Novo
            </Button>
            <Button onClick={() => abrirPdf()} disabled={gerandoPdf} className="bg-blue-700 hover:bg-blue-800 text-white">
              {gerandoPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />} Exportar PDF
            </Button>
            <Button onClick={() => downloadCsv(form.input, form.resultado)} variant="secondary">
              <Sheet className="w-4 h-4 mr-1.5" /> Exportar CSV
            </Button>
          </div>

          <EstudoViabilidadeForm form={form} />
          <EstudoViabilidadePrint input={form.input} resultado={form.resultado} />
        </div>
      )}
    </div>
  );
};
