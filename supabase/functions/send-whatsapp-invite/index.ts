// Edge Function: send-whatsapp-invite
//
// Dispara a mensagem de convite por WhatsApp automaticamente, a partir do
// número comercial conectado na Z-API — sem depender do WhatsApp pessoal do
// administrador. As credenciais da Z-API (ZAPI_INSTANCE_ID, ZAPI_TOKEN,
// ZAPI_CLIENT_TOKEN) ficam apenas aqui no servidor (Secrets do Supabase),
// nunca no bundle do front-end.
//
// Como configurar:
//   1. Crie uma conta e uma instância em https://www.z-api.io, conecte o
//      número de WhatsApp comercial via QR Code.
//   2. Copie "ID da instância" e "Token" (painel da instância) e o
//      "Client-Token" (aba Segurança da instância).
//   3. Defina os 3 valores como Secrets desta função:
//        supabase secrets set ZAPI_INSTANCE_ID=... ZAPI_TOKEN=... ZAPI_CLIENT_TOKEN=...
//      (ou via Dashboard → Edge Functions → Secrets).
//   4. Deploy: supabase functions deploy send-whatsapp-invite
//
// Segurança: só usuários autenticados com papel ADMINISTRADOR (ou os e-mails
// master fixos) podem disparar o envio — verificado aqui no servidor,
// mesmo que alguém tente chamar esta função diretamente pela API.

// @ts-ignore - módulo resolvido em tempo de execução pelo Deno (Supabase Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - "Deno" existe no runtime das Edge Functions do Supabase
const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
// @ts-ignore
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');
// @ts-ignore
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const MASTER_ADMIN_EMAILS = ['rennan.spechotto@gmail.com', 'rennan_seidl@hotmail.com'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Normaliza o telefone para o formato exigido pela Z-API: só dígitos, com DDI 55 quando ausente. */
function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  // Números brasileiros sem DDI têm 10 ou 11 dígitos (DDD + telefone).
  return digits.length <= 11 ? `55${digits}` : digits;
}

// @ts-ignore - "Deno.serve" é a assinatura padrão das Edge Functions do Supabase
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) {
      return jsonResponse(
        { error: 'Integração com WhatsApp (Z-API) ainda não configurada no servidor. Defina os Secrets ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN.' },
        500
      );
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Configuração do servidor incompleta.' }, 500);
    }

    // 1. Confirma que quem está chamando é um administrador de verdade.
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return jsonResponse({ error: 'Não autenticado.' }, 401);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401);
    }

    const email = (userData.user.email || '').toLowerCase().trim();
    let isAdmin = MASTER_ADMIN_EMAILS.includes(email);
    if (!isAdmin) {
      const { data: perfil } = await supabaseAdmin
        .from('perfis')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();
      isAdmin = perfil?.role === 'ADMINISTRADOR';
    }
    if (!isAdmin) {
      return jsonResponse({ error: 'Apenas administradores podem enviar convites por WhatsApp.' }, 403);
    }

    // 2. Lê e valida o corpo da requisição.
    const { telefone, mensagem } = await req.json().catch(() => ({}));
    const phone = normalizePhone(telefone);
    if (!phone) {
      return jsonResponse({ error: 'Este convite não tem um telefone/WhatsApp cadastrado.' }, 400);
    }
    if (!mensagem || !String(mensagem).trim()) {
      return jsonResponse({ error: 'Mensagem vazia.' }, 400);
    }

    // 3. Envia de fato via Z-API, a partir do número comercial conectado à instância.
    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone, message: mensagem }),
    });

    const zapiBody = await zapiResponse.json().catch(() => ({}));

    if (!zapiResponse.ok) {
      console.error('[send-whatsapp-invite] Falha na Z-API:', zapiResponse.status, zapiBody);
      return jsonResponse(
        { error: 'Não foi possível enviar a mensagem pelo WhatsApp. Confirme se a instância Z-API está com o número conectado (QR Code ativo).' },
        502
      );
    }

    return jsonResponse({ success: true, zapiId: zapiBody?.zaapId || zapiBody?.messageId || null }, 200);
  } catch (err) {
    console.error('[send-whatsapp-invite] Erro inesperado:', err);
    return jsonResponse({ error: 'Erro inesperado ao enviar a mensagem pelo WhatsApp.' }, 500);
  }
});
