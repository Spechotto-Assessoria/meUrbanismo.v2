import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export interface ObraAccessRules {
  canAccessObra: boolean;
  canViewFinancials: boolean;        // Orçamento, Custos, VGV, TIR, VPL, Viabilidade
  canViewGlobalBudget: boolean;      // Orçamento Global da Construtora
  canViewCommercialOnly: boolean;    // Apenas preços dos lotes e simulador de vendas
  canAccessManagement: boolean;      // Criar Obra, Criar Empresa, Enviar Convites (Master Admin)
  canUploadPhotos: boolean;          // Upload e gestão de fotos
  canViewPrivateDocs: boolean;       // Pastas e documentos confidenciais
  canEditProgress: boolean;          // Atualizar percentuais de andamento
  role: UserRole;
  isMasterAdmin: boolean;
  isInvestidor: boolean;
  isCliente: boolean;
  isCorretor: boolean;
}

export const useObraAccess = (obraId?: string): ObraAccessRules => {
  const {
    user,
    role,
    isMasterAdmin,
    canAccessObra: checkCanAccessObra,
    activeObra
  } = useAuth();

  const targetObraId = obraId || activeObra?.id || '';
  const canAccess = checkCanAccessObra(targetObraId);

  // Classificação estrita dos 4 papéis do sistema
  const isMaster = Boolean(isMasterAdmin);
  const isInvestidor = !isMaster && (role === 'PROPRIETARIO_INVESTIDOR' || role === 'INVESTIDOR');
  const isCliente = !isMaster && role === 'CLIENTE_COMPRADOR';
  const isCorretor = !isMaster && role === 'CORRETOR';

  // 1. ADMINISTRADOR: Acesso irrestrito a todo o app, gestão e criação
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

  // 2. PROPRIETÁRIO / INVESTIDOR: Acesso a todas as abas e dados financeiros da obra vinculada. Sem ferramentas de gestão global.
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

  // 3. CORRETOR DE IMÓVEIS: Acesso ao cronograma físico, fotos públicas, documentos públicos, Mapa e Vendas. Sem custos/orçamento.
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

  // 4. CLIENTE / COMPRADOR: Acesso restrito apenas ao físico, fotos autorizadas e portfólio. Bloqueio financeiro absoluto.
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
};
