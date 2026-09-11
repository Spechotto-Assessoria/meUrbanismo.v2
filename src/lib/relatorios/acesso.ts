import type { UserRole } from '../../types';
import { isMasterEmail, MASTER_EMAIL } from '../auth-admin';

export { MASTER_EMAIL };

export function podeAcessarRelatorios(
  userEmail: string | undefined,
  isMasterAdmin: boolean,
  obraRole: UserRole
): boolean {
  if (isMasterEmail(userEmail)) return true;
  if (isMasterAdmin) return true;
  return obraRole === 'PROPRIETARIO_INVESTIDOR';
}

export function podeExcluirRelatorio(userEmail: string | undefined): boolean {
  return isMasterEmail(userEmail);
}

export function financeiroPadraoMarcado(userEmail: string | undefined, isMasterAdmin: boolean): boolean {
  return isMasterAdmin || isMasterEmail(userEmail);
}
