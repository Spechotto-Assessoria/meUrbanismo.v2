import React from 'react';
import { Camera, BookOpen, Ruler } from 'lucide-react';
import type { SubAbaAcompanhamento } from '../../lib/acompanhamento-constants';

type Props = {
  subAba: SubAbaAcompanhamento;
  onChange: (aba: SubAbaAcompanhamento) => void;
  podeVerTodasSubAbas: boolean;
};

const abas: { id: SubAbaAcompanhamento; rotulo: string; icone: React.ReactNode }[] = [
  { id: 'fotos', rotulo: 'Galeria de Fotos', icone: <Camera className="w-4 h-4" /> },
  { id: 'diario', rotulo: 'Diário de Obra', icone: <BookOpen className="w-4 h-4" /> },
  { id: 'medicoes', rotulo: 'Medições', icone: <Ruler className="w-4 h-4" /> },
];

export const AcompanhamentoSubNav: React.FC<Props> = ({
  subAba,
  onChange,
  podeVerTodasSubAbas,
}) => {
  const visiveis = abas.filter((a) => a.id === 'fotos' || podeVerTodasSubAbas);

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {visiveis.map((aba) => {
        const ativo = subAba === aba.id;
        return (
          <button
            key={aba.id}
            type="button"
            onClick={() => onChange(aba.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ativo
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {aba.icone}
            {aba.rotulo}
          </button>
        );
      })}
    </div>
  );
};
