import { useMemo, useCallback } from 'react';
import { Convite, UserRole } from '../types';

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

const isValidRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && VALID_ROLES.includes(value as UserRole);

/** Papel efetivo na obra a partir dos convites do usuário. */
export function getRoleForObraFromConvites(
  convites: Convite[],
  obraId: string,
  fallbackRole: UserRole,
  isMasterAdmin: boolean
): UserRole {
  if (isMasterAdmin) return 'ADMINISTRADOR';
  if (!obraId) return fallbackRole;

  const convite = convites.find(
    c => c.obra_id === obraId && c.ativo !== false
  );
  if (convite?.role && isValidRole(convite.role)) {
    return convite.role;
  }
  return fallbackRole;
}

export function canViewFinancialsForRole(role: UserRole, isMasterAdmin: boolean): boolean {
  if (isMasterAdmin) return true;
  return ['PROPRIETARIO_INVESTIDOR', 'GESTOR', 'ENGENHEIRO', 'CONSULTOR', 'INVESTIDOR'].includes(role);
}

export function isCorretorRole(role: UserRole, isMasterAdmin: boolean): boolean {
  return isMasterAdmin || role === 'CORRETOR';
}

interface UseRolePorObraParams {
  convites: Convite[];
  activeObraId: string | null | undefined;
  fallbackRole: UserRole;
  isMasterAdmin: boolean;
}

export function useRolePorObra({
  convites,
  activeObraId,
  fallbackRole,
  isMasterAdmin
}: UseRolePorObraParams) {
  const getRoleForObra = useCallback(
    (obraId: string): UserRole =>
      getRoleForObraFromConvites(convites, obraId, fallbackRole, isMasterAdmin),
    [convites, fallbackRole, isMasterAdmin]
  );

  const effectiveRole = useMemo(
    () => getRoleForObraFromConvites(convites, activeObraId || '', fallbackRole, isMasterAdmin),
    [convites, activeObraId, fallbackRole, isMasterAdmin]
  );

  const canViewFinancials = useMemo(
    () => canViewFinancialsForRole(effectiveRole, isMasterAdmin),
    [effectiveRole, isMasterAdmin]
  );

  const isCorretor = useMemo(
    () => isCorretorRole(effectiveRole, isMasterAdmin),
    [effectiveRole, isMasterAdmin]
  );

  return { getRoleForObra, effectiveRole, canViewFinancials, isCorretor };
}
