import { useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { brlCents, pctBR, type ViabilidadeResult } from '../../lib/viabilidade';
import type { PremissasObra } from '../../hooks/useViabilidadeObra';

const CAMPOS: { key: keyof PremissasObra; label: string; suffix: string; step: number }[] = [
  { key: 'custo_terreno', label: 'Custo do terreno', suffix: 'R$', step: 1000 },
  { key: 'custos_indiretos_pct', label: 'Custos indiretos', suffix: '% da obra', step: 0.01 },
  { key: 'comissao_pct', label: 'Comissão de vendas', suffix: '% da receita', step: 0.1 },
  { key: 'impostos_pct', label: 'Impostos', suffix: '% da receita', step: 0.1 },
  { key: 'reajuste_receita_pct_am', label: 'Projeção do IPCA', suffix: '% a.m.', step: 0.01 },
  { key: 'incc_pct_am', label: 'Projeção do INCC', suffix: '% a.m.', step: 0.01 },
  { key: 'taxa_minima_aa', label: 'TMA — taxa mínima de atratividade', suffix: '% a.a.', step: 0.01 },
  { key: 'prazo_meses', label: 'Prazo de obra', suffix: 'meses', step: 1 },
  { key: 'prazo_vendas_meses', label: 'Prazo de vendas', suffix: 'meses', step: 1 },
  { key: 'entrada_pct', label: 'Entrada na venda', suffix: '% do lote', step: 1 },
  { key: 'parcelas_meses', label: 'Parcelamento do saldo', suffix: 'meses', step: 1 },
];

type Props = {
  premissas: PremissasObra;
  resultado: ViabilidadeResult;
  canEdit: boolean;
  sugeridoPct: number;
  onChange: (key: keyof PremissasObra, value: number) => void;
  onAplicarIndiretos?: () => void;
};

export function AuditoriaPremissasViabilidade({
  premissas,
  resultado,
  canEdit,
  sugeridoPct,
  onChange,
  onAplicarIndiretos,
}: Props) {
  const [open, setOpen] = useState(false);
  const r = resultado;

  const kpis = [
    { label: 'VPL', value: brlCents(r.vpl) },
    { label: 'TIR (a.a.)', value: r.tirAnual != null && r.tirConfiavel ? pctBR(r.tirAnual) : '—' },
    { label: 'ROI', value: pctBR(r.roi) },
    { label: 'Lucro estimado', value: brlCents(r.lucro) },
    { label: 'Payback', value: r.paybackMeses != null ? `${r.paybackMeses} meses` : '—' },
    { label: 'TMA mensal equivalente', value: pctBR(r.taxaMensalTMA, 4) },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ClipboardCheck className="w-4 h-4 text-navy-800" /> Auditoria de premissas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Auditoria de premissas e cálculos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajuste TMA, IPCA, INCC, prazos e condições de pagamento. O recálculo é imediato.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CAMPOS.map((c) => (
                  <div key={c.key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {c.label} <span className="text-slate-400">({c.suffix})</span>
                    </label>
                    <input
                      type="number"
                      step={c.step}
                      min={0}
                      disabled={!canEdit}
                      value={premissas[c.key]}
                      onChange={(e) => onChange(c.key, Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-right font-mono text-xs tabular-nums text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-800"
                    />
                    {c.key === 'custos_indiretos_pct' && sugeridoPct > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Sugerido pelo orçamento: {pctBR(sugeridoPct)}</span>
                        {canEdit && onAplicarIndiretos && (
                          <button type="button" onClick={onAplicarIndiretos} className="font-bold text-navy-800 hover:underline">
                            Aplicar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{k.label}</p>
                    <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{k.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700">
                  Curva J — recebimentos e desembolsos
                </h4>
                <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold text-slate-600">Mês</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Recebimentos</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Desembolsos</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Líquido</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.fluxo.map((f) => (
                        <tr key={f.mes} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">M{f.mes}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">{brlCents(f.receita)}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">{brlCents(f.despesa)}</td>
                          <td className={`px-3 py-1.5 text-right font-mono tabular-nums ${f.liquido >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {brlCents(f.liquido)}
                          </td>
                          <td className={`px-3 py-1.5 text-right font-mono tabular-nums ${f.acumulado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {brlCents(f.acumulado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
