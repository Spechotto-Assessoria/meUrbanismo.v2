import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { AndamentoEtapa } from '../../types';
import { clampPct } from '../../lib/andamento';
import { ProgressoBar } from './ProgressoBar';

type Props = {
  etapa: AndamentoEtapa;
  canEdit: boolean;
  saving: boolean;
  onSave: (id: string, valor: number) => void;
  onToggle: (id: string, visivel: boolean) => void;
};

export const LinhaEtapa: React.FC<Props> = ({ etapa, canEdit, saving, onSave, onToggle }) => {
  const [draft, setDraft] = useState(String(Math.round(etapa.realizado)));
  useEffect(() => setDraft(String(Math.round(etapa.realizado))), [etapa.realizado]);
  const dirty = Number(draft) !== Math.round(etapa.realizado);
  const pesoPct = Math.round((Number(etapa.peso_fracao) || 0) * 100);

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-black text-slate-900 truncate">{etapa.nome}</h4>
          <span className="text-[10px] text-slate-500">
            Peso no orçamento: {pesoPct}% • Previsto: {etapa.previsto.toFixed(0)}%
            {canEdit && !etapa.visivel_convidados ? ' · oculto para clientes e corretores' : ''}
          </span>
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={100}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dirty) onSave(etapa.id, clampPct(Number(draft) || 0));
              }}
              aria-label={`Percentual de ${etapa.nome}`}
              className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-600">%</span>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => onSave(etapa.id, clampPct(Number(draft) || 0))}
              aria-label="Salvar percentual"
              className={`h-8 w-8 rounded-lg inline-flex items-center justify-center border text-xs ${
                dirty
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-400 border-slate-200'
              } disabled:opacity-50`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onToggle(etapa.id, !etapa.visivel_convidados)}
              title={
                etapa.visivel_convidados
                  ? 'Visível para clientes/corretores'
                  : 'Oculto para clientes/corretores'
              }
              aria-label="Alternar visibilidade para clientes e corretores"
              className={`h-8 w-8 rounded-lg inline-flex items-center justify-center border border-slate-200 bg-white ${
                etapa.visivel_convidados ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {etapa.visivel_convidados ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <ProgressoBar
        valor={Number(draft) || 0}
        previsto={etapa.previsto}
        editavel={canEdit && !saving}
        onChange={(pct) => setDraft(String(pct))}
        onCommit={(pct) => {
          if (Math.round(pct) === Math.round(etapa.realizado)) return;
          onSave(etapa.id, clampPct(pct));
        }}
      />
    </div>
  );
};
