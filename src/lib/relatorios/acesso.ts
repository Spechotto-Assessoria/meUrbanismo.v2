import type { UserRole } from '../../types';

export const MASTER_EMAIL = 'rennan.spechotto@gmail.com';

export function podeAcessarRelatorios(
  userEmail: string | undefined,
  isMasterAdmin: boolean,
  obraRole: UserRole
): boolean {
  if (userEmail?.toLowerCase() === MASTER_EMAIL) return true;
  if (isMasterAdmin) return true;
  return obraRole === 'PROPRIETARIO_INVESTIDOR';
}

export function podeExcluirRelatorio(userEmail: string | undefined): boolean {
  return userEmail?.toLowerCase() === MASTER_EMAIL;
}

export function financeiroPadraoMarcado(userEmail: string | undefined, isMasterAdmin: boolean): boolean {
  return isMasterAdmin || userEmail?.toLowerCase() === MASTER_EMAIL;
}
