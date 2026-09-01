import { createClient } from '@supabase/supabase-js';

// URL pública de fallback (não sensível). Usada apenas se a variável de
// ambiente não estiver configurada, para não derrubar a aplicação em runtime.
const FALLBACK_SUPABASE_URL = 'https://jckwmrwskgtbfttfgykb.supabase.co';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawSupabaseUrl || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = rawSupabaseAnonKey || '';

// Diagnóstico amigável de variáveis de ambiente ausentes.
// Essencial para identificar rapidamente falhas de configuração no Vercel,
// onde o build pode ter sucesso mesmo sem as variáveis VITE_SUPABASE_* definidas.
if (!rawSupabaseUrl) {
  console.warn(
    '[supabaseClient] ⚠️ Variável de ambiente "VITE_SUPABASE_URL" não definida. ' +
    'Utilizando URL de fallback. Configure VITE_SUPABASE_URL nas Environment Variables ' +
    'do projeto no Vercel (Settings → Environment Variables) e redeployie a aplicação.'
  );
}

if (!rawSupabaseAnonKey) {
  console.error(
    '[supabaseClient] ❌ Variável de ambiente "VITE_SUPABASE_ANON_KEY" não definida ou vazia. ' +
    'A autenticação e as consultas ao Supabase irão falhar. ' +
    'Verifique se VITE_SUPABASE_ANON_KEY está configurada nas Environment Variables ' +
    'do projeto no Vercel (Settings → Environment Variables → Production/Preview/Development) ' +
    'e se o deploy foi refeito após a alteração (variáveis VITE_* são "embutidas" no build).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
