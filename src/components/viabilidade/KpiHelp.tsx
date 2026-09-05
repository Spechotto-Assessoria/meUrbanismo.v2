import { HelpCircle } from 'lucide-react';

export const AJUDA_KPI = {
  vgv: 'Quanto se espera faturar com as vendas do empreendimento, já considerando o reajuste (IPCA) ao longo do tempo.',
  lucro: 'O que sobra depois de pagar terreno, obra, custos indiretos, impostos e comissão de vendas.',
  margem: 'Lucro em percentual do VGV: de cada R$ 100 vendidos, quanto vira lucro.',
  roi: 'Lucro em percentual do dinheiro colocado no negócio (terreno + obra + indiretos).',
  tir: 'Taxa de rendimento do projeto. Compare com a TMA: se a TIR for maior, o investimento é atrativo.',
  vpl: 'Valor de hoje de todo o caixa futuro, descontado pela TMA. Positivo significa que o projeto cria valor.',
  payback: 'Em quantos meses o fluxo de caixa, já descontado pela TMA, deixa de ser negativo e vira positivo.',
  exposicao: 'O maior rombo de caixa no caminho — o pico negativo antes das vendas cobrirem os gastos.',
};

type Props = { texto: string; align?: 'left' | 'right' };

export function KpiHelp({ texto, align = 'left' }: Props) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        title={texto}
        aria-label="O que significa este indicador"
        className="rounded-md p-0.5 text-slate-400 hover:text-navy-800 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-navy-800"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-20 mt-1 hidden w-56 rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-medium normal-case tracking-normal text-slate-600 leading-relaxed shadow-sm group-hover:block group-focus-within:block ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {texto}
      </span>
      <span className="sr-only">{texto}</span>
    </span>
  );
}
