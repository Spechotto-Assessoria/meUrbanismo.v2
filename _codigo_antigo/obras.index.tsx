import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2, Loader2, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { uploadClientLogo, deleteLogo } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogoUpload } from "@/components/LogoUpload";
import { ClientLogo } from "@/components/ClientLogo";
import { PERFIS, perfilOf } from "@/lib/perfis";
import { formatDecimal, maskDecimal, unmask } from "@/lib/masks";

import type { Database } from "@/integrations/supabase/types";

type ObraStatus = Database["public"]["Enums"]["obra_status"];

type Obra = {
  id: string;
  nome: string;
  descricao: string | null;
  cliente_id: string;
  status: ObraStatus;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  area_m2: number | null;
  data_inicio: string | null;
  data_fim_prevista: string | null;
  valor_global: number;
  qtd_lotes: number | null;
  metragem_padrao_lote: number | null;
  logo_cliente_url: string | null;
  cliente?: { nome: string; logo_url: string | null } | null;
};

type ClienteLite = { id: string; nome: string; logo_url: string | null };

const statusOptions: { value: ObraStatus; label: string; color: string }[] = [
  { value: "planejamento", label: "Planejamento", color: "bg-slate-500" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-primary" },
  { value: "pausada", label: "Pausada", color: "bg-amber-500" },
  { value: "concluida", label: "Concluída", color: "bg-emerald-500" },
  { value: "arquivada", label: "Arquivada", color: "bg-muted-foreground" },
];

export const Route = createFileRoute("/_authenticated/obras/")({
  head: () => ({ meta: [{ title: "Obras — Spechotto" }] }),
  component: ObrasPage,
});

function ObrasPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: obras, isLoading } = useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*, cliente:clientes(nome, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Obra[];
    },
  });

  const { data: perfisPorObra } = useQuery({
    queryKey: ["meus-perfis-obras", user?.email],
    enabled: !!user?.email && !isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("convites").select("obra_id, perfil, ativo").ilike("email", user!.email!);
      const map: Record<string, boolean> = {};
      for (const c of data ?? []) {
        if (!c.ativo) continue;
        map[c.obra_id] = !PERFIS[perfilOf(c.perfil)].ocultarFinanceiro;
      }
      return map;
    },
  });

  const podeVerValor = (obraId: string) => isAdmin || perfisPorObra?.[obraId] === true;

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const o = obras?.find((x) => x.id === id);
      if (o?.logo_cliente_url) await deleteLogo(o.logo_cliente_url);
      const { error } = await supabase.from("obras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obra removida");
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obras-dashboard"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="box-border w-full max-w-full space-y-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold">Obras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Gerencie todas as obras das suas empresas." : "Obras em que você está envolvido."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova obra
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (obras ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-display text-lg font-semibold">Nenhuma obra cadastrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? "Cadastre a primeira obra para começar." : "Aguarde o administrador cadastrar uma obra."}
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Nova obra
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {obras!.map((o) => {
            const status = statusOptions.find((s) => s.value === o.status);
            const logoPath = o.logo_cliente_url ?? o.cliente?.logo_url ?? null;
            return (
              <Card key={o.id} className="group box-border flex w-full max-w-full flex-col overflow-hidden transition-shadow hover:shadow-elegant">
                <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <ClientLogo path={logoPath} alt={o.cliente?.nome ?? ""} className="h-14 w-14 shrink-0 border border-border" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-base font-semibold">{o.nome}</h3>
                        {o.cliente?.nome && <p className="truncate text-xs text-muted-foreground">{o.cliente.nome}</p>}
                      </div>
                    </div>
                    <Badge className={`${status?.color ?? "bg-muted"} shrink-0 text-white`}>{status?.label ?? o.status}</Badge>
                  </div>

                  {(o.cidade || o.estado) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {[o.cidade, o.estado].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  {o.data_fim_prevista && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" /> Entrega: {new Date(o.data_fim_prevista + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {(o.qtd_lotes || o.metragem_padrao_lote) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        o.qtd_lotes ? `${Number(o.qtd_lotes).toLocaleString("pt-BR")} lotes` : null,
                        o.metragem_padrao_lote
                          ? `Lote padrão: ${Number(o.metragem_padrao_lote).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  )}
                  {podeVerValor(o.id) && Number(o.valor_global) > 0 && (
                    <p className="font-display text-lg font-bold text-primary">
                      {Number(o.valor_global).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/obras/$obraId" params={{ obraId: o.id }}>Abrir</Link>
                    </Button>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(o)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(o.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && user && (
        <ObraDialog
          open
          onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
          obra={editing}
          userId={user.id}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover obra?</AlertDialogTitle>
            <AlertDialogDescription>Todos os dados associados serão excluídos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ObraDialog({
  open, onOpenChange, obra, userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  obra: Obra | null;
  userId: string;
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(obra?.nome ?? "");
  const [descricao, setDescricao] = useState(obra?.descricao ?? "");
  const [clienteId, setClienteId] = useState(obra?.cliente_id ?? "");
  const [status, setStatus] = useState<ObraStatus>(obra?.status ?? "planejamento");
  const [cidade, setCidade] = useState(obra?.cidade ?? "");
  const [estado, setEstado] = useState(obra?.estado ?? "");
  const [endereco, setEndereco] = useState(obra?.endereco ?? "");
  const [areaM2, setAreaM2] = useState(formatDecimal(obra?.area_m2 ?? 0));
  const [dataInicio, setDataInicio] = useState(obra?.data_inicio ?? "");
  const [dataFim, setDataFim] = useState(obra?.data_fim_prevista ?? "");
  const [valorGlobal, setValorGlobal] = useState(formatDecimal(obra?.valor_global ?? 0));
  const [qtdLotes, setQtdLotes] = useState(obra?.qtd_lotes != null ? String(obra.qtd_lotes) : "");
  const [metragemLote, setMetragemLote] = useState(
    obra?.metragem_padrao_lote != null ? String(obra.metragem_padrao_lote) : "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoCleared, setLogoCleared] = useState(false);

  const { data: clientes } = useQuery({
    queryKey: ["clientes-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome, logo_url").order("nome");
      if (error) throw error;
      return (data ?? []) as ClienteLite[];
    },
  });

  const clienteSel = useMemo(() => clientes?.find((c) => c.id === clienteId), [clientes, clienteId]);

  const save = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Nome da obra é obrigatório");
      if (!clienteId) throw new Error("Selecione uma empresa");

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        cliente_id: clienteId,
        status,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        endereco: endereco.trim() || null,
        area_m2: areaM2 ? unmask(areaM2) : null,
        data_inicio: dataInicio || null,
        data_fim_prevista: dataFim || null,
        valor_global: unmask(valorGlobal),
        qtd_lotes: qtdLotes.trim() ? Math.trunc(Number(qtdLotes)) : null,
        metragem_padrao_lote: metragemLote.trim() ? Number(metragemLote) : null,
      };

      let obraId = obra?.id;
      let logoPath = logoCleared ? null : obra?.logo_cliente_url ?? null;

      if (!obraId) {
        const { data, error } = await supabase.from("obras").insert({
          ...payload,
          criada_por: userId,
        }).select("id").single();
        if (error) throw error;
        obraId = data.id;
      }

      if (logoFile) {
        if (obra?.logo_cliente_url) await deleteLogo(obra.logo_cliente_url);
        logoPath = await uploadClientLogo(logoFile, `obra-${obraId}`);
      } else if (logoCleared && obra?.logo_cliente_url) {
        await deleteLogo(obra.logo_cliente_url);
      }

      const { error: uerr } = await supabase.from("obras").update({
        ...payload,
        logo_cliente_url: logoPath,
      }).eq("id", obraId!);
      if (uerr) throw uerr;
    },
    onSuccess: () => {
      toast.success(obra ? "Obra atualizada" : "Obra cadastrada");
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obras-dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="box-border max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overflow-x-hidden px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
          <DialogDescription>Informações principais da obra e da empresa.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome da obra *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(clientes ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                  {(clientes ?? []).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Cadastre uma empresa primeiro.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ObraStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input id="area" inputMode="decimal" placeholder="0,00" value={areaM2} onChange={(e) => setAreaM2(maskDecimal(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor global (R$)</Label>
              <Input id="valor" inputMode="decimal" placeholder="0,00" value={valorGlobal} onChange={(e) => setValorGlobal(maskDecimal(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtd-lotes">Quantidade de Lotes (opcional)</Label>
              <Input
                id="qtd-lotes"
                type="number"
                min={0}
                step={1}
                placeholder="Ex: 186"
                value={qtdLotes}
                onChange={(e) => setQtdLotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lote-m2">Metragem Padrão do Lote (m²) (opcional)</Label>
              <Input
                id="lote-m2"
                type="number"
                min={0}
                step="0.01"
                placeholder="Ex: 300,00"
                value={metragemLote}
                onChange={(e) => setMetragemLote(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ini">Data de início</Label>
              <Input id="ini" type="date" value={dataInicio ?? ""} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Data de entrega prevista</Label>
              <Input id="fim" type="date" value={dataFim ?? ""} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <LogoUpload
              label="Logo da empresa para esta obra"
              value={obra?.logo_cliente_url ?? clienteSel?.logo_url ?? null}
              onFileSelected={(f) => { setLogoFile(f); if (f) setLogoCleared(false); }}
              onClear={() => setLogoCleared(true)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Se em branco, usaremos a logo cadastrada na empresa.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {obra ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
