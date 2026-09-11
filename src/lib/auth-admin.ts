import type { UserRole } from '../types';

/** E-mails com privilégio total (espelha public.is_admin() no Supabase). */
export const MASTER_EMAILS = [
  'rennan.spechotto@gmail.com',
  'rennan_seidl@hotmail.com',
] as const;

export const MASTER_EMAIL = MASTER_EMAILS[0];

export function isMasterEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return MASTER_EMAILS.some((m) => m.toLowerCase() === normalized);
}

export function isMasterAdminUser(email?: string | null, role?: UserRole | null): boolean {
  return isMasterEmail(email) || role === 'ADMINISTRADOR';
}

export function resolveUserRole(email?: string | null, perfilRole?: UserRole): UserRole {
  if (isMasterEmail(email)) return 'ADMINISTRADOR';
  return perfilRole ?? 'CLIENTE_COMPRADOR';
}
