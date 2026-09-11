import { UserRole, User } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  redeemPendingConvites,
  loadConvitesDoUsuario,
  getPendingObraId,
  clearPendingObraId
} from '../services/conviteResgate';
import { Convite, Obra } from '../types';
import { resolveUserRole } from '../lib/auth-admin';

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

export async function fetchRoleFromPerfis(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase.from('perfis').select('role').eq('id', userId).maybeSingle();
    if (!error && data && isValidRole(data.role)) {
      return data.role;
    }
  } catch (e) {
    console.error('Erro ao buscar perfil do usuário:', e);
  }
  return 'CLIENTE_COMPRADOR';
}

export interface SyncSessionResult {
  appUser: User;
  userRole: UserRole;
  convites: Convite[];
}

/** Sincroniza usuário, resgata convites pendentes e carrega convites ativos. */
export async function buildUserSession(sbUser: { id: string; email?: string; user_metadata?: Record<string, string> }): Promise<SyncSessionResult> {
  const email = sbUser.email || '';
  const perfilRole = await fetchRoleFromPerfis(sbUser.id);
  const userRole = resolveUserRole(email, perfilRole);
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

function temConviteAtivoParaObra(convites: Convite[], obraId: string): boolean {
  return convites.some(c => c.obra_id === obraId && c.ativo !== false);
}

/** Seleciona obra ativa: prioriza pendingObraId do link de convite. */
export function resolveActiveObraAfterLogin(
  obras: Obra[],
  currentActive: Obra | null,
  convites: Convite[] = [],
  isAdmin = false
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
    if (isAdmin || temConviteAtivoParaObra(convites, currentActive.id)) {
      return currentActive;
    }
  }
  return obras.length > 0 ? obras[0] : null;
}
