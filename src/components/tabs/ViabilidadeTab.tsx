import React from 'react';
import {
  PieChart,
  DollarSign,
  Percent,
  TrendingUp,
  ShieldAlert,
  Clock,
  Calculator,
  TrendingDown,
  Sparkles,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useViabilidadeObra } from '../../hooks/useViabilidadeObra';
import { brlCents, paybackBR, pctBR } from '../../lib/viabilidade';
import { AuditoriaPremissasViabilidade } from '../viabilidade/AuditoriaPremissasViabilidade';
import { AJUDA_KPI, KpiHelp } from '../viabilidade/KpiHelp';
import { WaterfallVGV } from '../viabilidade/WaterfallVGV';
import { ViabilidadeObraCharts } from '../viabilidade/ViabilidadeObraCharts';
import { SkeletonTable } from '../common/SkeletonLoader';

function AcessoRestrito() {
  return (
    <div className="p-8 text-center bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto mt-10">
      <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
      <h3 className="text-sm font-bold text-slate-800">Acesso Restrito</h3>
      <p className="text-xs text-slate-500">
        Os cálculos econômico-financeiros desta aba são exclusivos para administrador e proprietário/investidor.
      </p>
    </div>
  );
}

export const ViabilidadeTab: React.FC = () => {
  const { isAdmin, role } = useAuth();
  const podeVer = isAdmin || role === 'PROPRIETARIO_INVESTIDOR' || role === 'INVESTIDOR';
  if (!podeVer) return <AcessoRestrito />;
  return <ViabilidadeConteudo canEdit={!!isAdmin} />;
};

const ViabilidadeConteudo: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const { activeObra } = useAuth();
  const v = useViabilidadeObra(activeObra?.id, activeObra);
  const r = v.resultado;

  if (v.loading) return <SkeletonTable />;

  const kpis = [
    { label: 'VGV Reajustado', value: brlCents(r.vgvReajustado), hint: `${brlCents(v.precoEfetivoM2)}/m²`, icon: DollarSign, tone: 'text-navy-800', iconTone: 'text-navy-800', help: AJUDA_KPI.vgv },
    { label: 'Lucro Estimado', value: brlCents(r.lucro), hint: 'Líquido projetado', icon: TrendingUp, tone: r.lucro >= 0 ? 'text-emerald-600' : 'text-rose-600', iconTone: r.lucro >= 0 ? 'text-emerald-600' : 'text-rose-600', help: AJUDA_KPI.lucro },
    { label: 'Margem s/ VGV', value: pctBR(r.margem), hint: 'Eficiência comercial', icon: Percent, tone: 'text-slate-800', iconTone: 'text-slate-600', help: AJUDA_KPI.margem },
    { label: 'ROI Global', value: pctBR(r.roi), hint: 'Retorno s/ capital investido', icon: Sparkles, tone: 'text-amber-700', iconTone: 'text-amber-600', help: AJUDA_KPI.roi },
    { label: 'TIR Anual', value: r.tirAnual != null && r.tirConfiavel ? `${pctBR(r.tirAnual)} a.a.` : '—', hint: 'Taxa interna de retorno', icon: TrendingUp, tone: 'text-cyan-700', iconTone: 'text-cyan-600', help: AJUDA_KPI.tir },
    { label: `VPL @ ${pctBR(v.form.taxa_minima_aa, 0)} a.a.`, value: brlCents(r.vpl), hint: 'Valor presente líquido', icon: Calculator, tone: r.vpl >= 0 ? 'text-indigo-700' : 'text-rose-600', iconTone: 'text-indigo-600', help: AJUDA_KPI.vpl },
    { label: 'Payback', value: paybackBR(r.paybackDescontadoMeses), hint: 'Descontado pela TMA', icon: Clock, tone: 'text-orange-700', iconTone: 'text-orange-600', help: AJUDA_KPI.payback },
    { label: 'Exposição Máxima', value: brlCents(Math.abs(r.exposicaoMaxima)), hint: `Pico no mês ${r.exposicaoMes}`, icon: TrendingDown, tone: 'text-rose-600', iconTone: 'text-rose-600', help: AJUDA_KPI.exposicao },
  ];

  return (
    <div className="space-y-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] max-w-7xl mx-auto animate-fadeIn overflow-x-hidden">
      {v.sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between shadow-sm">
          <span>{v.sucesso}</span>
          <button type="button" onClick={() => v.setSucesso(null)}>×</button>
        </div>
      )}
      {v.erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between shadow-sm">
          <span>{v.erro}</span>
          <button type="button" onClick={() => v.setErro(null)}>×</button>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 text-navy-900 border border-slate-200 uppercase tracking-wider">
                Análise econômica
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
                Sincronizado c/ Orçamento
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-navy-800" /> Viabilidade Econômico-Financeira
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Custo da obra <strong>{brlCents(v.orcamento.custoObra)}</strong>
              {v.orcamento.indiretos > 0 && <> • indiretos no orçamento {brlCents(v.orcamento.indiretos)}</>}
              {v.fonteVgv === 'lotes'
                ? ` • VGV dos lotes do mapa (${v.areaLotes.toLocaleString('pt-BR')} m²)`
                : ` • ${v.areaVendavel.toLocaleString('pt-BR')} m² vendáveis`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs shadow-sm">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">R$/m² Médio Venda</label>
                <input
                  type="number"
                  value={Math.round(v.precoEfetivoM2 * 100) / 100}
                  disabled={!canEdit || v.fonteVgv === 'lotes'}
                  onChange={(e) => v.setPremissa('preco_m2', Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 text-right disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-800"
                />
              </div>
            </div>
            <AuditoriaPremissasViabilidade
              premissas={v.form}
              vgv={v.vgv}
              custoObra={v.orcamento.custoObra}
              canEdit={canEdit}
              sugeridoPct={v.orcamento.sugeridoPct}
              salvando={v.salvando}
              onSalvarPremissas={(p) => v.salvar(p)}
            />
            {canEdit && (
              <button
                type="button"
                disabled={v.salvando || !v.dirty}
                onClick={() => void v.salvar()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-xs font-semibold text-white disabled:opacity-50 shadow-sm"
              >
                {v.salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>

      {r.tirAnual != null && r.tirAnual > 200 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-sm">
          TIR anual muito elevada ({pctBR(r.tirAnual)}). Revise prazos de venda e desembolso — entradas
          concentradas no início elevam a taxa artificialmente.
        </p>
      )}

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 min-w-0">
            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${k.iconTone}`}>
              <k.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 flex-1">{k.label}</span>
              <KpiHelp texto={k.help} align={i % 2 === 1 || i >= 6 ? 'right' : 'left'} />
            </div>
            <div className={`text-base sm:text-xl font-black tabular-nums break-words ${k.tone}`}>{k.value}</div>
            <div className="text-[10px] text-slate-500">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Resultado operacional — quebra do VGV
          </h3>
          <p className="text-xs text-slate-500">
            Lucro estimado{' '}
            <strong className={r.lucro >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{brlCents(r.lucro)}</strong>
          </p>
        </div>
        <WaterfallVGV
          vgvReajustado={r.vgvReajustado}
          impostosComissoes={r.impostos + r.comissao}
          custoTerreno={v.form.custo_terreno}
          custoObraIndiretos={r.custoObraReajustado + r.custosIndiretos}
          lucro={r.lucro}
        />
      </div>

      <ViabilidadeObraCharts resultado={r} custoTerreno={v.form.custo_terreno} />
    </div>
  );
};
