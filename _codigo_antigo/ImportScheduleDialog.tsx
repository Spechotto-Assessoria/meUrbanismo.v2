import { Loader2, AlertTriangle, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EtapaBase, Grid } from "@/lib/cronograma-io";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapas: EtapaBase[];
  months: string[];
  grid: Grid | null;
  applying?: boolean;
  onConfirm: () => void;
};

const monthLabel = (k: string) => {
  const [y, m] = k.split("-");
  return `${m}/${y.slice(2)}`;
};

export function ImportScheduleDialog({ open, onOpenChange, etapas, months, grid, applying, onConfirm }: Props) {
  if (!grid) return null;

  const linhas = etapas.map((e) => {
    const row = grid[e.id] ?? {};
    const soma = months.reduce((a, m) => a + (row[m] ?? 0), 0);
    const meses = months.filter((m) => (row[m] ?? 0) > 0);
    return { e, soma, meses };
  });
  const reconhecidas = linhas.filter((l) => l.soma > 0).length;
  const alertas = linhas.filter((l) => l.soma > 0 && Math.abs(l.soma - 100) > 0.5).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévia do cronograma importado</DialogTitle>
          <DialogDescription>
            {reconhecidas} de {etapas.length} etapa(s) reconhecida(s). Confira antes de aplicar na grade.
          </DialogDescription>
        </DialogHeader>

        {alertas > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{alertas} etapa(s) não somam 100% — você poderá ajustar na grade antes de salvar.</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Etapa</th>
                <th className="px-3 py-2 text-left">Meses com previsão</th>
                <th className="px-3 py-2 text-right">Σ %</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ e, soma, meses }) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="max-w-[220px] px-3 py-2">
                    <span className="line-clamp-2 font-medium leading-snug">{e.nome}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {meses.length ? `${monthLabel(meses[0])} → ${monthLabel(meses[meses.length - 1])} (${meses.length})` : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${soma === 0 ? "text-muted-foreground" : Math.abs(soma - 100) > 0.5 ? "text-destructive" : "text-emerald-600"}`}>
                    {soma.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="rounded-xl" disabled={applying || reconhecidas === 0} onClick={onConfirm}>
            {applying ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Aplicar no cronograma
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
