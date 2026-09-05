import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildEtapas, type ColumnMapping, type ParsedEtapa, type SheetRead } from "@/lib/budget-parser";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const NONE = "__none__";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: SheetRead | null;
  /** Etapas já lidas (fluxo de PDF): pula o mapeamento e vai direto para a prévia. */
  preset?: ParsedEtapa[] | null;
  importing: boolean;
  onConfirm: (etapas: ParsedEtapa[]) => void;
};

export function ImportBudgetDialog({ open, onOpenChange, sheet, preset, importing, onConfirm }: Props) {
  const isPdf = !!preset;
  const [step, setStep] = useState<1 | 2>(1);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [startRow, setStartRow] = useState(0);

  // Sincroniza com a planilha recém-lida
  const key = sheet ? `${sheet.headers.length}:${sheet.rows.length}:${sheet.headerRow}` : "";
  const [syncedKey, setSyncedKey] = useState("");
  if (sheet && key !== syncedKey) {
    setSyncedKey(key);
    setMapping(sheet.mapping);
    setStartRow(sheet.headerRow + 1);
    setStep(1);
  }

  const sheetEtapas = useMemo(() => {
    if (!sheet || !mapping || step !== 2) return [];
    return buildEtapas(sheet.rows, mapping, startRow);
  }, [sheet, mapping, startRow, step]);

  const etapas = isPdf ? preset! : sheetEtapas;
  const total = etapas.reduce((a, e) => a + e.valor_total, 0);
  const alertas = etapas.filter((e) => e.valor_total <= 0).length;

  if (!isPdf && (!sheet || !mapping)) return null;
  const showPreview = isPdf || step === 2;


  const options = (sheet?.headers ?? []).map((h, i) => ({ value: String(i), label: h }));

  const setCol = (field: keyof ColumnMapping, v: string) =>
    setMapping((m) => (m ? { ...m, [field]: v === NONE ? null : Number(v) } : m));

  const colSelect = (field: keyof ColumnMapping, label: string, optional = true) => (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {!optional && <span className="text-destructive">*</span>}
      </Label>
      <Select value={mapping?.[field] == null ? NONE : String(mapping[field])} onValueChange={(v) => setCol(field, v)}>

        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>Não usar</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {showPreview ? "Revisar orçamento importado" : "Mapear colunas do orçamento"}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? "Confira as etapas e o total geral antes de salvar no sistema."
              : "Confirme qual coluna da planilha corresponde a cada informação."}
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">

            <div className="grid gap-3 sm:grid-cols-2">
              {colSelect("descricao", "Descrição / Etapa", false)}
              {colSelect("codigo", "Código / Item")}
              {colSelect("unidade", "Unidade")}
              {colSelect("quantidade", "Quantidade")}
              {colSelect("valor_unitario", "Valor unitário")}
              {colSelect("valor_total", "Valor total")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Linha em que a tabela começa</Label>
              <Select value={String(startRow)} onValueChange={(v) => setStartRow(Number(v))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(30, sheet?.rows.length ?? 0) }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Linha {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)}>Ver prévia</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total geral do orçamento</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-primary">{brl(total)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Etapas encontradas: <strong>{etapas.length}</strong>
              </p>
            </div>

            {alertas > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{alertas} etapa(s) sem valor. Volte e revise o mapeamento se isso não for esperado.</span>
              </div>
            )}

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {etapas.map((e, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-bold leading-snug">
                    {(e.codigo ?? String(i + 1)).replace(/\.0+$/, "")}. {e.nome}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {e.itens.length > 0 ? `${e.itens.length} serviços` : "sem serviços detalhados"}
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-primary">
                      {brl(e.valor_total)}
                    </span>
                  </div>
                </div>
              ))}
              {etapas.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma etapa encontrada com esse mapeamento.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {isPdf ? (
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                  Cancelar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStep(1)} disabled={importing}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar / corrigir mapeamento
                </Button>
              )}
              <Button onClick={() => onConfirm(etapas)} disabled={importing || etapas.length === 0}>
                {importing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Confirmar e salvar no sistema
              </Button>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
