import { UserRole, User } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  redeemPendingConvites,
  loadConvitesDoUsuario,
  getPendingObraId,
  clearPendingObraId
} from '../services/conviteResgate';
import { Convite, Obra } from '../types';

const MASTER_ADMIN_EMAIL = 'rennan.spechotto@gmail.com';
const MASTER_ADMIN_EMAIL_ALT = 'rennan_seidl@hotmail.com';
export const AUTH_STORAGE_KEY = 'meurbanismo_auth_session_v2';

const VALID_ROLES: UserRole[] = [
  'ADMINISTRADOR',
  'PROPRIETARIO_INVESTIDOR',
  'CORRETOR',
  'CLIENTE_COMPRADOR',
  'GESTOR',
  'ENGENHEIRO',
  'CONSULTOR',
  'INVESTIDOR'
];

export const isValidRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && VALID_ROLES.includes(value as UserRole);

export const isMasterEmail = (email?: string | null): boolean => {
  const clean = (email || '').toLowerCase().trim();
  return clean === MASTER_ADMIN_EMAIL || clean === MASTER_ADMIN_EMAIL_ALT;
};

export async function fetchRoleFromPerfis(userId: string, email: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase.from('perfis').select('role').eq('id', userId).maybeSingle();
    if (!error && data && isValidRole(data.role)) {
      return data.role;
    }
  } catch (e) {
    console.error('Erro ao buscar perfil do usuário:', e);
  }
  return isMasterEmail(email) ? 'ADMINISTRADOR' : 'CLIENTE_COMPRADOR';
}

export interface SyncSessionResult {
  appUser: User;
  userRole: UserRole;
  convites: Convite[];
}

/** Sincroniza usuário, resgata convites pendentes e carrega convites ativos. */
export async function buildUserSession(sbUser: { id: string; email?: string; user_metadata?: Record<string, string> }): Promise<SyncSessionResult> {
  const email = sbUser.email || '';
  const userRole = await fetchRoleFromPerfis(sbUser.id, email);
  const nome = sbUser.user_metadata?.nome || sbUser.user_metadata?.full_name || email.split('@')[0];

  const appUser: User = {
    id: sbUser.id,
    email,
    nome,
    role: userRole,
    avatar_url: sbUser.user_metadata?.avatar_url || '/logo-meurbanismo.png'
  };

  await redeemPendingConvites();
  const convites = await loadConvitesDoUsuario();

  return { appUser, userRole, convites };
}

/** Seleciona obra ativa: prioriza pendingObraId do link de convite. */
export function resolveActiveObraAfterLogin(
  obras: Obra[],
  currentActive: Obra | null
): Obra | null {
  const pendingId = getPendingObraId();
  if (pendingId) {
    const fromLink = obras.find(o => o.id === pendingId);
    if (fromLink) {
      clearPendingObraId();
      return fromLink;
    }
    clearPendingObraId();
  }
  if (currentActive && obras.some(o => o.id === currentActive.id)) {
    return currentActive;
  }
  return obras.length > 0 ? obras[0] : null;
}
