import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { canViewFinancialsForRole, isCorretorRole } from '../hooks/useRolePorObra';

export interface ObraAccessRules {
  canAccessObra: boolean;
  canViewFinancials: boolean;
  canViewGlobalBudget: boolean;
  canViewCommercialOnly: boolean;
  canAccessManagement: boolean;
  canUploadPhotos: boolean;
  canViewPrivateDocs: boolean;
  canEditProgress: boolean;
  role: UserRole;
  isMasterAdmin: boolean;
  isInvestidor: boolean;
  isCliente: boolean;
  isCorretor: boolean;
}

export const useObraAccess = (obraId?: string): ObraAccessRules => {
  const {
    isMasterAdmin,
    canAccessObra: checkCanAccessObra,
    activeObra,
    getRoleForObra
  } = useAuth();

  const targetObraId = obraId || activeObra?.id || '';
  const canAccess = checkCanAccessObra(targetObraId);
  const obraRole = getRoleForObra(targetObraId);

  return useMemo(() => {
    const isMaster = Boolean(isMasterAdmin);
    const isInvestidor = !isMaster && (obraRole === 'PROPRIETARIO_INVESTIDOR' || obraRole === 'INVESTIDOR');
    const isCliente = !isMaster && obraRole === 'CLIENTE_COMPRADOR';
    const isCorretor = isCorretorRole(obraRole, isMaster);
    const canViewFinancials = canViewFinancialsForRole(obraRole, isMaster);

    if (isMaster) {
      return {
        canAccessObra: true,
        canViewFinancials: true,
        canViewGlobalBudget: true,
        canViewCommercialOnly: false,
        canAccessManagement: true,
        canUploadPhotos: true,
        canViewPrivateDocs: true,
        canEditProgress: true,
        role: 'ADMINISTRADOR',
        isMasterAdmin: true,
        isInvestidor: false,
        isCliente: false,
        isCorretor: false
      };
    }

    if (isInvestidor) {
      return {
        canAccessObra: canAccess,
        canViewFinancials: true,
        canViewGlobalBudget: true,
        canViewCommercialOnly: false,
        canAccessManagement: false,
        canUploadPhotos: false,
        canViewPrivateDocs: true,
        canEditProgress: false,
        role: 'PROPRIETARIO_INVESTIDOR',
        isMasterAdmin: false,
        isInvestidor: true,
        isCliente: false,
        isCorretor: false
      };
    }

    if (isCorretor) {
      return {
        canAccessObra: canAccess,
        canViewFinancials: false,
        canViewGlobalBudget: false,
        canViewCommercialOnly: true,
        canAccessManagement: false,
        canUploadPhotos: false,
        canViewPrivateDocs: false,
        canEditProgress: false,
        role: 'CORRETOR',
        isMasterAdmin: false,
        isInvestidor: false,
        isCliente: false,
        isCorretor: true
      };
    }

    return {
      canAccessObra: canAccess,
      canViewFinancials: false,
      canViewGlobalBudget: false,
      canViewCommercialOnly: false,
      canAccessManagement: false,
      canUploadPhotos: false,
      canViewPrivateDocs: false,
      canEditProgress: false,
      role: 'CLIENTE_COMPRADOR',
      isMasterAdmin: false,
      isInvestidor: false,
      isCliente: true,
      isCorretor: false
    };
  }, [isMasterAdmin, obraRole, canAccess]);
};
