import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { brandPanelUrl } from "@/lib/brand-images";
import { developedBy } from "@/lib/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): { convite?: string; email?: string; obra?: string } => ({
    convite: typeof search.convite === "string" ? search.convite : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    obra: typeof search.obra === "string" ? search.obra : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — MEU URBANISMO" },
      { name: "description", content: "Acesse a plataforma MEU URBANISMO, por Spechotto Assessoria & Construção." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(128);
const nameSchema = z.string().trim().min(2, "Informe seu nome").max(120);

function AuthPage() {
  const navigate = useNavigate();
  const { convite, email: conviteEmail, obra: conviteObra } = Route.useSearch();
  const isConvite = !!convite;
  const [loading, setLoading] = useState<"none" | "email" | "google" | "reset">("none");

  const [loginEmail, setLoginEmail] = useState(conviteEmail ?? "");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState(conviteEmail ?? "");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const destino = () =>
    conviteObra
      ? navigate({ to: "/obras/$obraId", params: { obraId: conviteObra }, replace: true })
      : navigate({ to: "/dashboard", replace: true });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        destino();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const email = emailSchema.parse(loginEmail);
      const password = passwordSchema.parse(loginPassword);
      setLoading("email");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo!");
      destino();
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err instanceof Error ? err.message : "Erro ao entrar";
      toast.error(msg);
    } finally {
      setLoading("none");
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const nome = nameSchema.parse(signupName);
      const email = emailSchema.parse(signupEmail);
      const password = passwordSchema.parse(signupPassword);
      const telefone = signupPhone.trim();
      setLoading("email");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nome, telefone },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (data.session) {
        await supabase
          .from("profiles")
          .update({ nome, telefone: telefone || null })
          .eq("id", data.session.user.id);
        toast.success("Cadastro concluído!");
        destino();
        return;
      }
      toast.success("Cadastro criado! Verifique seu e-mail para confirmar.");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err instanceof Error ? err.message : "Erro ao cadastrar";
      toast.error(msg);
    } finally {
      setLoading("none");
    }
  }

  async function handleGoogle() {
    setLoading("google");
    try {
      const isInIframe = typeof window !== "undefined" && window.self !== window.top;
      if (isInIframe) {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          toast.error(result.error.message || "Falha no login com Google");
          setLoading("none");
          return;
        }
        if (result.redirected) return;
        destino();
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no login com Google";
      toast.error(msg);
      setLoading("none");
    }
  }

  async function handleReset() {
    try {
      const email = emailSchema.parse(loginEmail);
      setLoading("reset");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado.");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setLoading("none");
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/95 px-8 py-6 shadow-elegant">
            <img
              src={brandPanelUrl}
              alt="meUrbanismo"
              className="w-full max-w-[240px] object-contain"
            />
          </div>
        </Link>


        <div className="rounded-2xl bg-card p-6 shadow-elegant">
          <h1 className="font-display text-2xl font-bold text-center">
            {isConvite ? "Você foi convidado" : "Bem-vindo ao MEU URBANISMO"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {isConvite
              ? "Crie sua conta para acompanhar a obra no MEU URBANISMO."
              : "Acesse sua conta"}
          </p>

          <Tabs defaultValue={isConvite ? "signup" : "login"} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
                </div>
                <button type="button" onClick={handleReset} className="text-xs text-muted-foreground hover:text-primary">
                  Esqueci minha senha
                </button>
                <Button type="submit" className="w-full" disabled={loading !== "none"}>
                  {loading === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input id="signup-name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="signup-phone">Celular</Label>
                  <Input id="signup-phone" type="tel" placeholder="(00) 00000-0000" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} required autoComplete="tel" />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required autoComplete="new-password" minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading !== "none"}>
                  {loading === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading !== "none"}>
            {loading === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
            )}
            Continuar com Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/80">{developedBy}</p>
      </div>
    </div>
  );
}
