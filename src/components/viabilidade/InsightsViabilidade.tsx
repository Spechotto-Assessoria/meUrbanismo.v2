import { HardHat, Lightbulb, Tag, Wallet } from 'lucide-react';
import {
  ROTULO_ALERTA,
  type DiagnosticoViabilidade,
  type SugestaoViabilidade,
} from '../../lib/viabilidade-diagnostico';

const ICONE: Record<SugestaoViabilidade['id'], typeof Tag> = {
  preco: Tag,
  custo_obra: HardHat,
  fluxo: Wallet,
};

type Props = { diagnostico: DiagnosticoViabilidade };

export function InsightsViabilidade({ diagnostico }: Props) {
  if (diagnostico.sugestoes.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 sm:p-5 shadow-sm min-w-0"
      aria-labelledby="insights-viabilidade-titulo"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-navy-900 text-amber-100 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3
              id="insights-viabilidade-titulo"
              className="text-sm font-black text-slate-900 tracking-tight"
            >
              Recomendações e insights estratégicos
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Indicadores abaixo da TMA. Ajuste preço, orçamento ou condições de venda para corrigir o modelo.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {diagnostico.alertas.map((a) => (
                <span
                  key={a}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-amber-900 border border-amber-200/80"
                >
                  {ROTULO_ALERTA[a]}
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-2.5">
            {diagnostico.sugestoes.map((s) => {
              const Icone = ICONE[s.id];
              return (
                <li
                  key={s.id}
                  className="flex gap-2.5 rounded-xl border border-amber-200/60 bg-white/70 px-3 py-2.5"
                >
                  <Icone className="w-4 h-4 text-navy-800 shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900">{s.titulo}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5 break-words">
                      {s.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
