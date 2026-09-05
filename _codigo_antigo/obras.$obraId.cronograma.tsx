import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Wand2, Sparkles, Upload, LineChart as LineChartIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GanttChart } from "@/components/GanttChart";
import { VersionHistory } from "@/components/VersionHistory";
import { ImportScheduleDialog } from "@/components/cronograma/ImportScheduleDialog";
import { useObraAccess } from "@/lib/obra-access";
import { gerarCronogramaBase, gridFromRows, parseCronogramaFile } from "@/lib/cronograma-io";
import { parseScheduleFileServer } from "@/lib/budget-pdf.functions";
import { fileToBase64 } from "@/lib/file-bytes";
import { limparNomeEtapa } from "@/lib/budget-parser";

import {
  restoreCronogramaVersao,
  saveCronogramaVersao,
  type CronogramaSnapshot,
} from "@/lib/versions";


export const Route = createFileRoute("/_authenticated/obras/$obraId/cronograma")({
  head: () => ({
    meta: [
      { title: "Cronograma físico-financeiro — meUrbanismo" },
      { name: "description", content: "Cronograma mensal por etapa, curva S e Gantt editável da obra." },
    ],
  }),
  component: CronogramaPage,
});


type Etapa = { id: string; ordem: number; nome: string; valor_total: number };
type Mes = { id?: string; etapa_id: string; ano_mes: string; percentual_previsto: number; percentual_realizado: number };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
const monthLabel = (k: string) => {
  const [y, m] = k.split("-");
  return `${m}/${y.slice(2)}`;
};

