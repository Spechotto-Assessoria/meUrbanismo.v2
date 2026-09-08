import React from 'react';
import { DiagnosticoAccordion } from './DiagnosticoAccordion';
import { CATEGORIAS_LEVANTAMENTO } from '../../types/diagnostico';
import type { MedicaoDiagnostico } from '../../types/diagnostico';

interface Props {
  medicoes: MedicaoDiagnostico[];
  onRemover: (id: string) => void;
}

export const DiagnosticoDadosPanel: React.FC<Props> = ({ medicoes, onRemover }) => {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-3 shadow-sm flex flex-col min-h-[420px] lg:max-h-[calc(100vh-12rem)]">
      <div className="px-1 pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-sm font-bold text-slate-900">Levantamento</h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Medidas convertidas pela escala calibrada. Edificações e lazer aceitam nome + área.
        </p>
      </div>
      <div className="space-y-2 overflow-y-auto pr-0.5">
        {CATEGORIAS_LEVANTAMENTO.map((cfg) => (
          <DiagnosticoAccordion
            key={cfg.id}
            config={cfg}
            itens={medicoes.filter((m) => m.categoria === cfg.id)}
            onRemover={onRemover}
          />
        ))}
      </div>
    </aside>
  );
};
