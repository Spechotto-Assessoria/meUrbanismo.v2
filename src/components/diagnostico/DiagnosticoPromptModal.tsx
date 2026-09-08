import React, { useState } from 'react';

interface Props {
  aberto: boolean;
  titulo: string;
  label: string;
  placeholder: string;
  tipo?: 'text' | 'number';
  sufixo?: string;
  confirmarLabel?: string;
  onCancelar: () => void;
  onConfirmar: (valor: string) => void;
}

export const DiagnosticoPromptModal: React.FC<Props> = ({
  aberto,
  titulo,
  label,
  placeholder,
  tipo = 'text',
  sufixo,
  confirmarLabel = 'Confirmar',
  onCancelar,
  onConfirmar
}) => {
  const [valor, setValor] = useState('');
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <form
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirmar(valor);
          setValor('');
        }}
      >
        <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
        <label className="block text-[11px] font-medium text-slate-600">
          {label}
          <div className="mt-1 flex items-center gap-2">
            <input
              autoFocus
              type={tipo}
              step={tipo === 'number' ? '0.01' : undefined}
              min={tipo === 'number' ? '0.01' : undefined}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={placeholder}
              className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
            />
            {sufixo && <span className="text-xs font-semibold text-slate-500">{sufixo}</span>}
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
          <button
            type="submit"
            className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            {confirmarLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
