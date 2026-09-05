import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { brlCents, pctBR, type ViabilidadeResult } from "@/lib/viabilidade";

type Premissas = {
  reajuste_receita_pct_am: number;
  incc_pct_am: number;
  taxa_minima_aa: number;
  prazo_meses: number;
  prazo_vendas_meses: number;
  entrada_pct: number;
  parcelas_meses: number;
};

const campos: { key: keyof Premissas; label: string; suffix: string; step: number }[] = [
  { key: "reajuste_receita_pct_am", label: "Projeção do IPCA", suffix: "% a.m.", step: 0.01 },
  { key: "incc_pct_am", label: "Projeção do INCC", suffix: "% a.m.", step: 0.01 },
  { key: "taxa_minima_aa", label: "TMA — taxa mínima de atratividade", suffix: "% a.a.", step: 0.01 },
  { key: "prazo_meses", label: "Prazo de obra", suffix: "meses", step: 1 },
  { key: "prazo_vendas_meses", label: "Prazo de vendas", suffix: "meses", step: 1 },
  { key: "entrada_pct", label: "Entrada na venda", suffix: "% do lote", step: 1 },
  { key: "parcelas_meses", label: "Parcelamento do saldo", suffix: "meses", step: 1 },
];

/** Painel transparente de premissas com recálculo instantâneo (somente admin edita). */
export function AuditoriaPremissas({
  premissas,
  resultado,
  canEdit,
  onChange,
}: {
  premissas: Premissas;
  resultado: ViabilidadeResult;
  canEdit: boolean;
  onChange: (key: keyof Premissas, value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const r = resultado;

  const kpis = [
    { label: "VPL", value: brlCents(r.vpl) },
    { label: "TIR (a.a.)", value: r.tirAnual != null && r.tirConfiavel ? pctBR(r.tirAnual) : "—" },
    { label: "ROI", value: pctBR(r.roi) },
    { label: "Lucro estimado", value: brlCents(r.lucro) },
    { label: "Payback", value: r.paybackMeses != null ? `${r.paybackMeses} meses` : "—" },
    { label: "TMA mensal equivalente", value: pctBR(r.taxaMensalTMA, 4) },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0">
          <ClipboardCheck className="mr-1.5 h-4 w-4" /> Auditoria de premissas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auditoria de premissas e cálculos</DialogTitle>
          <DialogDescription>
            Todas as variáveis do modelo financeiro. Ajuste qualquer premissa e veja o recálculo imediato.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campos.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <Label className="text-xs">
                {c.label} <span className="text-muted-foreground">({c.suffix})</span>
              </Label>
              <Input
                type="number"
                step={c.step}
                min={0}
                disabled={!canEdit}
                value={premissas[c.key]}
                onChange={(e) => onChange(c.key, Number(e.target.value) || 0)}
                className="text-right font-mono tabular-nums"
              />
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className="mt-0.5 font-display text-lg font-bold tabular-nums">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h4 className="mb-2 font-display text-sm font-semibold">
            Curva J de desembolso e cronograma de recebimentos
          </h4>
          <div className="max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold">Mês</th>
                  <th className="px-3 py-2 text-right font-semibold">Recebimentos</th>
                  <th className="px-3 py-2 text-right font-semibold">Desembolsos</th>
                  <th className="px-3 py-2 text-right font-semibold">Líquido</th>
                  <th className="px-3 py-2 text-right font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {r.fluxo.map((f) => (
                  <tr key={f.mes} className="border-t border-border/60">
                    <td className="px-3 py-1.5">M{f.mes}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{brlCents(f.receita)}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{brlCents(f.despesa)}</td>
                    <td
                      className={`px-3 py-1.5 text-right font-mono tabular-nums ${f.liquido >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      {brlCents(f.liquido)}
                    </td>
                    <td
                      className={`px-3 py-1.5 text-right font-mono tabular-nums ${f.acumulado >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      {brlCents(f.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
