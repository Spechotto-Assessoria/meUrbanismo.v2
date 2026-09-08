import React, { useRef, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Loader2, RefreshCw, Save, UploadCloud } from 'lucide-react';
import { monthLabel, parseCronogramaFile, type EtapaCrono, type Grid } from '../../lib/cronograma';

type Props = {
  open: boolean;
  onClose: () => void;
  etapas: EtapaCrono[];
  months: string[];
  onConfirm: (grid: Grid) => void;
};

export const ImportCronogramaModal: React.FC<Props> = ({ open, onClose, etapas, months, onConfirm }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);

  if (!open) return null;

  const linhas = etapas.map((e) => {
    const row = grid?.[e.id] ?? {};
    const soma = months.reduce((a, m) => a + (row[m] ?? 0), 0);
    const meses = months.filter((m) => (row[m] ?? 0) > 0);
    return { e, soma, meses };
  });
  const reconhecidas = linhas.filter((l) => l.soma > 0).length;
  const alertas = linhas.filter((l) => l.soma > 0 && Math.abs(l.soma - 100) > 0.5).length;

  const fechar = () => {
    setGrid(null);
    setStatus(null);
    setErro(null);
    onClose();
  };

  const ler = async (file: File) => {
    setLendo(true);
    setErro(null);
    setStatus('Lendo colunas de meses e etapas da planilha...');
    try {
      const g = await parseCronogramaFile(file, etapas, months);
      setGrid(g);
      setStatus('Curva S recalculada com base nos dados do arquivo.');
    } catch (e: any) {
      setGrid(null);
      setErro(e?.message || 'Não foi possível ler o arquivo.');
      setStatus(null);
    } finally {
      setLendo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Importar Cronograma Personalizado
          </h3>
          <button type="button" onClick={fechar} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <p className="text-xs text-slate-500">
          Selecione o arquivo Excel/CSV contendo a distribuição mensal das etapas para recalcular a Curva S automaticamente.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void ler(f);
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50"
        >
          <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-700 block">Clique para selecionar a planilha</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Formatos suportados: .xlsx, .csv</span>
        </button>

        {lendo && status && (
          <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            {status}
          </div>
        )}
        {erro && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold">{erro}</div>
        )}

        {grid && (
          <>
            {alertas > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{alertas} etapa(s) não somam 100% — você poderá ajustar na grade antes de salvar.</span>
              </div>
            )}
            <p className="text-xs text-slate-500 font-semibold">
              {reconhecidas} de {etapas.length} etapa(s) reconhecida(s).
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Etapa</th>
                    <th className="px-3 py-2 text-left">Meses com previsão</th>
                    <th className="px-3 py-2 text-right">Σ %</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(({ e, soma, meses }) => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="max-w-[220px] px-3 py-2 font-medium text-slate-800 line-clamp-2">{e.nome}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {meses.length ? `${monthLabel(meses[0])} → ${monthLabel(meses[meses.length - 1])} (${meses.length})` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${soma === 0 ? 'text-slate-400' : Math.abs(soma - 100) > 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {soma.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={fechar}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!grid || reconhecidas === 0 || lendo}
            onClick={() => {
              if (!grid) return;
              onConfirm(grid);
              fechar();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
          >
            {lendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Processar e Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
};
