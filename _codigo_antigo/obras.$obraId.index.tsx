import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useObraAccess } from "@/lib/obra-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/obras/$obraId/")({
  component: AndamentoObra,
});

type EtapaProgresso = {
  id: string;
  nome: string;
  previsto: number;
  realizado: number;
  visivel: boolean;
  valorTotal: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Barra infográfica: círculo com %, trilho arredondado, preenchimento em degradê e pino no fim. */
function ProgressoBar({ valor, previsto }: { valor: number; previsto: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(clamp(valor)), 60);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-primary/15">
        <span className="font-display text-sm font-bold tabular-nums">{Math.round(valor)}%</span>
      </div>
      <div className="relative h-5 min-w-0 flex-1 rounded-full bg-muted">
        {/* referência de previsto */}
        <div
          className="absolute top-1/2 h-7 w-px -translate-y-1/2 bg-foreground/25"
          style={{ left: `${clamp(previsto)}%` }}
          title={`Previsto: ${previsto.toFixed(0)}%`}
        />
        <div
          className="h-5 rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%` }}
        />
        {/* pino no fim da barra */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000 ease-out"
          style={{ left: `${w}%` }}
        >
          <span className="block h-4 w-4 rounded-full border-[3px] border-background bg-accent shadow" />
        </div>
      </div>
    </div>
  );
}

function LinhaEtapa({
  etapa,
  canEdit,
  onSave,
  onToggle,
  saving,
}: {
  etapa: EtapaProgresso;
  canEdit: boolean;
  onSave: (id: string, valor: number) => void;
  onToggle: (id: string, visivel: boolean) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(etapa.realizado)));
  useEffect(() => setDraft(String(Math.round(etapa.realizado))), [etapa.realizado]);
  const dirty = Number(draft) !== Math.round(etapa.realizado);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="min-w-0 truncate font-display text-sm font-semibold">{etapa.nome}</p>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dirty) onSave(etapa.id, clamp(Number(draft) || 0));
              }}
              className="h-8 w-20 text-right tabular-nums"
              aria-label={`Percentual de ${etapa.nome}`}
            />
            <Button
              size="icon"
              variant={dirty ? "default" : "outline"}
              className="h-8 w-8"
              disabled={!dirty || saving}
              onClick={() => onSave(etapa.id, clamp(Number(draft) || 0))}
              aria-label="Salvar percentual"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={cn("h-8 w-8", !etapa.visivel && "text-muted-foreground")}
              onClick={() => onToggle(etapa.id, !etapa.visivel)}
              title={
                etapa.visivel
                  ? "Visível para clientes/corretores"
                  : "Oculto para clientes/corretores"
              }
              aria-label="Alternar visibilidade para clientes e corretores"
            >
              {etapa.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3">
        <ProgressoBar valor={etapa.realizado} previsto={etapa.previsto} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Previsto no cronograma: {etapa.previsto.toFixed(0)}%
        {canEdit && !etapa.visivel && " · oculto para clientes e corretores"}
      </p>
    </div>
  );
}

function AndamentoObra() {
  const { obraId } = Route.useParams();
  const { isAdmin, canEdit } = useObraAccess();
  const qc = useQueryClient();

  const { data: progresso, isLoading: loadingProg } = useQuery({
    queryKey: ["andamento-progresso", obraId],
    queryFn: async (): Promise<EtapaProgresso[]> => {
      const { data: etapas, error } = await supabase
        .from("etapas")
        .select(
          "id, nome, ordem, valor_total, avanco_manual, visivel_convidados, cronograma_meses(percentual_previsto, percentual_realizado)",
        )
        .eq("obra_id", obraId)
        .order("ordem");
      if (error) throw error;
      return (etapas ?? []).map((e) => {
        const meses = (e.cronograma_meses ?? []) as {
          percentual_previsto: number;
          percentual_realizado: number;
        }[];
        const sum = (k: "percentual_previsto" | "percentual_realizado") =>
          clamp(meses.reduce((a, m) => a + Number(m[k] ?? 0), 0));
        return {
          id: e.id,
          nome: e.nome,
          previsto: sum("percentual_previsto"),
          realizado: e.avanco_manual != null ? clamp(Number(e.avanco_manual)) : sum("percentual_realizado"),
          visivel: e.visivel_convidados !== false,
          valorTotal: Number(e.valor_total ?? 0),
        };
      });
    },
  });

  const { data: atualizacoes, isLoading: loadingAtu } = useQuery({
    queryKey: ["andamento-updates", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_obra")
        .select("id, data, titulo, descricao")
        .eq("obra_id", obraId)
        .order("data", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMut = useMutation({
    mutationFn: async (p: { id: string; avanco_manual?: number; visivel_convidados?: boolean }) => {
      const { id, ...patch } = p;
      const { error } = await supabase.from("etapas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["andamento-progresso", obraId] });
      toast.success("Andamento atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const todas = progresso ?? [];
  // Administradores veem todas as etapas; demais perfis veem apenas as visíveis.
  const etapas = isAdmin ? todas : todas.filter((e) => e.visivel);

  // Progresso geral ponderado pelos valores totais das etapas visíveis.
  const visiveis = etapas;
  const valorTotalVisivel = visiveis.reduce((acc, e) => acc + (e.valorTotal || 0), 0);
  const progressoRealizadoVisivel = visiveis.reduce(
    (acc, e) => acc + ((e.realizado / 100) * (e.valorTotal || 0)),
    0,
  );
  const geralRealizado =
    valorTotalVisivel > 0
      ? (progressoRealizadoVisivel / valorTotalVisivel) * 100
      : visiveis.length
        ? visiveis.reduce((a, e) => a + e.realizado, 0) / visiveis.length
        : 0;
  const geralPrevisto =
    valorTotalVisivel > 0
      ? visiveis.reduce((a, e) => a + ((e.previsto / 100) * (e.valorTotal || 0)), 0) / valorTotalVisivel * 100
      : visiveis.length
        ? visiveis.reduce((a, e) => a + e.previsto, 0) / visiveis.length
        : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Andamento da Obra</h2>
        <p className="text-sm text-muted-foreground">
          Evolução de cada serviço da obra, atualizada pela Spechotto.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Evolução física
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProg ? (
            <Skeleton className="h-40" />
          ) : etapas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço disponível para exibição no momento.
            </p>
          ) : (
            <>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Progresso geral
                </p>
                <div className="mt-3">
                  <ProgressoBar valor={geralRealizado} previsto={geralPrevisto} />
                </div>
              </div>

              <div className="space-y-3">
                {etapas.map((e) => (
                  <LinhaEtapa
                    key={e.id}
                    etapa={e}
                    canEdit={canEdit}
                    saving={updateMut.isPending}
                    onSave={(id, valor) => updateMut.mutate({ id, avanco_manual: valor })}
                    onToggle={(id, visivel) => updateMut.mutate({ id, visivel_convidados: visivel })}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold">Atualizações periódicas</h3>
        {loadingAtu ? (
          <Skeleton className="h-32" />
        ) : (atualizacoes ?? []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
              <p className="font-display font-semibold">Nenhuma atualização publicada</p>
              <p className="text-sm text-muted-foreground">
                As atualizações da obra registradas no diário aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          (atualizacoes ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-1.5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </Badge>
                  <p className="font-medium">{a.titulo}</p>
                </div>
                {a.descricao && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{a.descricao}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
