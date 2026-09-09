import { supabase } from '../lib/supabaseClient';
import { Convite } from '../types';

/** Normaliza row do banco para o formato camelCase usado na UI. */
export function mapConviteRow(row: Record<string, unknown>): Convite {
  return {
    ...row,
    obraId: row.obra_id as string,
    quadraLote: row.quadra_lote as string,
    statusCadastro: row.status_cadastro as string,
    dataCriacao: row.created_at as string,
    linkAcceso: row.link_acesso as string,
    user_id: row.user_id as string | undefined,
    redeemed_at: row.redeemed_at as string | undefined
  } as Convite;
}

/** Resgata convites pendentes vinculando auth.uid() ao e-mail autenticado. */
export async function redeemPendingConvites(): Promise<Convite[]> {
  const { data, error } = await supabase.rpc('redeem_user_convites');
  if (error) {
    console.error('[conviteResgate] Erro ao resgatar convites:', error.message);
    return [];
  }
  return (data || []).map((row: Record<string, unknown>) => mapConviteRow(row));
}

/** Carrega todos os convites ativos do usuário autenticado (RLS convites_self_select). */
export async function loadConvitesDoUsuario(): Promise<Convite[]> {
  const { data, error } = await supabase
    .from('convites')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[conviteResgate] Erro ao carregar convites:', error.message);
    return [];
  }
  return (data || []).map((row: Record<string, unknown>) => mapConviteRow(row));
}

export const PENDING_OBRA_STORAGE_KEY = 'meurbanismo_pending_obra_id';

export function getPendingObraId(): string | null {
  return sessionStorage.getItem(PENDING_OBRA_STORAGE_KEY);
}

export function setPendingObraId(obraId: string): void {
  sessionStorage.setItem(PENDING_OBRA_STORAGE_KEY, obraId);
}

export function clearPendingObraId(): void {
  sessionStorage.removeItem(PENDING_OBRA_STORAGE_KEY);
}
