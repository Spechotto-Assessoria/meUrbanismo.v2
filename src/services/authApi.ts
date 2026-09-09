import { supabase } from '../lib/supabaseClient';

export async function loginWithEmailApi(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; email?: string; user_metadata?: Record<string, string> } }> {
  if (!email || !pass) return { success: false, error: 'E-mail e senha são obrigatórios.' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error) {
      console.error(`[auth] Falha no login para "${email}": ${error.status || ''} ${error.message}`);
      if (/email not confirmed/i.test(error.message)) {
        return { success: false, error: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam) para o link de confirmação enviado pelo Supabase.' };
      }
      return { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha, ou use "Esqueci minha senha".' };
    }
    if (data.user) return { success: true, user: data.user };
    return { success: false, error: 'Não foi possível obter dados do usuário.' };
  } catch {
    return { success: false, error: 'Erro ao conectar ao serviço de autenticação. Tente novamente.' };
  }
}

export async function signUpWithEmailApi(
  email: string,
  pass: string,
  nome?: string
): Promise<{ success: boolean; error?: string; user?: { id: string; email?: string; user_metadata?: Record<string, string> } }> {
  if (!email || !pass) return { success: false, error: 'E-mail e senha são obrigatórios.' };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: { data: { nome: nome || email.split('@')[0] } }
    });
    if (error) return { success: false, error: error.message };
    if (data.user) return { success: true, user: data.user };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao cadastrar usuário.' };
  }
}

export async function resetPasswordApi(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: 'Informe o e-mail cadastrado.' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) {
      console.error('[auth] Falha ao solicitar redefinição de senha:', error.message);
      return { success: false, error: 'Não foi possível enviar o e-mail de redefinição. Tente novamente em instantes.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao conectar ao serviço de autenticação. Tente novamente.' };
  }
}

export async function loginWithGoogleApi(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, skipBrowserRedirect: true }
    });
    if (error) {
      return { success: false, error: 'O login com Google está desativado ou não configurado neste projeto. Por favor, utilize seu e-mail e senha cadastrados.' };
    }
    if (data?.url) {
      try {
        const res = await fetch(data.url, { method: 'GET', headers: { Accept: 'text/html,application/xhtml+xml' } });
        if (!res.ok) {
          return { success: false, error: 'O login com Google está desativado ou não configurado neste projeto do Supabase. Utilize e-mail e senha.' };
        }
        window.location.href = data.url;
        return { success: true };
      } catch {
        return { success: false, error: 'O login com Google está desativado ou não configurado neste projeto. Por favor, utilize seu e-mail e senha.' };
      }
    }
    return { success: false, error: 'O login com Google está desativado ou não configurado neste projeto. Utilize e-mail e senha.' };
  } catch {
    return { success: false, error: 'O login com Google está desativado ou não configurado neste projeto. Utilize e-mail e senha.' };
  }
}
