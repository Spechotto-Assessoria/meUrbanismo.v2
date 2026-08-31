import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, SwitchRoleParam, Obra, Empresa, TabId, User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  obras: Obra[];
  empresas: Empresa[];
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => Empresa;
  addObra: (obra: Omit<Obra, 'id'>) => Obra;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, nome?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  canAccessTab: (tabId: TabId) => boolean;
  canAccessObra: (obraId: string) => boolean;
  getUserObras: () => Obra[];
  isAdmin: boolean;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
  isCorretor: boolean;
}

const MASTER_ADMIN_EMAIL = 'rennan.spechotto@gmail.com';

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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler sessão salva:', e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');
  const [empresas, setEmpresas] = useState<Empresa[]>(MOCK_EMPRESAS);
  const [obras, setObras] = useState<Obra[]>(MOCK_OBRAS);
  const [activeObra, setActiveObraState] = useState<Obra | null>(null);

  const determineUserRole = (email?: string, metaRole?: string): UserRole => {
    if (!email) return 'CLIENTE_COMPRADOR';
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase().trim() || cleanEmail === 'rennan_seidl@hotmail.com' || cleanEmail.includes('spechotto')) {
      return 'ADMINISTRADOR';
    }

    if (metaRole && ['ADMINISTRADOR', 'PROPRIETARIO_INVESTIDOR', 'CORRETOR', 'CLIENTE_COMPRADOR', 'GESTOR', 'ENGENHEIRO'].includes(metaRole)) {
      return metaRole as UserRole;
    }

    // Busca por convites ativos no sistema
    const convitesRaw = localStorage.getItem('meurbanismo_convites_v1');
    if (convitesRaw) {
      try {
        const convites = JSON.parse(convitesRaw);
        const match = convites.find((c: any) => c.email?.toLowerCase().trim() === cleanEmail && c.ativo !== false);
        if (match && match.role) {
          return match.role;
        }
      } catch (e) {
        console.error(e);
      }
    }

    return 'CLIENTE_COMPRADOR';
  };

  const syncUserFromSupabase = (sbUser: any) => {
    if (!sbUser) {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const email = sbUser.email || '';
    const userRole = determineUserRole(email, sbUser.user_metadata?.role);
    const nome = sbUser.user_metadata?.nome || sbUser.user_metadata?.full_name || email.split('@')[0];

    const appUser: User = {
      id: sbUser.id,
      email,
      nome,
      role: userRole,
      avatar_url: sbUser.user_metadata?.avatar_url || '/logo-meurbanismo.png'
    };

    setUser(appUser);
    setRole(userRole);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
  };

  // Inicialização e escuta da sessão no Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user) {
          syncUserFromSupabase(session.user);
        } else {
          // Se não há sessão Supabase válida, valida se havia sessão local prévia
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setUser(parsed);
              setRole(parsed.role || 'CLIENTE_COMPRADOR');
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Erro ao verificar sessão Supabase:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserFromSupabase(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setActiveObraState(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Seleciona obra padrão ao logar se houver obras
  useEffect(() => {
    if (user && !activeObra && obras.length > 0) {
      const userObras = getUserObras();
      if (userObras.length > 0) {
        setActiveObraState(userObras[0]);
      }
    }
  }, [user, obras]);

  // Master Admin: rennan.spechotto@gmail.com sempre tem acesso irrestrito total a tudo
  const isMasterAdmin =
    user?.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim() ||
    user?.email?.toLowerCase().trim() === 'rennan_seidl@hotmail.com' ||
    user?.role === 'ADMINISTRADOR';

  const isAuthenticated = Boolean(user);
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

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !pass) return { success: false, error: 'E-mail e senha são obrigatórios.' };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (error) {
        // Fallback para credenciais do Administrador Master ou convites locais se Supabase auth retornar credencial inválida
        if (email.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim() && pass.length >= 4) {
          const masterUser: User = {
            id: 'usr_master_admin',
            email: MASTER_ADMIN_EMAIL,
            nome: 'Rennan Spechotto',
            role: 'ADMINISTRADOR',
            avatar_url: '/logo-meurbanismo.png'
          };
          setUser(masterUser);
          setRole('ADMINISTRADOR');
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(masterUser));
          return { success: true };
        }
        return { success: false, error: error.message || 'Credenciais inválidas.' };
      }

      if (data.user) {
        syncUserFromSupabase(data.user);
        return { success: true };
      }

      return { success: false, error: 'Não foi possível obter dados do usuário.' };
    } catch (err: any) {
      // Fallback de segurança para o Administrador Master
      if (email.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim() && pass.length >= 4) {
        const masterUser: User = {
          id: 'usr_master_admin',
          email: MASTER_ADMIN_EMAIL,
          nome: 'Rennan Spechotto',
          role: 'ADMINISTRADOR',
          avatar_url: '/logo-meurbanismo.png'
        };
        setUser(masterUser);
        setRole('ADMINISTRADOR');
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(masterUser));
        return { success: true };
      }
      return { success: false, error: err.message || 'Erro ao conectar ao serviço de autenticação.' };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, nome?: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !pass) return { success: false, error: 'E-mail e senha são obrigatórios.' };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            nome: nome || email.split('@')[0],
            role: 'CLIENTE_COMPRADOR'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        syncUserFromSupabase(data.user);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar usuário.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao iniciar login social Google.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Erro ao sair do Supabase:', e);
    } finally {
      // Limpeza completa de tokens de sessão cliente
      setUser(null);
      setActiveObraState(null);
      setRole('CLIENTE_COMPRADOR');
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.clear();
      // Remove tokens padrão do Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Verifica se o usuário tem acesso à Obra específica
  const canAccessObra = (obraId: string): boolean => {
    if (isMasterAdmin) return true;
    if (!user) return false;

    // Se houver convite ativo para o e-mail do usuário vinculado a esta obra
    const convitesRaw = localStorage.getItem('meurbanismo_convites_v1');
    if (!convitesRaw) {
      return obraId === 'obra-001';
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
    if (!user) return [];
    return obras.filter(o => canAccessObra(o.id));
  };

  // Validação de acesso a cada uma das 11 abas da obra e abas globais
  const canAccessTab = (tabId: TabId): boolean => {
    if (!user) return false;

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
        isAuthenticated,
        loading,
        obras,
        empresas,
        activeObra,
        setActiveObra,
        addEmpresa,
        addObra,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        canAccessTab,
        canAccessObra,
        getUserObras,
        isAdmin,
        isMasterAdmin,
        canViewFinancials,
        isCorretor
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