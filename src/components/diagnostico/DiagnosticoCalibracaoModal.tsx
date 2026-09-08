import React, { useState } from 'react';

interface Props {
  aberto: boolean;
  onCancelar: () => void;
  onConfirmar: (metros: number, rotulo: string) => void;
}

export const DiagnosticoCalibracaoModal: React.FC<Props> = ({ aberto, onCancelar, onConfirmar }) => {
  const [rotulo, setRotulo] = useState('Largura da rua');
  const [metros, setMetros] = useState('7');
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <form
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(metros.replace(',', '.'));
          if (!n || n <= 0) return;
          onConfirmar(n, rotulo);
        }}
      >
        <h3 className="text-sm font-bold text-slate-900">Calibrar escala</h3>
        <p className="text-[11px] text-slate-500">
          Informe o comprimento real da linha desenhada. As próximas medições serão convertidas para metros e m².
        </p>
        <label className="block text-[11px] font-medium text-slate-600">
          Referência
          <input
            value={rotulo}
            onChange={(e) => setRotulo(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Largura da rua"
          />
        </label>
        <label className="block text-[11px] font-medium text-slate-600">
          Medida real
          <div className="mt-1 flex items-center gap-2">
            <input
              autoFocus
              type="number"
              min="0.01"
              step="0.01"
              value={metros}
              onChange={(e) => setMetros(e.target.value)}
              className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <span className="text-xs font-semibold text-slate-500">metros</span>
          </div>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancelar}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Cancelar
          </button>
          <button type="submit" className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer">
            Aplicar escala
          </button>
        </div>
      </form>
    </div>
  );
};
