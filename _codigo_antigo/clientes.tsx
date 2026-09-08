import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadClientLogo, deleteLogo } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogoUpload } from "@/components/LogoUpload";
import { ClientLogo } from "@/components/ClientLogo";
import { Skeleton } from "@/components/ui/skeleton";

type Cliente = {
  id: string;
  nome: string;
  cnpj: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  logo_url: string | null;
};

export const Route = createFileRoute("/_authenticated/clientes")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Empresas — Spechotto" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const c = clientes?.find((x) => x.id === id);
      if (c?.logo_url) await deleteLogo(c.logo_url);
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa removida");
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastro central de empresas com logo personalizada.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Nova empresa
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (clientes ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-display text-lg font-semibold">Nenhuma empresa cadastrada</p>
            <p className="mt-1 text-sm text-muted-foreground">Cadastre a primeira empresa para vincular às obras.</p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Cadastrar empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes!.map((c) => (
            <Card key={c.id} className="transition-shadow hover:shadow-elegant">
              <CardContent className="flex gap-4 p-5">
                <ClientLogo path={c.logo_url} alt={c.nome} className="h-16 w-16 shrink-0 border border-border" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold">{c.nome}</h3>
                  {c.cnpj && <p className="text-xs text-muted-foreground">CNPJ {c.cnpj}</p>}
                  {c.contato_nome && <p className="mt-1 truncate text-sm">{c.contato_nome}</p>}
                  {c.contato_email && <p className="truncate text-xs text-muted-foreground">{c.contato_email}</p>}
                  <div className="mt-3 flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && user && (
        <ClienteDialog
          open
          onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
          cliente={editing}
          userId={user.id}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              As obras vinculadas serão afetadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClienteDialog({
  open, onOpenChange, cliente, userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cliente: Cliente | null;
  userId: string;
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cnpj, setCnpj] = useState(cliente?.cnpj ?? "");
  const [contatoNome, setContatoNome] = useState(cliente?.contato_nome ?? "");
  const [contatoEmail, setContatoEmail] = useState(cliente?.contato_email ?? "");
  const [contatoTelefone, setContatoTelefone] = useState(cliente?.contato_telefone ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoCleared, setLogoCleared] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Nome da empresa é obrigatório");
      let clienteId = cliente?.id;
      let logoPath = logoCleared ? null : cliente?.logo_url ?? null;

      if (!clienteId) {
        const { data, error } = await supabase.from("clientes").insert({
          nome: nome.trim(),
          cnpj: cnpj.trim() || null,
          contato_nome: contatoNome.trim() || null,
          contato_email: contatoEmail.trim() || null,
          contato_telefone: contatoTelefone.trim() || null,
          criado_por: userId,
        }).select("id").single();
        if (error) throw error;
        clienteId = data.id;
      }

      if (logoFile) {
        if (cliente?.logo_url) await deleteLogo(cliente.logo_url);
        logoPath = await uploadClientLogo(logoFile, clienteId!);
      } else if (logoCleared && cliente?.logo_url) {
        await deleteLogo(cliente.logo_url);
      }

      const { error: uerr } = await supabase.from("clientes").update({
        nome: nome.trim(),
        cnpj: cnpj.trim() || null,
        contato_nome: contatoNome.trim() || null,
        contato_email: contatoEmail.trim() || null,
        contato_telefone: contatoTelefone.trim() || null,
        logo_url: logoPath,
      }).eq("id", clienteId!);
      if (uerr) throw uerr;
    },
    onSuccess: () => {
      toast.success(cliente ? "Empresa atualizada" : "Empresa cadastrada");
      qc.invalidateQueries({ queryKey: ["clientes"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>Dados da empresa e logo para exibir nas obras.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome / Razão social *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contatoNome">Contato</Label>
              <Input id="contatoNome" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contatoEmail">E-mail</Label>
              <Input id="contatoEmail" type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contatoTelefone">Telefone</Label>
              <Input id="contatoTelefone" value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} />
            </div>
          </div>
          <LogoUpload
            value={cliente?.logo_url ?? null}
            onFileSelected={(f) => { setLogoFile(f); if (f) setLogoCleared(false); }}
            onClear={() => setLogoCleared(true)}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {cliente ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
