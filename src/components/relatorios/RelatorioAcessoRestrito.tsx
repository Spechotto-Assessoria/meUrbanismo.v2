import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const RelatorioAcessoRestrito: React.FC = () => (
  <div className="max-w-lg mx-auto my-12 animate-fadeIn">
    <div className="rounded-2xl border border-slate-800 bg-navy-900/90 p-8 text-center shadow-glass">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">Acesso Restrito</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        A geração e o arquivamento de relatórios executivos em PDF são exclusivos para o
        administrador master e proprietários do empreendimento.
      </p>
    </div>
  </div>
);
