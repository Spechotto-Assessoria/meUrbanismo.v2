import { isRlsDenied } from "@/lib/rls";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceDot,

  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  brlCents,
  brlShort,
  calcViabilidade,
  pctBR,
  vgvDosLotes,
  TMA_PADRAO_AA,
  ENTRADA_PADRAO_PCT,
  PARCELAS_PADRAO,
  type Lote,
  type ViabilidadeInput,
} from "@/lib/viabilidade";
import { AuditoriaPremissas } from "@/components/viabilidade/AuditoriaPremissas";
import { WaterfallVGV } from "@/components/viabilidade/WaterfallVGV";


const NAVY = "#1E3A8A";
const COBALT = "#2563EB";
const SLATE = "#64748B";
const CORAL = "#EF4444";
const EMERALD = "#10B981";

export const Route = createFileRoute("/_authenticated/obras/$obraId/viabilidade")({
  head: () => ({
    meta: [
      { title: "Estudo de viabilidade — meUrbanismo" },
      { name: "description", content: "VGV por lotes, reajustes IPCA e INCC, TIR, VPL e payback do empreendimento." },
    ],
  }),
  component: ViabilidadePage,
});

/** Formata em tempo real como moeda BRL a partir dos dígitos digitados (centavos). */
function maskMoney(digits: string) {
  const n = Number(digits.replace(/\D/g, "")) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function MoneyInput({
  value,
  disabled,
  onChange,
  className,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(() => maskMoney(String(Math.round(value * 100))));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(maskMoney(String(Math.round(value * 100))));
  }, [value, focused]);
  return (
    <Input
      inputMode="numeric"
      value={text}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
        setText(maskMoney(digits));
        onChange(Number(digits) / 100);
      }}
      className={`text-right font-mono tabular-nums ${className ?? ""}`}
    />
  );
}

function PercentInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(String(value).replace(".", ","));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value).replace(".", ","));
  }, [value, focused]);
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        value={text}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,.]/g, "").replace(".", ",");
          setText(raw);
          onChange(Number(raw.replace(",", ".")) || 0);
        }}
        className="pr-8 text-right font-mono tabular-nums"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        %
      </span>
    </div>
  );
}

type Form = Required<ViabilidadeInput>;

const defaults: Form = {
  vgv: 0,
  custo_terreno: 0,
  custo_obra: 0,
  custos_indiretos_pct: 10,
  comissao_pct: 5,
  impostos_pct: 6,
  taxa_minima_aa: TMA_PADRAO_AA,
  prazo_meses: 24,
  prazo_vendas_meses: 60,
  reajuste_receita_pct_am: 0.4,
  incc_pct_am: 0.5,
  entrada_pct: ENTRADA_PADRAO_PCT,
  parcelas_meses: PARCELAS_PADRAO,
};

const loteVazio: Lote = { descricao: "Lotes padrão", quantidade: 0, area_m2: 0, valor_m2: 0 };

const campos: { key: keyof Form; label: string; suffix?: string; tipo: "moeda" | "pct" | "num" }[] = [
  { key: "custo_terreno", label: "Custo do terreno", tipo: "moeda" },
  { key: "custo_obra", label: "Custo de obra (infraestrutura)", tipo: "moeda" },
  { key: "custos_indiretos_pct", label: "Custos indiretos", suffix: "% da obra", tipo: "pct" },
  { key: "comissao_pct", label: "Comissão de vendas", suffix: "% da receita", tipo: "pct" },
  { key: "impostos_pct", label: "Impostos", suffix: "% da receita", tipo: "pct" },
  { key: "taxa_minima_aa", label: "TMA (taxa mínima de atratividade)", suffix: "% a.a.", tipo: "pct" },
  { key: "reajuste_receita_pct_am", label: "Reajuste da receita (IPCA)", suffix: "% a.m.", tipo: "pct" },
  { key: "incc_pct_am", label: "Reajuste de custos (INCC)", suffix: "% a.m.", tipo: "pct" },
  { key: "prazo_meses", label: "Prazo de obra", suffix: "meses", tipo: "num" },
  { key: "prazo_vendas_meses", label: "Prazo de vendas", suffix: "meses", tipo: "num" },
  { key: "entrada_pct", label: "Entrada na venda", suffix: "% do lote", tipo: "pct" },
  { key: "parcelas_meses", label: "Parcelamento do saldo", suffix: "meses", tipo: "num" },
];

