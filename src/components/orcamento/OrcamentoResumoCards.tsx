import React from 'react';
import { DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../tabs/ui-components';

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

type Props = {
  totalOrcado: number;
  totalExecutado: number;
  percentualGeral: string;
};

export const OrcamentoResumoCards: React.FC<Props> = ({
  totalOrcado,
  totalExecutado,
  percentualGeral,
}) => {
  const saldo = totalOrcado - totalExecutado;
  const pctPendente = (100 - Number(percentualGeral)).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <Card className="bg-navy-950 border-slate-800 text-white shadow-sm">
        <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
            Orçamento Global Previsto
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">{brl(totalOrcado)}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% da planilha contratada</div>
        </CardContent>
      </Card>

      <Card className="bg-navy-950 border-brand-500/30 text-white shadow-glow-sm">
        <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="text-[11px] font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
            Total Medido / Executado
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-300 mt-1">{brl(totalExecutado)}</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            {percentualGeral}% do custo total realizado
          </div>
        </CardContent>
      </Card>

      <Card className="bg-navy-950 border-slate-800 text-white shadow-sm">
        <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            Saldo a Executar
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">{brl(saldo)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{pctPendente}% pendente de medição</div>
        </CardContent>
      </Card>
    </div>
  );
};
