import { createClient } from '@supabase/supabase-js';

/**
 * Fallbacks de segurança (hardcoded) do projeto Supabase oficial.
 *
 * Motivo: a chave "anon" do Supabase é pública por design — ela é sempre
 * embutida no bundle do cliente e a segurança real dos dados é garantida
 * pelas políticas de Row Level Security (RLS) no banco, não pelo sigilo
 * desta chave. Por isso é seguro mantê-la como fallback direto no código,
 * evitando que uma falha de configuração das Environment Variables no
 * Vercel derrube a aplicação inteira com erro 401/"Failed to fetch".
 *
 * Os valores abaixo são a URL e a "publishable key" (anon) reais do
 * projeto Supabase oficial (Project Settings → API). Nunca substitua por
 * uma "service_role key" (essa sim é secreta e nunca deve ir ao cliente).
 */
const FALLBACK_SUPABASE_URL = 'https://tvokopoxxwhimejwkzlr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_QzML-0lqjfNnHMoBx4t9ww_rNS1xdE9';

/** Padrões que indicam um valor de ambiente ausente, vazio ou apenas um placeholder. */
const INVALID_VALUE_PATTERNS = [
  '',
  'undefined',
  'null',
  'your-supabase-url',
  'your-anon-key',
  'placeholder',
  'change-me',
  'colar-aqui',
  'cole_aqui',
];

function isValidEnvValue(value: string | undefined | null): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return false;
  return !INVALID_VALUE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function isValidSupabaseUrl(value: string | undefined | null): value is string {
  if (!isValidEnvValue(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const urlFromEnvIsValid = isValidSupabaseUrl(rawSupabaseUrl);
const keyFromEnvIsValid = isValidEnvValue(rawSupabaseAnonKey);

const supabaseUrl: string = urlFromEnvIsValid ? rawSupabaseUrl : FALLBACK_SUPABASE_URL;
const supabaseAnonKey: string = keyFromEnvIsValid ? rawSupabaseAnonKey : FALLBACK_SUPABASE_ANON_KEY;

// Log de diagnóstico em tempo de execução — essencial para identificar rapidamente
// no console do navegador (e nos logs do Vercel/CI) se as Environment Variables
// do projeto foram carregadas corretamente no build ou se o fallback foi acionado.
if (urlFromEnvIsValid && keyFromEnvIsValid) {
  console.log('[supabaseClient] ✅ Cliente Supabase inicializado com as variáveis de ambiente do Vercel (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
} else {
  const motivos: string[] = [];
  if (!urlFromEnvIsValid) motivos.push('VITE_SUPABASE_URL ausente, vazia ou inválida');
  if (!keyFromEnvIsValid) motivos.push('VITE_SUPABASE_ANON_KEY ausente ou vazia');

  console.warn(
    `[supabaseClient] ⚠️ Cliente Supabase inicializado com FALLBACK de segurança (${motivos.join(' e ')}). ` +
    'A aplicação continuará funcionando normalmente, mas recomenda-se configurar as ' +
    'Environment Variables corretas em Vercel → Settings → Environment Variables ' +
    '(Production/Preview/Development) e refazer o deploy, já que variáveis VITE_* ' +
    'são embutidas em tempo de build.'
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
