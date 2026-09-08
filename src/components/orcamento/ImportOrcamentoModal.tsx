import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, FileSpreadsheet, Loader2, Save, UploadCloud, X } from 'lucide-react';
import { buildEtapas, type ColumnMapping, type ParsedEtapa, type SheetRead } from '../../lib/budget-parser';

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const NONE = '__none__';

type Props = {
  open: boolean;
  onClose: () => void;
  sheet: SheetRead | null;
  preset: ParsedEtapa[] | null;
  importing: boolean;
  jaTemOrcamento: boolean;
  onConfirm: (etapas: ParsedEtapa[]) => Promise<void> | void;
};

export const ImportOrcamentoModal: React.FC<Props> = ({
  open,
  onClose,
  sheet,
  preset,
  importing,
  jaTemOrcamento,
  onConfirm
}) => {
  const isPdf = !!preset;
  const [step, setStep] = useState<1 | 2>(1);
  const [mapping, setMapping] = useState<ColumnMapping | null>(sheet?.mapping ?? null);
  const [startRow, setStartRow] = useState(sheet ? sheet.headerRow + 1 : 0);
  const [synced, setSynced] = useState('');

  const key = sheet ? `${sheet.headers.length}:${sheet.rows.length}:${sheet.headerRow}` : preset ? 'pdf' : '';
  if (open && key && key !== synced) {
    setSynced(key);
    setMapping(sheet?.mapping ?? null);
    setStartRow(sheet ? sheet.headerRow + 1 : 0);
    setStep(isPdf ? 2 : 1);
  }

  const sheetEtapas = useMemo(() => {
    if (!sheet || !mapping || step !== 2) return [];
    return buildEtapas(sheet.rows, mapping, startRow);
  }, [sheet, mapping, startRow, step]);

  const etapas = isPdf ? preset! : sheetEtapas;
  const total = etapas.reduce((a, e) => a + e.valor_total, 0);
  const alertas = etapas.filter((e) => e.valor_total <= 0).length;

  if (!open) return null;
  if (!isPdf && (!sheet || !mapping)) return null;

  const showPreview = isPdf || step === 2;
  const options = (sheet?.headers ?? []).map((h, i) => ({ value: String(i), label: h }));

  const setCol = (field: keyof ColumnMapping, v: string) =>
    setMapping((m) => (m ? { ...m, [field]: v === NONE ? null : Number(v) } : m));

  const colSelect = (field: keyof ColumnMapping, label: string, optional = true) => (
    <div>
      <label className="block text-slate-400 font-semibold mb-1">
        {label} {!optional && <span className="text-red-400">*</span>}
      </label>
      <select
        value={mapping?.[field] == null ? NONE : String(mapping[field])}
        onChange={(e) => setCol(field, e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs"
      >
        {optional && <option value={NONE}>Não usar</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {showPreview ? 'Revisar orçamento importado' : 'Mapear colunas do orçamento'}
            </h3>
            <p className="text-xs text-slate-400">
              {showPreview ? 'Confira as etapas e o total antes de salvar.' : 'Confirme qual coluna corresponde a cada informação.'}
            </p>
          </div>
        </div>

        {!showPreview ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {colSelect('descricao', 'Descrição / Etapa', false)}
              {colSelect('codigo', 'Código / Item')}
              {colSelect('unidade', 'Unidade')}
              {colSelect('quantidade', 'Quantidade')}
              {colSelect('valor_unitario', 'Valor unitário')}
              {colSelect('valor_total', 'Valor total')}
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Linha em que a tabela começa</label>
              <select
                value={String(startRow)}
                onChange={(e) => setStartRow(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
              >
                {Array.from({ length: Math.min(30, sheet?.rows.length ?? 0) }, (_, i) => (
                  <option key={i} value={String(i)}>Linha {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancelar</button>
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold">Ver prévia</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Total geral</p>
              <p className="text-xl font-black text-brand-300">{brl(total)}</p>
              <p className="text-slate-400 mt-1">Etapas: <strong className="text-white">{etapas.length}</strong></p>
            </div>
            {jaTemOrcamento && (
              <p className="text-amber-300">Isso substituirá o orçamento atual desta obra.</p>
            )}
            {alertas > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {alertas} etapa(s) sem valor. Revise o mapeamento se isso não for esperado.
              </div>
            )}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {etapas.map((e, i) => (
                <div key={i} className="rounded-xl border border-slate-700 bg-navy-950 p-3">
                  <p className="font-bold text-white leading-snug">{e.nome}</p>
                  <p className="mt-1 text-right font-black text-brand-300">{brl(e.valor_total)}</p>
                </div>
              ))}
              {etapas.length === 0 && (
                <p className="py-6 text-center text-slate-400">Nenhuma etapa encontrada com esse mapeamento.</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              {isPdf ? (
                <button type="button" onClick={onClose} disabled={importing} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancelar</button>
              ) : (
                <button type="button" onClick={() => setStep(1)} disabled={importing} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
              )}
              <button
                type="button"
                disabled={importing || etapas.length === 0}
                onClick={() => {
                  if (
                    jaTemOrcamento &&
                    !window.confirm('Já existe orçamento nesta obra. Substituir pelas etapas importadas?')
                  ) {
                    return;
                  }
                  void onConfirm(etapas);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Confirmar e salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DropzoneImportacao: React.FC<{
  lendo: boolean;
  onFile: (f: File) => void;
}> = ({ lendo, onFile }) => (
  <label className="block p-4 rounded-2xl bg-navy-950 border border-dashed border-slate-700 text-center space-y-3 cursor-pointer">
    <UploadCloud className={`w-10 h-10 text-brand-400 mx-auto ${lendo ? 'animate-bounce' : ''}`} />
    <div>
      <p className="text-xs font-semibold text-slate-200">
        {lendo ? 'Lendo arquivo…' : 'Selecione o arquivo da planilha (XLSX, CSV ou PDF)'}
      </p>
      <p className="text-[10px] text-slate-400 mt-1">
        Extraímos o nome da etapa e o valor total. Detalhamentos não são gravados.
      </p>
    </div>
    <input
      type="file"
      accept=".xlsx,.xls,.csv,.pdf"
      disabled={lendo}
      className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = '';
      }}
    />
  </label>
);