function ViabilidadePage() {
  const { obraId } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(defaults);
  const [lotes, setLotes] = useState<Lote[]>([loteVazio]);
  const [vgvManual, setVgvManual] = useState(false);
  const [obs, setObs] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: row, isLoading } = useQuery({
    queryKey: ["viabilidade", obraId],
    queryFn: async () => {
      const res = await supabase.from("viabilidade").select("*").eq("obra_id", obraId).maybeSingle();
      if (res.error) {
        if (isRlsDenied(res.error)) return null;
        throw res.error;
      }
      return res.data;

    },
  });

  const { data: orcamento } = useQuery({
    queryKey: ["etapas-orcamento", obraId],
    queryFn: async () => {
      const { data, error } = await supabase.from("etapas").select("nome, valor_total").eq("obra_id", obraId);
      if (error) throw error;
      const linhas = data ?? [];
      let total = 0;
      let indiretos = 0;
      for (const e of linhas) {
        const v = Number(e.valor_total) || 0;
        total += v;
        if (/indiret/i.test(e.nome ?? "")) indiretos += v;
      }
      return { total, indiretos, direto: Math.max(0, total - indiretos) };
    },
  });

  const indiretosPctSugerido =
    orcamento && orcamento.direto > 0 ? (orcamento.indiretos / orcamento.direto) * 100 : 0;

  useEffect(() => {
    if (row) {
      setForm({
        vgv: Number(row.vgv),
        custo_terreno: Number(row.custo_terreno),
        custo_obra: Number(row.custo_obra),
        custos_indiretos_pct: Number(row.custos_indiretos_pct),
        comissao_pct: Number(row.comissao_pct),
        impostos_pct: Number(row.impostos_pct),
        taxa_minima_aa: Number(row.taxa_minima_aa) || TMA_PADRAO_AA,
        prazo_meses: row.prazo_meses,
        prazo_vendas_meses: row.prazo_vendas_meses,
        reajuste_receita_pct_am: Number(row.reajuste_receita_pct_am ?? 0),
        incc_pct_am: Number(row.incc_pct_am ?? 0),
        entrada_pct: Number(row.entrada_pct ?? ENTRADA_PADRAO_PCT),
        parcelas_meses: Number(row.parcelas_meses ?? PARCELAS_PADRAO),
      });
      const raw = Array.isArray(row.lotes) ? (row.lotes as unknown as Lote[]) : [];
      setLotes(raw.length > 0 ? raw : [loteVazio]);
      setVgvManual(!!row.vgv_manual);
      setObs(row.observacoes ?? "");
      setDirty(false);
    } else if (orcamento && orcamento.direto > 0) {
      setForm((f) => ({
        ...f,
        custo_obra: f.custo_obra || orcamento.direto,
        custos_indiretos_pct:
          orcamento.indiretos > 0
            ? Number(((orcamento.indiretos / orcamento.direto) * 100).toFixed(2))
            : f.custos_indiretos_pct,
      }));
    }
  }, [row, orcamento]);


  const lotesCalc = useMemo(() => vgvDosLotes(lotes), [lotes]);
  const vgvEfetivo = vgvManual ? form.vgv : lotesCalc.vgv;

  const r = useMemo(() => calcViabilidade({ ...form, vgv: vgvEfetivo }), [form, vgvEfetivo]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        vgv: vgvEfetivo,
        obra_id: obraId,
        observacoes: obs,
        lotes: lotes as unknown as never,
        vgv_manual: vgvManual,
        area_total_venda: lotesCalc.area,
        valor_m2: lotesCalc.area > 0 ? lotesCalc.vgv / lotesCalc.area : 0,
        created_by: user?.id ?? null,
      };
      const { error } = await supabase.from("viabilidade").upsert(payload, { onConflict: "obra_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estudo de viabilidade salvo");
      qc.invalidateQueries({ queryKey: ["viabilidade", obraId] });
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  const set = (k: keyof Form, v: number) => {
    setForm((f) => ({ ...f, [k]: Number.isFinite(v) ? v : 0 }));
    setDirty(true);
  };
  const setLote = (i: number, patch: Partial<Lote>) => {
    setLotes((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  const kpis = [
    { label: "VGV reajustado", value: brlCents(r.vgvReajustado), tone: "text-foreground" },
    { label: "Lucro estimado", value: brlCents(r.lucro), tone: r.lucro >= 0 ? "text-emerald-600" : "text-destructive" },
    { label: "Margem sobre VGV", value: pctBR(r.margem), tone: "text-foreground" },
    { label: "ROI", value: pctBR(r.roi), tone: "text-foreground" },
    {
      label: "TIR (a.a.)",
      value: r.tirAnual != null && r.tirConfiavel ? pctBR(r.tirAnual) : "—",
      tone: "text-foreground",
    },
    {
      label: `VPL @ TMA ${pctBR(form.taxa_minima_aa)} a.a.`,
      value: brlCents(r.vpl),
      tone: r.vpl >= 0 ? "text-emerald-600" : "text-destructive",
    },
    {
      label: "Payback",
      value: r.paybackMeses != null ? `${r.paybackMeses} meses` : "—",
      tone: "text-foreground",
    },
    {
      label: `Exposição máxima (mês ${r.exposicaoMes})`,
      value: brlCents(Math.abs(r.exposicaoMaxima)),
      tone: "text-foreground",
    },

  ];

  const chart = r.fluxo.map((f) => ({
    mes: f.mes,
    label: `M${f.mes}`,
    acumulado: Math.round(f.acumulado),
    receita: Math.round(f.receita),
    despesa: -Math.round(f.despesa),
    liquido: Math.round(f.liquido),
  }));
  const passo = Math.max(1, Math.ceil(chart.length / 6));
  const expoPonto = chart.find((d) => d.mes === r.exposicaoMes) ?? null;
  const paybackPonto = r.paybackMeses != null ? (chart.find((d) => d.mes === r.paybackMeses) ?? null) : null;

  const ticks = chart.filter((_, i) => i % passo === 0).map((d) => d.label);

  const composicao = [
    { nome: "Terreno", valor: form.custo_terreno, cor: NAVY },
    { nome: "Obra", valor: r.custoObraReajustado, cor: COBALT },
    { nome: "Indiretos", valor: r.custosIndiretos, cor: "#5B7FA6" },
    { nome: "Comissão", valor: r.comissao, cor: SLATE },
    { nome: "Impostos", valor: r.impostos, cor: "#94A3B8" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">Estudo de viabilidade</h2>
          <p className="max-w-full text-sm leading-relaxed text-muted-foreground">
            VGV por lotes, reajustes IPCA/INCC, ROI, TIR, VPL e payback calculados automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">

          <AuditoriaPremissas
            premissas={form}
            resultado={r}
            canEdit={isAdmin}
            onChange={(k, v) => set(k, v)}
          />
          {isAdmin && (
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Salvar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={`mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl ${k.tone}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {r.tirAnual != null && r.tirConfiavel && r.tirAnual > 200 && (
        <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          TIR anual muito elevada ({pctBR(r.tirAnual)}). Reveja as premissas de prazo de vendas e de desembolso —
          entradas concentradas no início do fluxo elevam artificialmente a TIR.
        </p>
      )}

      {/* Composição do VGV por lotes */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display font-semibold">Receita de vendas (VGV)</h3>
              <p className="text-xs text-muted-foreground">
                {lotesCalc.area.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m² de área vendável •{" "}
                {lotesCalc.area > 0 ? brlCents(lotesCalc.vgv / lotesCalc.area) : brlCents(0)} / m² médio
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Label className="text-xs">VGV manual</Label>
              <Switch
                checked={vgvManual}
                disabled={!isAdmin}
                onCheckedChange={(v) => { setVgvManual(v); setDirty(true); }}
              />
            </div>
          </div>

          {vgvManual ? (
            <div className="max-w-xs space-y-1.5">
              <Label className="text-xs">VGV total</Label>
              <MoneyInput value={form.vgv} disabled={!isAdmin} onChange={(v) => set("vgv", v)} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_90px_110px_140px_150px_36px]">
                <span>Tipologia</span>
                <span className="text-right">Qtd</span>
                <span className="text-right">Área (m²)</span>
                <span className="text-right">R$ / m²</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              {lotes.map((l, i) => {
                const sub = (l.quantidade || 0) * (l.area_m2 || 0) * (l.valor_m2 || 0);
                return (
                  <div
                    key={i}
                    className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_90px_110px_140px_150px_36px] sm:items-center sm:rounded-lg sm:border-0 sm:p-0"
                  >
                    <Input
                      value={l.descricao}
                      disabled={!isAdmin}
                      placeholder="Ex.: Lotes 300 m²"
                      onChange={(e) => setLote(i, { descricao: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={l.quantidade}
                      disabled={!isAdmin}
                      onChange={(e) => setLote(i, { quantidade: Number(e.target.value) || 0 })}
                      className="text-right font-mono tabular-nums"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={l.area_m2}
                      disabled={!isAdmin}
                      onChange={(e) => setLote(i, { area_m2: Number(e.target.value) || 0 })}
                      className="text-right font-mono tabular-nums"
                    />
                    <MoneyInput value={l.valor_m2} disabled={!isAdmin} onChange={(v) => setLote(i, { valor_m2: v })} />
                    <p className="text-right font-mono text-sm tabular-nums text-muted-foreground">{brlCents(sub)}</p>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setLotes((ls) => ls.filter((_, j) => j !== i)); setDirty(true); }}
                        title="Remover tipologia"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setLotes((ls) => [...ls, { ...loteVazio, descricao: "" }]); setDirty(true); }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Adicionar tipologia
                  </Button>
                )}
                <p className="ml-auto text-sm text-muted-foreground">
                  VGV nominal <strong className="font-mono text-foreground tabular-nums">{brlCents(lotesCalc.vgv)}</strong>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          {orcamento && orcamento.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Orçamento global: <strong className="text-foreground">{brlCents(orcamento.total)}</strong> • diretos{" "}
                <strong className="text-foreground">{brlCents(orcamento.direto)}</strong> • indiretos{" "}
                <strong className="text-foreground">{brlCents(orcamento.indiretos)}</strong>
              </p>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    set("custo_obra", orcamento.direto);
                    set("custos_indiretos_pct", Number(indiretosPctSugerido.toFixed(2)));
                  }}
                >
                  Puxar do orçamento
                </Button>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campos.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <Label className="text-xs">
                {c.label} {c.suffix && <span className="text-muted-foreground">({c.suffix})</span>}
              </Label>
              {c.tipo === "moeda" ? (
                <MoneyInput value={form[c.key]} disabled={!isAdmin} onChange={(v) => set(c.key, v)} />
              ) : c.tipo === "pct" ? (
                <PercentInput value={form[c.key]} disabled={!isAdmin} onChange={(v) => set(c.key, v)} />
              ) : (
                <Input
                  type="number"
                  min={1}
                  value={form[c.key]}
                  disabled={!isAdmin}
                  onChange={(e) => set(c.key, Number(e.target.value) || 0)}
                  className="text-right font-mono tabular-nums"
                />
              )}
              {c.key === "custos_indiretos_pct" && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    ={" "}
                    <strong className="font-mono tabular-nums text-foreground">
                      {brlCents((form.custo_obra * form.custos_indiretos_pct) / 100)}
                    </strong>
                  </span>
                  {orcamento && orcamento.indiretos > 0 && (
                    <span>• sugerido {brlCents(orcamento.indiretos)} ({pctBR(indiretosPctSugerido)})</span>
                  )}
                  {isAdmin && orcamento && orcamento.indiretos > 0 && (
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-foreground"
                      onClick={() => set("custos_indiretos_pct", Number(indiretosPctSugerido.toFixed(2)))}
                    >
                      Usar sugerido
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-foreground"
                      onClick={() => set("custos_indiretos_pct", 0)}
                    >
                      Zerar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Observações / premissas</Label>
            <Textarea
              rows={3}
              value={obs}
              disabled={!isAdmin}
              onChange={(e) => { setObs(e.target.value); setDirty(true); }}
              placeholder="Premissas adotadas no estudo…"
            />
          </div>
          </div>
        </CardContent>

      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
              <TrendingUp className="h-4 w-4" style={{ color: COBALT }} /> Fluxo de caixa acumulado (curva J)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-acum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={NAVY} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={SLATE} opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" ticks={ticks} tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={{ stroke: SLATE, opacity: 0.3 }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: SLATE }}
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    tickFormatter={(v: number) => brlShort(v)}
                  />
                  <Tooltip content={<FluxoTooltip />} cursor={{ stroke: SLATE, strokeDasharray: "3 3" }} />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke={NAVY}
                    strokeWidth={3}
                    fill="url(#grad-acum)"
                    fillOpacity={0.2}
                    activeDot={{ r: 4, fill: COBALT, stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive
                  />
                  {expoPonto && (
                    <ReferenceDot
                      x={expoPonto.label}
                      y={expoPonto.acumulado}
                      r={6}
                      fill={CORAL}
                      stroke="#fff"
                      strokeWidth={2}
                      isFront
                    />
                  )}
                  {paybackPonto && (
                    <ReferenceDot
                      x={paybackPonto.label}
                      y={paybackPonto.acumulado}
                      r={6}
                      fill={EMERALD}
                      stroke="#fff"
                      strokeWidth={2}
                      isFront
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: CORAL }} />
              Exposição máxima: <strong>{brlCents(Math.abs(r.exposicaoMaxima))}</strong> no mês {r.exposicaoMes}
              {" • "}
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: EMERALD }} />
              Payback: <strong>{r.paybackMeses != null ? `mês ${r.paybackMeses}` : "não atingido"}</strong>
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 font-display font-semibold">Receitas x Despesas por mês</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} stackOffset="sign" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={SLATE} opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" ticks={ticks} tick={{ fontSize: 10, fill: SLATE }} tickLine={false} axisLine={{ stroke: SLATE, opacity: 0.3 }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: SLATE }}
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    tickFormatter={(v: number) => brlShort(v)}
                  />
                  <Tooltip content={<ReceitaDespesaTooltip />} cursor={{ fill: SLATE, fillOpacity: 0.08 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="receita" name="Receitas" stackId="rd" fill={EMERALD} radius={[4, 4, 0, 0]} isAnimationActive />
                  <Bar dataKey="despesa" name="Despesas" stackId="rd" fill={CORAL} radius={[0, 0, 4, 4]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display font-semibold">Resultado operacional — quebra do VGV</h3>
            <p className="text-sm text-muted-foreground">
              Lucro estimado{" "}
              <strong className={r.lucro >= 0 ? "text-emerald-600" : "text-destructive"}>{brlCents(r.lucro)}</strong>
            </p>
          </div>
          <WaterfallVGV
            vgvReajustado={r.vgvReajustado}
            impostosComissoes={r.impostos + r.comissao}
            custoTerreno={form.custo_terreno}
            custoObraIndiretos={r.custoObraReajustado + r.custosIndiretos}
            lucro={r.lucro}
          />
        </CardContent>
      </Card>



      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display font-semibold">Composição de custos</h3>
            <p className="text-sm text-muted-foreground">
              Custo total <strong className="text-foreground tabular-nums">{brlCents(r.custoTotal)}</strong>
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={composicao.filter((c) => c.valor > 0)}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius="58%"
                    outerRadius="85%"
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive
                  >
                    {composicao.filter((c) => c.valor > 0).map((c) => (
                      <Cell key={c.nome} fill={c.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip total={r.custoTotal} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {composicao.map((c) => {
                const p = r.custoTotal > 0 ? (c.valor / r.custoTotal) * 100 : 0;
                return (
                  <div key={c.nome} className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{c.nome}</span>
                      <span className="font-mono text-xs tabular-nums" style={{ color: c.cor }}>
                        {pctBR(p)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, p)}%`, background: c.cor }}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-sm tabular-nums text-muted-foreground">{brlCents(c.valor)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FluxoTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-elegant backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Mês {String(label).replace("M", "")}
      </p>
      <p className="font-display text-sm font-bold tabular-nums" style={{ color: NAVY }}>
        {brlCents(Number(payload[0].value))}
      </p>
      <p className="text-[10px] text-muted-foreground">Caixa acumulado</p>
    </div>
  );
}

function ReceitaDespesaTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const receita = Number(payload.find((p) => p.dataKey === "receita")?.value ?? 0);
  const despesa = Math.abs(Number(payload.find((p) => p.dataKey === "despesa")?.value ?? 0));
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-elegant backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Mês {String(label).replace("M", "")}
      </p>
      <p className="font-mono text-sm tabular-nums" style={{ color: EMERALD }}>{brlCents(receita)}</p>
      <p className="font-mono text-sm tabular-nums" style={{ color: CORAL }}>-{brlCents(despesa)}</p>
      <p className="mt-1 font-display text-sm font-bold tabular-nums" style={{ color: NAVY }}>
        {brlCents(receita - despesa)}
      </p>
    </div>
  );
}

function DonutTooltip({ active, payload, total }: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value);
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-elegant backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{payload[0].name}</p>
      <p className="font-display text-sm font-bold tabular-nums" style={{ color: NAVY }}>{brlCents(v)}</p>
      <p className="text-[10px] text-muted-foreground">{pctBR(total > 0 ? (v / total) * 100 : 0)} do custo total</p>
    </div>
  );
}
