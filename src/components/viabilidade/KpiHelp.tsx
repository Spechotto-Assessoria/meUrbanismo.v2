import { useRef, useState } from 'react';
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

const LARGURA = 224;

export function KpiHelp({ texto }: { texto: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<'end' | 'center'>('end');

  const medir = () => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = Math.min(LARGURA, window.innerWidth - 24);
    const centroEsq = rect.left + rect.width / 2 - w / 2;
    if (rect.right + w > window.innerWidth - 8 || centroEsq < 8) setPos('end');
    else setPos('center');
  };

  return (
    <span className="relative inline-flex group">
      <button
        ref={btnRef}
        type="button"
        title={texto}
        aria-label="O que significa este indicador"
        onMouseEnter={medir}
        onFocus={medir}
        className="rounded-md p-0.5 text-slate-400 hover:text-navy-800 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-navy-800"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-1 hidden w-56 max-w-[min(14rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-medium normal-case tracking-normal text-slate-600 leading-relaxed shadow-sm group-hover:block group-focus-within:block ${
          pos === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {texto}
      </span>
      <span className="sr-only">{texto}</span>
    </span>
  );
}