function monthsBetween(start: string, end: string): string[] {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const arr: string[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  const stop = new Date(e.getFullYear(), e.getMonth(), 1);
  while (cur <= stop) {
    arr.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return arr;
}

function CronogramaPage() {
  const { obraId } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const { ocultarFinanceiro } = useObraAccess();
  const money = (n: number) => (ocultarFinanceiro ? "—" : brl(n));
  const qc = useQueryClient();

  const { data: obra } = useQuery({
    queryKey: ["obra", obraId],
    queryFn: async () => {
      const { data, error } = await supabase.from("obras").select("data_inicio, data_fim_prevista, valor_global").eq("id", obraId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: etapas, isLoading: loadingEtapas } = useQuery({
    queryKey: ["etapas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase.from("etapas").select("id, ordem, nome, valor_total").eq("obra_id", obraId).order("ordem");
      if (error) throw error;
      return ((data ?? []) as Etapa[]).map((e) => ({ ...e, nome: limparNomeEtapa(e.nome) }));

    },
  });

  const { data: mesesDb, isLoading: loadingMeses } = useQuery({
    queryKey: ["cronograma", obraId],
    enabled: !!etapas && etapas.length > 0,
    queryFn: async () => {
      const ids = (etapas ?? []).map((e) => e.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("cronograma_meses").select("*").in("etapa_id", ids);
      if (error) throw error;
      return (data ?? []) as Mes[];
    },
  });

  const [months, setMonths] = useState<string[]>([]);
  const [grid, setGrid] = useState<Record<string, Record<string, number>>>({}); // etapaId → month → %prev
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!etapas) return;
    let ms: string[] = [];
    if (obra?.data_inicio && obra?.data_fim_prevista) {
      ms = monthsBetween(obra.data_inicio, obra.data_fim_prevista);
    }
    // fallback: use months present in db
    const dbMonths = new Set((mesesDb ?? []).map((m) => m.ano_mes.slice(0, 10)));
    for (const m of dbMonths) if (!ms.includes(m)) ms.push(m);
    ms.sort();
    setMonths(ms);

    const g: Record<string, Record<string, number>> = {};
    for (const e of etapas) g[e.id] = {};
    for (const m of mesesDb ?? []) {
      const k = m.ano_mes.slice(0, 10);
      if (!g[m.etapa_id]) g[m.etapa_id] = {};
      g[m.etapa_id][k] = Number(m.percentual_previsto);
    }
    // Cronograma base automático quando ainda não existe distribuição salva
    if ((mesesDb ?? []).length === 0 && ms.length > 0 && etapas.length > 0) {
      setGrid(gerarCronogramaBase(etapas, ms));
      setDirty(true);
      return;
    }
    setGrid(g);
    setDirty(false);
  }, [etapas, mesesDb, obra?.data_inicio, obra?.data_fim_prevista]);

  const distributeEven = () => {
    if (!etapas || months.length === 0) return;
    const g: Record<string, Record<string, number>> = {};
    const per = 100 / months.length;
    for (const e of etapas) {
      g[e.id] = {};
      for (const m of months) g[e.id][m] = Number(per.toFixed(2));
    }
    setGrid(g);
    setDirty(true);
  };

  const gerarBase = () => {
    if (!etapas || months.length === 0) return;
    setGrid(gerarCronogramaBase(etapas, months));
    setDirty(true);
    toast.success("Cronograma base gerado a partir das fases da obra");
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [previewGrid, setPreviewGrid] = useState<Record<string, Record<string, number>> | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const parseSchedule = useServerFn(parseScheduleFileServer);

  /** Lê o arquivo no servidor (Base64) — evita Blob/stream no Safari/iOS. */
  async function importar(file: File) {
    if (!etapas || months.length === 0) return;
    setImportando(true);
    try {
      let g: Record<string, Record<string, number>>;
      try {
        const fileBase64 = await fileToBase64(file);
        const res = await parseSchedule({ data: { fileBase64, fileName: file.name, type: "schedule" } });
        g = gridFromRows(res.rows, etapas, months);
      } catch (serverErr) {
        // Plano B: leitura local (desktop)
        try {
          g = await parseCronogramaFile(file, etapas, months);
        } catch {
          throw serverErr;
        }
      }
      setPreviewGrid(g);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler o arquivo");
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function aplicarPreview() {
    if (!previewGrid) return;
    setGrid(previewGrid);
    setDirty(true);
    setPreviewGrid(null);
    toast.success("Cronograma importado — confira e salve");
  }

  /** Sincroniza as linhas do cronograma com as etapas do Orçamento Global. */
  async function puxarDoOrcamento() {
    if (months.length === 0) return;
    setSincronizando(true);
    try {
      const { data, error } = await supabase
        .from("etapas")
        .select("id, ordem, nome, valor_total")
        .eq("obra_id", obraId)
        .order("ordem");
      if (error) throw error;
      const novas = ((data ?? []) as Etapa[]).map((e) => ({ ...e, nome: limparNomeEtapa(e.nome) }));
      if (novas.length === 0) {
        toast.error("Nenhuma etapa encontrada no Orçamento Global desta obra.");
        return;
      }
      qc.setQueryData(["etapas", obraId], novas);
      const base = gerarCronogramaBase(novas, months);
      const g: Record<string, Record<string, number>> = {};
      let novosItens = 0;
      for (const e of novas) {
        const atual = grid[e.id] ?? {};
        const soma = months.reduce((a, m) => a + (atual[m] ?? 0), 0);
        if (soma > 0) {
          g[e.id] = { ...atual };
        } else {
          g[e.id] = base[e.id];
          novosItens++;
        }
      }
      setGrid(g);
      setDirty(true);
      toast.success(
        novosItens > 0
          ? `${novas.length} etapa(s) sincronizada(s) — ${novosItens} com distribuição padrão`
          : `${novas.length} etapa(s) sincronizada(s) do orçamento`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível puxar o orçamento");
    } finally {
      setSincronizando(false);
    }
  }


  const setCell = (etapaId: string, month: string, v: string) => {
    const n = Math.max(0, Math.min(100, Number(v) || 0));
    setGrid((prev) => ({ ...prev, [etapaId]: { ...(prev[etapaId] ?? {}), [month]: n } }));
    setDirty(true);
  };

  const rowTotal = (etapaId: string) =>
    months.reduce((a, m) => a + (grid[etapaId]?.[m] ?? 0), 0);

  // Curva S — desembolso previsto por mês (com fallback 0 em qualquer lacuna)
  const chartData = useMemo(() => {
    if (!etapas || months.length === 0) return [];
    const totalObra = etapas.reduce((a, e) => a + (Number(e.valor_total) || 0), 0) || 1;
    let acumValor = 0;
    return months.map((m) => {
      const mesValor = etapas.reduce(
        (a, e) => a + ((Number(e.valor_total) || 0) * (Number(grid[e.id]?.[m]) || 0)) / 100,
        0,
      );
      acumValor += mesValor;
      const pct = (mesValor / totalObra) * 100;
      const pctAcum = Math.min(100, (acumValor / totalObra) * 100);
      return {
        month: monthLabel(m),
        Mensal: Number((Number.isFinite(pct) && !isNaN(pct) ? pct : 0).toFixed(2)),
        Acumulado: Number((Number.isFinite(pctAcum) && !isNaN(pctAcum) ? pctAcum : 0).toFixed(2)),
        valorMes: Number((Number.isFinite(mesValor) && !isNaN(mesValor) ? mesValor : 0).toFixed(2)),
        valorAcum: Number((Number.isFinite(acumValor) && !isNaN(acumValor) ? acumValor : 0).toFixed(2)),
      };
    });
  }, [etapas, months, grid]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!etapas) return;
      const rows: { etapa_id: string; ano_mes: string; percentual_previsto: number; percentual_realizado: number }[] = [];
      for (const e of etapas) {
        for (const m of months) {
          const v = grid[e.id]?.[m] ?? 0;
          const existing = (mesesDb ?? []).find((x) => x.etapa_id === e.id && x.ano_mes.slice(0, 10) === m);
          rows.push({
            etapa_id: e.id,
            ano_mes: m,
            percentual_previsto: v,
            percentual_realizado: existing ? Number(existing.percentual_realizado) : 0,
          });
        }
      }
      // wipe and reinsert (simpler than per-row upsert on composite key)
      const ids = etapas.map((e) => e.id);
      const { error: delErr } = await supabase.from("cronograma_meses").delete().in("etapa_id", ids);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error } = await supabase.from("cronograma_meses").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Cronograma salvo");
      qc.invalidateQueries({ queryKey: ["cronograma", obraId] });
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loadingEtapas || loadingMeses) return <Skeleton className="h-64" />;

  if (!etapas || etapas.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <LineChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 font-display text-lg font-semibold">Sem etapas para cronogramar</p>
          <p className="mt-1 text-sm text-muted-foreground">Importe primeiro o orçamento na aba anterior.</p>
        </CardContent>
      </Card>
    );
  }

  if (months.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-display text-lg font-semibold">Defina as datas da obra</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha data de início e data de entrega prevista no cadastro da obra para gerar o cronograma mensal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalObra = etapas.reduce((a, e) => a + Number(e.valor_total), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">Cronograma físico-financeiro</h2>
          <p className="text-sm text-muted-foreground">
            {months.length} mês(es){ocultarFinanceiro ? "" : ` • ${brl(totalObra)}`}. Ajuste os percentuais previstos por etapa/mês.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 [&>*]:w-full sm:flex sm:flex-wrap sm:[&>*]:w-auto">

          <VersionHistory
            table="cronograma_versoes"
            obraId={obraId}
            canEdit={isAdmin}
            onSave={(descricao) => {
              const byName: Record<string, Record<string, number>> = {};
              for (const e of etapas) byName[e.nome] = grid[e.id] ?? {};
              const snap: CronogramaSnapshot = { months, grid: byName };
              return saveCronogramaVersao(obraId, descricao, snap, user?.id);
            }}
            onRestore={async (v) => {
              await restoreCronogramaVersao(obraId, v.snapshot as CronogramaSnapshot);
              qc.invalidateQueries({ queryKey: ["cronograma", obraId] });
            }}
            summary={(v) => `${((v.snapshot as CronogramaSnapshot)?.months ?? []).length} mês(es)`}
          />
          {isAdmin && (
            <>
              <Button size="sm" className="col-span-2" disabled={sincronizando} onClick={() => void puxarDoOrcamento()}>
                {sincronizando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                Puxar dados do orçamento
              </Button>
              <Button size="sm" variant="outline" onClick={distributeEven}>
                <Wand2 className="mr-1.5 h-4 w-4" /> Distribuir igual
              </Button>
              <Button size="sm" variant="outline" onClick={gerarBase}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Cronograma base
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void importar(f); }}
              />
              <Button size="sm" variant="outline" disabled={importando} onClick={() => fileRef.current?.click()}>
                {importando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                {importando ? "Lendo arquivo..." : "Importar PDF / Excel"}
              </Button>
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                Salvar
              </Button>
            </>
          )}
        </div>

      </div>

      <ImportScheduleDialog
        open={!!previewGrid}
        onOpenChange={(o) => { if (!o) setPreviewGrid(null); }}
        etapas={etapas}
        months={months}
        grid={previewGrid}
        onConfirm={aplicarPreview}
      />

      <p className="text-xs text-muted-foreground md:hidden">
        ↔️ Deslize para os lados para ver os meses posteriores
      </p>


      {/* Desktop: grade completa */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto touch-pan-x select-none">
            <table className="min-w-full text-xs">

              <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 border-r border-border bg-muted px-3 py-2 text-left shadow-sm">Serviço / Etapa</th>
                  <th className="px-2 py-2 text-right">Valor</th>
                  {months.map((m) => <th key={m} className="px-2 py-2 text-center whitespace-nowrap">{monthLabel(m)}</th>)}
                  <th className="px-2 py-2 text-center">Σ %</th>
                </tr>
              </thead>
              <tbody>
                {etapas.map((e) => {
                  const sum = rowTotal(e.id);
                  const off = Math.abs(sum - 100) > 0.5;
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="sticky left-0 z-20 border-r border-border bg-card px-3 py-1.5 shadow-sm">
                        <span className="line-clamp-2 max-w-[140px] text-xs font-semibold leading-snug sm:max-w-[220px]">{e.nome}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{money(Number(e.valor_total))}</td>
                      {months.map((m) => {
                        const pct = Number(grid[e.id]?.[m]) || 0;
                        const valor = (pct / 100) * (Number(e.valor_total) || 0);
                        return (
                          <td key={m} className="px-1 py-1 align-top">
                            <div className="flex flex-col items-center gap-0.5">
                              {isAdmin ? (
                                <div className="flex items-center gap-0.5">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={pct}
                                    onChange={(ev) => setCell(e.id, m, ev.target.value)}
                                    className="h-7 w-14 px-1 text-center text-xs font-semibold"
                                  />
                                  <span className="text-xs font-semibold text-muted-foreground">%</span>
                                </div>
                              ) : (

                                <span className="text-xs font-semibold">{pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                              )}
                              {!ocultarFinanceiro && (
                                <span className="whitespace-nowrap font-mono text-[10px] text-primary/70">
                                  {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className={`px-2 py-1.5 text-center font-mono ${off ? "text-destructive" : "text-emerald-600"}`}>
                        {sum.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}

                <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                  <td className="sticky left-0 z-20 border-r border-border bg-muted px-3 py-2 shadow-sm">
                    <span className="line-clamp-2 max-w-[140px] text-xs font-semibold leading-snug sm:max-w-[220px]">Investimento mensal</span>
                  </td>
                  <td className="px-2 py-2 text-right font-mono">{money(totalObra)}</td>
                  {chartData.map((d) => (
                    <td key={d.month} className="px-2 py-2 align-top">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="whitespace-nowrap font-mono text-[11px]">{money(d.valorMes)}</span>
                        <span className="whitespace-nowrap font-mono text-[10px] font-normal text-muted-foreground">
                          {d.Mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-mono text-[11px]">100%</td>
                </tr>
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 font-display font-semibold">Gantt — arraste para ajustar</h3>
          <GanttChart
            rows={etapas.map((e) => ({ id: e.id, nome: e.nome }))}
            months={months}
            grid={grid}
            onChange={(g) => { setGrid(g); setDirty(true); }}
            disabled={!isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 font-display font-semibold">Curva S — desembolso previsto</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(v: number, name: string, item: { payload?: { valorMes?: number; valorAcum?: number } }) => {
                    const pct = `${Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
                    if (ocultarFinanceiro) return [pct, name];
                    const valor = name === "Mensal" ? item?.payload?.valorMes : item?.payload?.valorAcum;
                    return [`${pct} • ${brl(Number(valor ?? 0))}`, name];
                  }}
                  labelFormatter={(l) => `Mês ${l}`}
                />
                <Legend />
                <Line type="monotone" dataKey="Mensal" name="Mensal" stroke="hsl(var(--primary) / 0.5)" strokeWidth={2} dot={false} isAnimationActive />
                <Line type="monotone" dataKey="Acumulado" name="Acumulado (Curva S)" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
