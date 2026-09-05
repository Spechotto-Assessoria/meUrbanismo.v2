import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrcamento } from '../../hooks/useOrcamento';
import { parseBudgetFile, type ParsedEtapa, type SheetRead } from '../../lib/budget-parser';
import { DropzoneImportacao, ImportOrcamentoModal } from '../orcamento/ImportOrcamentoModal';
import { SkeletonTable } from '../common/SkeletonLoader';
import {
  DollarSign, UploadCloud, Plus, CheckCircle, TrendingUp, Filter, X, Pencil, Trash2,
  ShieldAlert, FileSpreadsheet, AlertTriangle, Loader2
} from 'lucide-react';

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export const OrcamentoTab: React.FC = () => {
  const { activeObra, isAdmin, role } = useAuth();
  const podeVer = isAdmin || role === 'PROPRIETARIO_INVESTIDOR' || role === 'INVESTIDOR';
  const orc = useOrcamento(activeObra?.id);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editando, setEditando] = useState<{ id?: string; descricao: string; valor_total: string } | null>(null);
  const [sheet, setSheet] = useState<SheetRead | null>(null);
  const [pdfEtapas, setPdfEtapas] = useState<ParsedEtapa[] | null>(null);
  const [lendo, setLendo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const itens = orc.itens;
  const totalOrcado = itens.reduce((a, c) => a + (c.valor_total || 0), 0);
  const totalExecutado = itens.reduce((a, c) => a + (c.valor_executado || 0), 0);
  const percentualGeral = totalOrcado > 0 ? ((totalExecutado / totalOrcado) * 100).toFixed(1) : '0.0';

  const handleFile = async (f: File) => {
    setLendo(true);
    orc.setErro(null);
    try {
      const parsed = await parseBudgetFile(f);
      if (parsed.sheet) {
        setPdfEtapas(null);
        setSheet(parsed.sheet);
      } else {
        setSheet(null);
        setPdfEtapas(parsed.etapas || []);
      }
      setShowImportModal(true);
    } catch (e: any) {
      orc.setErro(e?.message || 'Erro ao ler o arquivo.');
    } finally {
      setLendo(false);
    }
  };

  const fecharImport = () => {
    setShowImportModal(false);
    setSheet(null);
    setPdfEtapas(null);
  };

  if (!podeVer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto mt-10">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-xs text-slate-500">O orçamento é visível apenas para administrador e proprietário/investidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      {orc.sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between print:hidden">
          <span>{orc.sucesso}</span>
          <button type="button" onClick={() => orc.setSucesso(null)}>×</button>
        </div>
      )}
      {orc.erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between print:hidden">
          <span>{orc.erro}</span>
          <button type="button" onClick={() => orc.setErro(null)}>×</button>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-3.5 ${isAdmin ? 'sm:grid-cols-3' : ''}`}>
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" /> Orçamento Global Previsto
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">{brl(totalOrcado)}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% da planilha contratada</div>
        </div>
        {isAdmin && (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-brand-500/30 shadow-glow-sm">
              <div className="text-[11px] font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-400" /> Total Medido / Executado
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-300 mt-1">{brl(totalExecutado)}</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-semibold">{percentualGeral}% do custo total realizado</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> Saldo a Executar
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">{brl(totalOrcado - totalExecutado)}</div>
              <div className="text-[11px] text-slate-400 mt-1">{(100 - Number(percentualGeral)).toFixed(1)}% pendente de medição</div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400">Etapas do orçamento</span>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
              <UploadCloud className="w-3.5 h-3.5 text-brand-400" /> Importar Planilha
            </button>
            <button type="button" onClick={() => { setEditando({ descricao: '', valor_total: '' }); setShowAddModal(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-glow">
              <Plus className="w-3.5 h-3.5" /> Adicionar etapa
            </button>
            {itens.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-950 text-xs font-semibold text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir orçamento
              </button>
            )}
          </div>
        )}
      </div>

      {orc.loading ? (
        <SkeletonTable rows={5} />
      ) : itens.length === 0 ? (
        <div className="p-10 rounded-2xl bg-navy-900/80 border border-slate-800 text-center space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-white">Sem orçamento importado</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Envie uma planilha .xlsx ou .pdf com colunas de descrição, unidade, quantidade e valores unitários e totais.
          </p>
          {isAdmin && (
            <div className="pt-2 max-w-md mx-auto">
              <DropzoneImportacao lendo={lendo} onFile={(f) => void handleFile(f)} />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white leading-snug">{item.descricao}</div>
                  <div className="text-sm font-black text-brand-300 mt-1">{brl(item.valor_total || 0)}</div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => { setEditando({ id: item.id, descricao: item.descricao, valor_total: String(item.valor_total || 0) }); setShowAddModal(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 rounded-lg text-red-400 hover:bg-red-950" onClick={() => void orc.excluir(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImportOrcamentoModal
        open={showImportModal && (!!sheet || !!pdfEtapas)}
        onClose={fecharImport}
        sheet={sheet}
        preset={pdfEtapas}
        importing={orc.salvando}
        jaTemOrcamento={itens.length > 0}
        onConfirm={async (etapas) => {
          await orc.importar(etapas);
          fecharImport();
        }}
      />

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-navy-900 border border-rose-500/30 p-6 shadow-2xl space-y-4">
            <button type="button" onClick={() => setConfirmarExclusao(false)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 rounded-xl bg-rose-950 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir orçamento atual?</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Atenção: todas as etapas do orçamento e o cronograma vinculado (percentuais mensais, Curva S e Gantt) serão removidos. Esta ação não pode ser desfeita. Depois você poderá importar um novo arquivo.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setConfirmarExclusao(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
                Cancelar
              </button>
              <button
                type="button"
                disabled={orc.salvando}
                onClick={() => {
                  void orc.excluirTudo().then(() => setConfirmarExclusao(false)).catch(() => undefined);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {orc.salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button type="button" onClick={() => { setShowAddModal(false); setEditando(null); }} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-white">{editando.id ? 'Editar etapa' : 'Adicionar etapa'}</h3>
            <form
              className="space-y-3 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                const total = Number(String(editando.valor_total).replace(',', '.')) || 0;
                void orc.salvarEtapa({ id: editando.id, descricao: editando.descricao.trim(), valor_total: total }).then(() => {
                  setShowAddModal(false);
                  setEditando(null);
                }).catch(() => undefined);
              }}
            >
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome da etapa</label>
                <input required value={editando.descricao} onChange={(e) => setEditando({ ...editando, descricao: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Valor total (R$)</label>
                <input required type="number" step="0.01" value={editando.valor_total} onChange={(e) => setEditando({ ...editando, valor_total: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditando(null); }} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancelar</button>
                <button type="submit" disabled={orc.salvando} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
