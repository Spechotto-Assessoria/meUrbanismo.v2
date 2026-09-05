import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardCheck, Loader2, Save, X } from 'lucide-react';
import { brlCents, calcViabilidade, mesesBR, pctBR } from '../../lib/viabilidade';
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
  vgv: number;
  custoObra: number;
  canEdit: boolean;
  sugeridoPct: number;
  salvando?: boolean;
  onSalvarPremissas: (p: PremissasObra) => Promise<boolean>;
};

export function AuditoriaPremissasViabilidade({
  premissas,
  vgv,
  custoObra,
  canEdit,
  sugeridoPct,
  salvando,
  onSalvarPremissas,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PremissasObra>(premissas);

  useEffect(() => {
    if (open) setDraft(premissas);
  }, [open, premissas]);

  const r = useMemo(
    () => calcViabilidade({ ...draft, vgv, custo_obra: custoObra }),
    [draft, vgv, custoObra]
  );

  const fechar = () => setOpen(false);

  const confirmar = async () => {
    if (!canEdit) {
      fechar();
      return;
    }
    const ok = await onSalvarPremissas(draft);
    if (ok) fechar();
  };

  const kpis = [
    { label: 'VPL', value: brlCents(r.vpl) },
    { label: 'TIR (a.a.)', value: r.tirAnual != null && r.tirConfiavel ? pctBR(r.tirAnual) : '—' },
    { label: 'ROI', value: pctBR(r.roi) },
    { label: 'Lucro estimado', value: brlCents(r.lucro) },
    { label: 'Payback', value: mesesBR(r.paybackMeses) },
    { label: 'Payback descontado', value: mesesBR(r.paybackDescontadoMeses) },
    { label: 'TMA mensal equivalente', value: pctBR(r.taxaMensalTMA, 4) },
  ];

  const modal =
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs"
        onClick={fechar}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auditoria-premissas-titulo"
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <h3 id="auditoria-premissas-titulo" className="text-sm font-black text-slate-900">
                Auditoria de premissas e cálculos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajuste TMA, IPCA, INCC, prazos e condições. O recálculo é imediato; grave para confirmar.
              </p>
            </div>
            <button
              type="button"
              onClick={fechar}
              className="p-1.5 rounded-xl hover:bg-slate-100"
              aria-label="Fechar"
            >
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
                    value={draft[c.key]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [c.key]: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-right font-mono text-xs tabular-nums text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-800"
                  />
                  {c.key === 'custos_indiretos_pct' && sugeridoPct > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Sugerido pelo orçamento: {pctBR(sugeridoPct)}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              custos_indiretos_pct: Number(sugeridoPct.toFixed(2)),
                            }))
                          }
                          className="font-bold text-navy-800 hover:underline"
                        >
                          Aplicar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {r.tirAnual != null && r.tirAnual > 200 && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                TIR anual muito elevada ({pctBR(r.tirAnual)}). Revise prazos de venda e desembolso.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{k.label}</p>
                  <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{k.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700">
                Curva J — recebimentos e desembolsos
              </h4>
              <div className="max-h-72 overflow-auto rounded-2xl border border-slate-200">
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

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fechar}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
            {canEdit && (
              <button
                type="button"
                disabled={salvando}
                onClick={() => void confirmar()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-xs font-semibold text-white disabled:opacity-50"
              >
                {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Premissas
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
      >
        <ClipboardCheck className="w-4 h-4 text-navy-800" /> Auditoria de premissas
      </button>
      {modal}
    </>
  );
}
