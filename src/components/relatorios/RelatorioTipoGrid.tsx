import React from 'react';
import {
  FileBarChart,
  TrendingUp,
  CheckCircle2,
  Camera,
  FileText
} from 'lucide-react';
import { RELATORIO_CARDS } from '../../lib/relatorios/tipos';
import type { RelatorioTipo } from '../../types';

const ICONES: Record<RelatorioTipo, React.ReactNode> = {
  orcamento: <FileBarChart className="w-6 h-6 text-brand-400" />,
  cronograma: <TrendingUp className="w-6 h-6 text-brand-400" />,
  andamento: <CheckCircle2 className="w-6 h-6 text-brand-400" />,
  acompanhamento: <Camera className="w-6 h-6 text-brand-400" />,
  global: <FileText className="w-6 h-6 text-brand-400" />
};

type Props = {
  onSelecionar: (tipo: RelatorioTipo) => void;
};

export const RelatorioTipoGrid: React.FC<Props> = ({ onSelecionar }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {RELATORIO_CARDS.map((card) => (
      <button
        key={card.tipo}
        type="button"
        onClick={() => onSelecionar(card.tipo)}
        className="text-left p-5 rounded-2xl bg-navy-900/90 border border-slate-800 hover:border-brand-500/40 hover:bg-navy-900 transition-all shadow-sm group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 group-hover:border-brand-500/30">
            {ICONES[card.tipo]}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white">{card.tituloPadrao}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.descricao}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);
