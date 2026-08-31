import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, SwitchRoleParam, Obra, Empresa, TabId, User } from '../types';

interface AuthContextType {
  user: User;
  role: UserRole;
  obras: Obra[];
  empresas: Empresa[];
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => Empresa;
  addObra: (obra: Omit<Obra, 'id'>) => Obra;
  switchRole: (newRole: SwitchRoleParam) => void;
  loginAsProfile: (profileRole: UserRole, customEmail?: string, customNome?: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canAccessTab: (tabId: TabId) => boolean;
  canAccessObra: (obraId: string) => boolean;
  getUserObras: () => Obra[];
  isAdmin: boolean;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
  isCorretor: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const MASTER_ADMIN_EMAIL = 'rennan.spechotto@gmail.com';

export const DEMO_USERS: Record<UserRole, User> = {
  ADMINISTRADOR: {
    id: 'usr_admin',
    nome: 'Rennan Spechotto',
    email: MASTER_ADMIN_EMAIL,
    role: 'ADMINISTRADOR',
    avatar_url: '/logo-meurbanismo.png'
  },
  PROPRIETARIO_INVESTIDOR: {
    id: 'usr_investidor',
    nome: 'Carlos Eduardo (Investidor)',
    email: 'carlos.investidor@reserva.com.br',
    role: 'PROPRIETARIO_INVESTIDOR',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  CORRETOR: {
    id: 'usr_corretor',
    nome: 'Juliana Mendes (Corretora)',
    email: 'juliana.vendas@imobiliaria.com.br',
    role: 'CORRETOR',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  CLIENTE_COMPRADOR: {
    id: 'usr_cliente',
    nome: 'Marcelo Augusto (Adquirente)',
    email: 'marcelo.comprador@gmail.com',
    role: 'CLIENTE_COMPRADOR',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  GESTOR: {
    id: 'usr_gestor',
    nome: 'Eng. Gestor de Obras',
    email: 'gestao@spechotto.com.br',
    role: 'GESTOR',
    avatar_url: '/logo-meurbanismo.png'
  },
  CONSULTOR: {
    id: 'usr_consultor',
    nome: 'Consultor Urbanístico',
    email: 'consultoria@spechotto.com.br',
    role: 'CONSULTOR',
    avatar_url: '/logo-meurbanismo.png'
  },
  ENGENHEIRO: {
    id: 'usr_eng',
    nome: 'Eng. Residente',
    email: 'obra@spechotto.com.br',
    role: 'ENGENHEIRO',
    avatar_url: '/logo-meurbanismo.png'
  },
  INVESTIDOR: {
    id: 'usr_inv2',
    nome: 'Fundo Investimento Imobiliário',
    email: 'fundo@investimentos.com.br',
    role: 'INVESTIDOR',
    avatar_url: '/logo-meurbanismo.png'
  }
};

const MOCK_EMPRESAS: Empresa[] = [
  {
    id: 'emp-001',
    nome: 'Conecta Urbanismo',
    cnpj: '12.345.678/0001-90',
    email: 'contato@conectaurbanismo.com.br'
  },
  {
    id: 'emp-002',
    nome: 'Linkage Empreendimentos',
    cnpj: '98.765.432/0001-10',
    email: 'contato@linkage.com.br'
  }
];

const MOCK_OBRAS: Obra[] = [
  {
    id: 'obra-001',
    nome: 'Residencial Reserva dos Ipês',
    empresa_id: 'emp-001',
    empresaId: 'emp-001',
    empresa_nome: 'Conecta Urbanismo',
    empresaNome: 'Conecta Urbanismo',
    cidade: 'Mirassol',
    uf: 'SP',
    tipo: 'Loteamento Fechado',
    area_total_m2: 245000,
    areaM2: 245000,
    total_lotes: 312,
    qtdLotes: 312,
    lotes_vendidos: 198,
    lotes_disponiveis: 114,
    percentual_concluido: 68.5,
    custo_orcado: 14850000,
    custo_realizado: 9950000,
    valor_vgv: 38500000,
    foto_capa: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
  },
  {
    id: 'obra-002',
    nome: 'Villa Bella Urban Park',
    empresa_id: 'emp-002',
    empresaId: 'emp-002',
    empresa_nome: 'Linkage Empreendimentos',
    empresaNome: 'Linkage Empreendimentos',
    cidade: 'São José do Rio Preto',
    uf: 'SP',
    tipo: 'Loteamento Aberto',
    area_total_m2: 180000,
    areaM2: 180000,
    total_lotes: 240,
    qtdLotes: 240,
    lotes_vendidos: 84,
    lotes_disponiveis: 156,
    percentual_concluido: 32.0,
    custo_orcado: 11200000,
    custo_realizado: 3584000,
    valor_vgv: 29800000,
    foto_capa: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
  }
];

const AUTH_STORAGE_KEY = 'meurbanismo_auth_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler sessão salva:', e);
      }
    }
    return DEMO_USERS.ADMINISTRADOR;
  });

  const [role, setRole] = useState<UserRole>(() => user.role || 'ADMINISTRADOR');
  const [empresas, setEmpresas] = useState<Empresa[]>(MOCK_EMPRESAS);
  const [obras, setObras] = useState<Obra[]>(MOCK_OBRAS);
  const [activeObra, setActiveObraState] = useState<Obra | null>(MOCK_OBRAS[0]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setRole(user.role);
  }, [user]);

  // Master Admin: rennan.spechotto@gmail.com sempre tem acesso irrestrito total a tudo
  const isMasterAdmin =
    user.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim() ||
    user.email?.toLowerCase().trim() === 'rennan_seidl@hotmail.com' ||
    role === 'ADMINISTRADOR';

  const isAdmin = isMasterAdmin;
  const canViewFinancials = isMasterAdmin || role === 'PROPRIETARIO_INVESTIDOR' || role === 'GESTOR' || role === 'INVESTIDOR';
  const isCorretor = isMasterAdmin || role === 'CORRETOR';

  const setActiveObra = (obra: Obra | null) => {
    setActiveObraState(obra);
  };

  const addEmpresa = (novaData: Omit<Empresa, 'id'>): Empresa => {
    const novaEmpresa: Empresa = {
      ...novaData,
      id: `emp-${Date.now()}`
    };
    setEmpresas(prev => [novaEmpresa, ...prev]);
    return novaEmpresa;
  };

  const addObra = (novaData: Omit<Obra, 'id'>): Obra => {
    const novaObra: Obra = {
      ...novaData,
      id: `obra-${Date.now()}`
    };
    setObras(prev => [novaObra, ...prev]);
    return novaObra;
  };

  const switchRole = (newRole: SwitchRoleParam) => {
    const roleMap: Record<SwitchRoleParam, UserRole> = {
      admin: 'ADMINISTRADOR',
      investidor: 'PROPRIETARIO_INVESTIDOR',
      corretor: 'CORRETOR',
      cliente: 'CLIENTE_COMPRADOR'
    };
    const targetRole = roleMap[newRole];
    loginAsProfile(targetRole);
  };

  const loginAsProfile = (profileRole: UserRole, customEmail?: string, customNome?: string) => {
    const base = DEMO_USERS[profileRole] || DEMO_USERS.ADMINISTRADOR;
    const updated: User = {
      ...base,
      email: customEmail || base.email,
      nome: customNome || base.nome,
      role: profileRole
    };
    setUser(updated);
    setRole(profileRole);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!email) return { success: false, error: 'E-mail é obrigatório' };
    
    // Se for o e-mail master do Rennan Spechotto
    if (email.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim() || email.toLowerCase().includes('spechotto')) {
      loginAsProfile('ADMINISTRADOR', MASTER_ADMIN_EMAIL, 'Rennan Spechotto');
      return { success: true };
    }

    // Procura por convites ativos com esse e-mail
    const convitesRaw = localStorage.getItem('meurbanismo_convites_v1');
    let userConviteRole: UserRole = 'CLIENTE_COMPRADOR';
    let userNome = email.split('@')[0];

    if (convitesRaw) {
      try {
        const convites = JSON.parse(convitesRaw);
        const match = convites.find((c: any) => c.email?.toLowerCase().trim() === email.toLowerCase().trim() && c.ativo !== false);
        if (match) {
          userConviteRole = match.role || 'CLIENTE_COMPRADOR';
          if (match.nome) userNome = match.nome;
        }
      } catch (e) {
        console.error(e);
      }
    }

    loginAsProfile(userConviteRole, email, userNome);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Simulação do Google OAuth com o Admin Rennan Spechotto por padrão
    loginAsProfile('ADMINISTRADOR', MASTER_ADMIN_EMAIL, 'Rennan Spechotto');
    return { success: true };
  };

  const logout = () => {
    loginAsProfile('CLIENTE_COMPRADOR', 'visitante@meurbanismo.com.br', 'Visitante');
    setShowLoginModal(true);
  };

  // Verifica se o usuário tem acesso à Obra específica
  const canAccessObra = (obraId: string): boolean => {
    if (isMasterAdmin) return true;

    // Se houver convite ativo para o e-mail do usuário vinculado a esta obra
    const convitesRaw = localStorage.getItem('meurbanismo_convites_v1');
    if (!convitesRaw) {
      // Obra 001 por padrão liberada para o mock
      return obraId === 'obra-001' || obraId === '1';
    }

    try {
      const convites = JSON.parse(convitesRaw);
      const temConvite = convites.some((c: any) =>
        (c.obraId === obraId || c.obra_id === obraId) &&
        (c.email?.toLowerCase().trim() === user.email?.toLowerCase().trim()) &&
        (c.ativo !== false)
      );
      return temConvite || obraId === 'obra-001';
    } catch {
      return obraId === 'obra-001';
    }
  };

  // Lista apenas as obras autorizadas para o usuário logado
  const getUserObras = (): Obra[] => {
    if (isMasterAdmin) return obras;
    return obras.filter(o => canAccessObra(o.id));
  };

  // Validação de acesso a cada uma das 11 abas da obra e abas globais
  const canAccessTab = (tabId: TabId): boolean => {
    // Abas globais
    if (tabId === 'dashboard' || tabId === 'nova-empresa' || tabId === 'nova-obra') {
      return isMasterAdmin;
    }

    // Administrador tem acesso total irrestrito a todas as abas
    if (isMasterAdmin) return true;

    // Menu dos 11 módulos da Obra
    switch (role) {
      case 'PROPRIETARIO_INVESTIDOR':
      case 'INVESTIDOR':
        return [
          'resumo',
          'orcamento',
          'cronograma',
          'andamento',
          'viabilidade',
          'acompanhamento',
          'documentos',
          'mapa',
          'vendas',
          'relatorios',
          'portfolio'
        ].includes(tabId);

      case 'CORRETOR':
        return [
          'resumo',
          'andamento',
          'mapa',
          'vendas',
          'documentos',
          'acompanhamento',
          'portfolio',
          'relatorios'
        ].includes(tabId);

      case 'CLIENTE_COMPRADOR':
        return [
          'resumo',
          'andamento',
          'mapa',
          'acompanhamento',
          'documentos',
          'portfolio'
        ].includes(tabId);

      case 'GESTOR':
      case 'ENGENHEIRO':
      case 'CONSULTOR':
        return [
          'resumo',
          'orcamento',
          'cronograma',
          'andamento',
          'viabilidade',
          'acompanhamento',
          'documentos',
          'mapa',
          'vendas',
          'relatorios',
          'portfolio'
        ].includes(tabId);

      default:
        return ['resumo', 'andamento', 'portfolio'].includes(tabId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        obras,
        empresas,
        activeObra,
        setActiveObra,
        addEmpresa,
        addObra,
        switchRole,
        loginAsProfile,
        loginWithEmail,
        loginWithGoogle,
        logout,
        canAccessTab,
        canAccessObra,
        getUserObras,
        isAdmin,
        isMasterAdmin,
        canViewFinancials,
        isCorretor,
        showLoginModal,
        setShowLoginModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};