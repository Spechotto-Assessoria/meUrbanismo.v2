import React, { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { CategoriaConfig, MedicaoDiagnostico } from '../../types/diagnostico';
import { formatarMedida } from '../../lib/diagnostico-medicao';

interface Props {
  config: CategoriaConfig;
  itens: MedicaoDiagnostico[];
  onRemover: (id: string) => void;
}

export const DiagnosticoAccordion: React.FC<Props> = ({ config, itens, onRemover }) => {
  const [aberto, setAberto] = useState(true);
  const total = itens.reduce((s, i) => s + (i.valor || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-slate-50"
      >
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${aberto ? '' : '-rotate-90'}`} />
        <span className="flex-1 text-[11px] font-bold text-slate-800 leading-snug">{config.titulo}</span>
        <span className="text-[11px] font-semibold tabular-nums text-slate-600">
          {formatarMedida(total, config.unidade)}
        </span>
      </button>
      {aberto && (
        <div className="border-t border-slate-100 px-3 py-2 space-y-1.5">
          {itens.length === 0 ? (
            <p className="text-[10px] text-slate-400 py-1">Nenhuma medição nesta categoria.</p>
          ) : (
            itens.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 text-[11px]">
                <span className="flex-1 text-slate-700 truncate">
                  {item.nome || `${config.tipo === 'lista' ? 'Item' : 'Medição'} ${idx + 1}`}
                </span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {formatarMedida(item.valor, config.unidade)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemover(item.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
