import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Upload, Loader2, Trash2, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { parseBudgetFile, readSheetRows, type ParsedEtapa, type SheetRead } from "@/lib/budget-parser";
import { fileToBase64 } from "@/lib/file-bytes";
import { parseBudgetPdfServer } from "@/lib/budget-pdf.functions";
import { useServerFn } from "@tanstack/react-start";
import { ImportBudgetDialog } from "@/components/orcamento/ImportBudgetDialog";


import { downloadBudgetTemplate } from "@/lib/budget-template";
import { VersionHistory } from "@/components/VersionHistory";
import {
  restoreOrcamentoVersao,
  saveOrcamentoVersao,
  type OrcamentoSnapshot,
} from "@/lib/versions";
import { useObraAccess } from "@/lib/obra-access";


export const Route = createFileRoute("/_authenticated/obras/$obraId/orcamento")({
  component: OrcamentoPage,
});

const brlRaw = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function OrcamentoPage() {
  const { obraId } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const { ocultarFinanceiro } = useObraAccess();
  const brl = (n: number) => (ocultarFinanceiro ? "—" : brlRaw(n));

  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmReplace, setConfirmReplace] = useState<ParsedEtapa[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [ocr, setOcr] = useState<{ pct: number } | null>(null);
  const [sheet, setSheet] = useState<SheetRead | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [pdfEtapas, setPdfEtapas] = useState<ParsedEtapa[] | null>(null);
  const parsePdfNoServidor = useServerFn(parseBudgetPdfServer);




  const { data, isLoading } = useQuery({
    queryKey: ["etapas-full", obraId],
    queryFn: async () => {
      const { data: etapas, error } = await supabase
        .from("etapas")
        .select("id, ordem, codigo, nome, valor_total, itens_orcamento(id, ordem, codigo, descricao, unidade, quantidade, valor_unitario, valor_total)")
        .eq("obra_id", obraId)
        .order("ordem");
      if (error) throw error;
      return (etapas ?? []).map((e) => ({
        ...e,
        itens_orcamento: [...(e.itens_orcamento ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
      }));
    },
  });

  const total = useMemo(() => (data ?? []).reduce((a, e) => a + Number(e.valor_total), 0), [data]);

  /** Perfis sem acesso financeiro veem apenas a participação percentual no total. */
  const valorCell = (n: number) =>
    ocultarFinanceiro
      ? total > 0
        ? `${((n / total) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
        : "—"
      : brlRaw(n);


  const importMut = useMutation({
    mutationFn: async (etapas: ParsedEtapa[]) => {
      // wipe existing
      await supabase.from("etapas").delete().eq("obra_id", obraId);
      for (let i = 0; i < etapas.length; i++) {
        const e = etapas[i];
        const { data: ins, error } = await supabase
          .from("etapas")
          .insert({ obra_id: obraId, ordem: i, codigo: e.codigo, nome: e.nome, valor_total: e.valor_total })
          .select("id")
          .single();
        if (error) throw error;
        if (e.itens.length > 0) {
          const payload = e.itens.map((it, j) => ({
            etapa_id: ins.id,
            ordem: j,
            codigo: it.codigo,
            descricao: it.descricao,
            unidade: it.unidade,
            quantidade: it.quantidade,
            valor_unitario: it.valor_unitario,
            valor_total: it.valor_total,
          }));
          const { error: e2 } = await supabase.from("itens_orcamento").insert(payload);
          if (e2) throw e2;
        }
      }
      // sync obra.valor_global
      const soma = etapas.reduce((a, e) => a + e.valor_total, 0);
      await supabase.from("obras").update({ valor_global: soma }).eq("id", obraId);
    },
    onSuccess: () => {
      toast.success("Orçamento importado");
      qc.invalidateQueries({ queryKey: ["etapas-full", obraId] });
      qc.invalidateQueries({ queryKey: ["etapas", obraId] });
      qc.invalidateQueries({ queryKey: ["obra", obraId] });
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obras-dashboard"] });
      setConfirmReplace(null);
      setMapOpen(false);
      setSheet(null);
      setPdfEtapas(null);


    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("etapas").delete().eq("obra_id", obraId);
      if (error) throw error;
      await supabase.from("obras").update({ valor_global: 0 }).eq("id", obraId);
    },
    onSuccess: () => {
      toast.success("Orçamento excluído — importe um novo arquivo quando quiser.");
      qc.invalidateQueries({ queryKey: ["etapas-full", obraId] });
      qc.invalidateQueries({ queryKey: ["etapas", obraId] });
      qc.invalidateQueries({ queryKey: ["obra", obraId] });
      qc.invalidateQueries({ queryKey: ["obras"] });
      setConfirmClear(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const [lendoPdf, setLendoPdf] = useState(false);

  async function handleFile(f: File) {
    const isPdf = f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf";
    try {
      if (!isPdf) {
        const read = await readSheetRows(f);
        setPdfEtapas(null);
        setSheet(read);
        setMapOpen(true);
        return;
      }

      // 1) Servidor (Base64) — evita pdf.js/worker no Safari/iOS.
      let etapas: ParsedEtapa[] = [];
      setLendoPdf(true);
      try {
        const fileBase64 = await fileToBase64(f);
        const res = await parsePdfNoServidor({ data: { fileBase64, fileName: f.name } });
        etapas = (res?.etapas ?? []) as ParsedEtapa[];
      } catch (serverErr) {
        console.warn("Leitura do PDF no servidor falhou, tentando localmente:", serverErr);
      } finally {
        setLendoPdf(false);
      }

      // 2) Fallback local (inclui OCR para PDFs digitalizados).
      if (etapas.length === 0) {
        etapas = await parseBudgetFile(f, {
          onOcrStart: () => {
            setOcr({ pct: 0 });
            toast.info("PDF digitalizado detectado — lendo por OCR, isso pode levar alguns minutos.");
          },
          onOcrProgress: ({ pct }) => setOcr({ pct }),
        });
      }
      setOcr(null);
      if (etapas.length === 0) throw new Error("Nenhuma etapa encontrada no arquivo.");
      setSheet(null);
      setPdfEtapas(etapas);
      setMapOpen(true);
    } catch (err) {
      setOcr(null);
      setLendoPdf(false);
      toast.error(err instanceof Error ? err.message : "Erro ao ler o arquivo", { duration: 12000 });
    }
  }




  const toggle = (id: string) => setExpanded((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">Orçamento global</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Importe uma planilha .xlsx/.csv ou PDF com etapas e serviços."
              : "Participação de cada etapa no orçamento global da obra."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 [&>*]:h-11 [&>*]:rounded-xl">


          {isAdmin && (
            <VersionHistory
              table="orcamento_versoes"
              obraId={obraId}
              canEdit={isAdmin}
              onSave={(descricao) => saveOrcamentoVersao(obraId, descricao, user?.id)}
              onRestore={async (v) => {
                await restoreOrcamentoVersao(obraId, v.snapshot as OrcamentoSnapshot);
                qc.invalidateQueries({ queryKey: ["etapas-full", obraId] });
                qc.invalidateQueries({ queryKey: ["etapas", obraId] });
                qc.invalidateQueries({ queryKey: ["obra", obraId] });
              }}
              summary={(v) => (v.valor_total != null ? brl(Number(v.valor_total)) : "")}
            />
          )}

          {isAdmin && (
            <Button size="sm" variant="outline" onClick={downloadBudgetTemplate}>
              <Download className="mr-1.5 h-4 w-4" /> Modelo .xlsx
            </Button>
          )}

          {isAdmin && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={importMut.isPending || lendoPdf}>
                {importMut.isPending || lendoPdf ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                {lendoPdf ? "Lendo PDF..." : "Importar planilha"}

              </Button>
              {(data ?? []).length > 0 && (
                <Button size="sm" variant="destructive" onClick={() => setConfirmClear(true)}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Excluir orçamento atual
                </Button>
              )}

            </>
          )}
        </div>
      </div>

      {ocr && (
        <Card className="border-primary/40">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Reconhecendo texto do PDF digitalizado (OCR)… {ocr.pct}%</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ocr.pct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-display text-lg font-semibold">Sem orçamento importado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie uma planilha .xlsx com colunas de descrição, unidade, quantidade e valores.
            </p>
            {isAdmin && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={downloadBudgetTemplate}>
                  <Download className="mr-1.5 h-4 w-4" /> Baixar modelo
                </Button>
                <Button onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-4 w-4" /> Importar planilha
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: cards empilhados */}
          <div className="space-y-3 sm:hidden">
            {(data ?? []).map((e) => {
              const isOpen = expanded.has(e.id);
              return (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    <button
                      className="flex w-full items-start gap-2 text-left"
                      onClick={() => toggle(e.id)}
                      disabled={e.itens_orcamento.length === 0}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                          {(e.codigo ?? String(e.ordem + 1)).replace(/\.0+$/, "")}
                        </p>
                        <p className="text-sm font-bold leading-snug">{e.nome}</p>
                        <p className="mt-1.5 font-mono text-base font-bold tabular-nums text-primary">
                          {valorCell(Number(e.valor_total))}
                        </p>


                      </div>
                      {e.itens_orcamento.length > 0 && (
                        <span className="mt-1 shrink-0 text-muted-foreground">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </span>
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        {e.itens_orcamento.map((it) => (
                          <div key={it.id} className="rounded-lg bg-muted/40 p-2.5">
                            <p className="text-xs font-medium leading-tight">{it.descricao}</p>
                            <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                              {Number(it.quantidade).toLocaleString("pt-BR")} {it.unidade ?? ""}
                              {ocultarFinanceiro ? "" : ` × ${brlRaw(Number(it.valor_unitario))}`}
                            </p>
                            {!ocultarFinanceiro && (
                              <p className="mt-0.5 text-right font-mono text-sm font-semibold tabular-nums">
                                {brlRaw(Number(it.valor_total))}
                              </p>
                            )}

                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-baseline justify-between gap-2 p-4">
                <span className="text-sm font-semibold">Total geral</span>
                <span className="font-mono text-lg font-bold tabular-nums text-primary">
                  {ocultarFinanceiro ? "100,0%" : brlRaw(total)}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Desktop / tablet: tabela */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-2 py-2 text-left">Código</th>
                      <th className="px-2 py-2 text-left">Descrição</th>
                      <th className="px-2 py-2 text-left">Unid</th>
                      <th className="px-2 py-2 text-right">Qtd</th>
                      {!ocultarFinanceiro && <th className="px-2 py-2 text-right">V. unitário</th>}
                      <th className="px-2 py-2 text-right">{ocultarFinanceiro ? "% do total" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data ?? []).map((e) => {
                      const isOpen = expanded.has(e.id);
                      return (
                        <Fragment key={e.id}>
                          <tr className="border-t border-border bg-primary/5 font-semibold">
                            <td className="px-3 py-2">
                              {e.itens_orcamento.length > 0 && (
                                <button onClick={() => toggle(e.id)} className="text-muted-foreground hover:text-foreground">
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
                            </td>
                            <td className="px-2 py-2">{e.codigo ?? "—"}</td>
                            <td className="px-2 py-2">{e.nome}</td>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                            {!ocultarFinanceiro && <td className="px-2 py-2"></td>}
                            <td className="px-2 py-2 text-right font-mono">{valorCell(Number(e.valor_total))}</td>
                          </tr>
                          {isOpen && e.itens_orcamento.map((it) => (
                            <tr key={it.id} className="border-t border-border text-muted-foreground">
                              <td></td>
                              <td className="px-2 py-1.5 font-mono text-xs">{it.codigo ?? ""}</td>
                              <td className="px-2 py-1.5">{it.descricao}</td>
                              <td className="px-2 py-1.5">{it.unidade ?? ""}</td>
                              <td className="px-2 py-1.5 text-right font-mono">{Number(it.quantidade).toLocaleString("pt-BR")}</td>
                              {!ocultarFinanceiro && (
                                <td className="px-2 py-1.5 text-right font-mono">{brlRaw(Number(it.valor_unitario))}</td>
                              )}
                              <td className="px-2 py-1.5 text-right font-mono">{valorCell(Number(it.valor_total))}</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    <tr className="border-t-2 border-border bg-muted/30 font-bold">
                      <td></td>
                      <td colSpan={ocultarFinanceiro ? 4 : 5} className="px-2 py-3">Total geral</td>
                      <td className="px-2 py-3 text-right font-mono text-primary">
                        {ocultarFinanceiro ? "100,0%" : brlRaw(total)}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>

      )}

      <AlertDialog open={!!confirmReplace} onOpenChange={(o) => !o && setConfirmReplace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir orçamento atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apagará as etapas, serviços e cronograma existentes e importará {confirmReplace?.length} nova(s) etapa(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReplace && importMut.mutate(confirmReplace)}>
              {importMut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as etapas, serviços e o cronograma vinculado serão removidos. Depois você poderá importar um novo
              arquivo .xlsx ou PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => clearMut.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {clearMut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Excluir orçamento
            </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportBudgetDialog
        open={mapOpen}
        onOpenChange={(o) => {
          setMapOpen(o);
          if (!o) {
            setSheet(null);
            setPdfEtapas(null);
          }
        }}
        sheet={sheet}
        preset={pdfEtapas}
        importing={importMut.isPending}
        onConfirm={(etapas) => importMut.mutate(etapas)}
      />


    </div>
  );
}
