import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, Obra, Empresa, TabId, User, Convite } from '../types';
import { supabase } from '../lib/supabaseClient';
import { dataService } from '../services/supabase';
import { abasDoPerfil } from '../lib/permissoes';
import { useRolePorObra } from '../hooks/useRolePorObra';
import {
  AUTH_STORAGE_KEY,
  buildUserSession,
  resolveActiveObraAfterLogin
} from '../services/authSession';
import {
  loginWithEmailApi,
  signUpWithEmailApi,
  resetPasswordApi,
  loginWithGoogleApi
} from '../services/authApi';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  effectiveRole: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  obras: Obra[];
  empresas: Empresa[];
  convitesUsuario: Convite[];
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => Promise<Empresa>;
  updateEmpresa: (empresa: Empresa) => Promise<Empresa>;
  updateEmpresaLogo: (id: string, logoUrl: string) => Promise<Empresa>;
  deleteEmpresa: (id: string) => Promise<void>;
  addObra: (obra: Omit<Obra, 'id'>) => Promise<Obra>;
  updateObra: (obra: Obra) => Promise<Obra>;
  updateObraFotoCapa: (id: string, fotoUrl: string) => Promise<Obra>;
  deleteObra: (id: string) => Promise<void>;
  setObraArquivada: (id: string, arquivada: boolean) => Promise<Obra>;
  refreshObras: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, nome?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  canAccessTab: (tabId: TabId) => boolean;
  canAccessObra: (obraId: string) => boolean;
  getUserObras: () => Obra[];
  getRoleForObra: (obraId: string) => UserRole;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
  isCorretor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');
  const [convitesUsuario, setConvitesUsuario] = useState<Convite[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [activeObra, setActiveObraState] = useState<Obra | null>(null);

  const isMasterAdmin = user?.role === 'ADMINISTRADOR';
  const { getRoleForObra, effectiveRole, canViewFinancials, isCorretor } = useRolePorObra({
    convites: convitesUsuario,
    activeObraId: activeObra?.id,
    fallbackRole: role,
    isMasterAdmin
  });

  const fetchObrasEmpresas = useCallback(async (): Promise<{ obras: Obra[]; empresas: Empresa[] }> => {
    const [obrasData, empresasData] = await Promise.all([
      dataService.getObras(),
      dataService.getEmpresas()
    ]);
    return { obras: obrasData, empresas: empresasData };
  }, []);

  const refreshObras = useCallback(async (): Promise<void> => {
    if (!user) {
      setObras([]);
      setEmpresas([]);
      return;
    }
    try {
      const { obras: obrasData, empresas: empresasData } = await fetchObrasEmpresas();
      setObras(obrasData);
      setEmpresas(empresasData);
      setActiveObraState(prev => resolveActiveObraAfterLogin(obrasData, prev, convitesUsuario, isMasterAdmin));
    } catch (e) {
      console.error('Erro ao carregar obras/empresas do Supabase:', e);
    }
  }, [user, fetchObrasEmpresas, convitesUsuario, isMasterAdmin]);

  const syncUserFromSupabase = useCallback(async (sbUser: { id: string; email?: string; user_metadata?: Record<string, string> } | null): Promise<void> => {
    if (!sbUser) {
      setUser(null);
      setConvitesUsuario([]);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const { appUser, userRole, convites } = await buildUserSession(sbUser);
    const admin = userRole === 'ADMINISTRADOR';
    setUser(appUser);
    setRole(userRole);
    setConvitesUsuario(convites);

    try {
      const { obras: obrasData, empresas: empresasData } = await fetchObrasEmpresas();
      setObras(obrasData);
      setEmpresas(empresasData);
      setActiveObraState(prev => resolveActiveObraAfterLogin(obrasData, prev, convites, admin));
    } catch (e) {
      console.error('Erro ao carregar obras após resgate de convites:', e);
    }
  }, [fetchObrasEmpresas]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Erro ao verificar sessão Supabase:', error.message);
        if (session?.user) {
          await syncUserFromSupabase(session.user);
        } else {
          setUser(null);
          setRole('CLIENTE_COMPRADOR');
          setConvitesUsuario([]);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Erro ao verificar sessão Supabase:', e);
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void syncUserFromSupabase(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setActiveObraState(null);
        setObras([]);
        setEmpresas([]);
        setConvitesUsuario([]);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserFromSupabase]);

  const isAuthenticated = Boolean(user);
  const isAdmin = isMasterAdmin;
  const ERRO_SO_ADMIN = 'Apenas o administrador pode cadastrar, editar, arquivar ou excluir empresas e obras.';

  const exigirAdministrador = () => {
    if (!isMasterAdmin) throw new Error(ERRO_SO_ADMIN);
  };

  const setActiveObra = useCallback((obra: Obra | null) => {
    if (obra && !isMasterAdmin) {
      const temAcesso =
        obras.some(o => o.id === obra.id) &&
        convitesUsuario.some(c => c.obra_id === obra.id && c.ativo !== false);
      if (!temAcesso) {
        console.warn('[Auth] Obra sem convite ativo:', obra.id);
        return;
      }
    }
    setActiveObraState(obra);
  }, [isMasterAdmin, obras, convitesUsuario]);

  const addEmpresa = async (novaData: Omit<Empresa, 'id'>): Promise<Empresa> => {
    exigirAdministrador();
    const novaEmpresa = await dataService.saveEmpresa(novaData);
    setEmpresas(prev => [novaEmpresa, ...prev]);
    return novaEmpresa;
  };

  const updateEmpresa = async (empresa: Empresa): Promise<Empresa> => {
    exigirAdministrador();
    const atualizada = await dataService.saveEmpresa(empresa);
    setEmpresas(prev => prev.map(e => (e.id === atualizada.id ? atualizada : e)));
    return atualizada;
  };

  const updateEmpresaLogo = async (id: string, logoUrl: string): Promise<Empresa> => {
    exigirAdministrador();
    const empresaAtualizada = await dataService.updateEmpresaLogo(id, logoUrl);
    setEmpresas(prev => prev.map(e => (e.id === id ? empresaAtualizada : e)));
    return empresaAtualizada;
  };

  const deleteEmpresa = async (id: string): Promise<void> => {
    exigirAdministrador();
    await dataService.deleteEmpresa(id);
    setEmpresas(prev => prev.filter(e => e.id !== id));
    await refreshObras();
  };

  const addObra = async (novaData: Omit<Obra, 'id'>): Promise<Obra> => {
    exigirAdministrador();
    const novaObra = await dataService.saveObra(novaData);
    await refreshObras();
    return novaObra;
  };

  const updateObra = async (obra: Obra): Promise<Obra> => {
    exigirAdministrador();
    const atualizada = await dataService.saveObra(obra);
    await refreshObras();
    if (activeObra?.id === atualizada.id) setActiveObraState(atualizada);
    return atualizada;
  };

  const updateObraFotoCapa = async (id: string, fotoUrl: string): Promise<Obra> => {
    exigirAdministrador();
    const atualizada = await dataService.updateObraFotoCapa(id, fotoUrl);
    await refreshObras();
    if (activeObra?.id === id) setActiveObraState(atualizada);
    return atualizada;
  };

  const deleteObra = async (id: string): Promise<void> => {
    exigirAdministrador();
    await dataService.deleteObra(id);
    if (activeObra?.id === id) setActiveObraState(null);
    await refreshObras();
  };

  const setObraArquivada = async (id: string, arquivada: boolean): Promise<Obra> => {
    exigirAdministrador();
    const atualizada = await dataService.setObraArquivada(id, arquivada);
    await refreshObras();
    if (arquivada && activeObra?.id === id) setActiveObraState(null);
    return atualizada;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const res = await loginWithEmailApi(email, pass);
    if (res.success && res.user) await syncUserFromSupabase(res.user);
    return res;
  };

  const resetPassword = (email: string) => resetPasswordApi(email);

  const signUpWithEmail = async (email: string, pass: string, nome?: string): Promise<{ success: boolean; error?: string }> => {
    const res = await signUpWithEmailApi(email, pass, nome);
    if (res.success && res.user) await syncUserFromSupabase(res.user);
    return res;
  };

  const loginWithGoogle = () => loginWithGoogleApi();

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Erro ao sair do Supabase:', e);
    } finally {
      setUser(null);
      setActiveObraState(null);
      setObras([]);
      setEmpresas([]);
      setConvitesUsuario([]);
      setRole('CLIENTE_COMPRADOR');
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.clear();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) localStorage.removeItem(key);
      });
    }
  };

  const canAccessObra = useCallback((obraId: string): boolean => {
    if (isMasterAdmin) return true;
    if (!obras.some(o => o.id === obraId)) return false;
    return convitesUsuario.some(c => c.obra_id === obraId && c.ativo !== false);
  }, [isMasterAdmin, obras, convitesUsuario]);

  const getUserObras = (): Obra[] =>
    obras.filter(o => !o.arquivada && o.status !== 'Arquivada');

  const canAccessTab = useCallback((tabId: TabId): boolean => {
    if (!user) return false;
    if (tabId === 'dashboard' || tabId === 'empresas') return true;
    if (tabId === 'nova-empresa' || tabId === 'nova-obra' || tabId === 'admin' || tabId === 'diagnostico-projetos') {
      return isMasterAdmin;
    }
    if (isMasterAdmin) return true;
    return abasDoPerfil(effectiveRole, false).includes(tabId);
  }, [user, isMasterAdmin, effectiveRole]);

  const contextValue = useMemo(() => ({
    user,
    role,
    effectiveRole,
    isAuthenticated,
    loading,
    obras,
    empresas,
    convitesUsuario,
    activeObra,
    setActiveObra,
    addEmpresa,
    updateEmpresa,
    updateEmpresaLogo,
    deleteEmpresa,
    addObra,
    updateObra,
    updateObraFotoCapa,
    deleteObra,
    setObraArquivada,
    refreshObras,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    canAccessTab,
    canAccessObra,
    getUserObras,
    getRoleForObra,
    isAdmin,
    isMasterAdmin,
    canViewFinancials,
    isCorretor
  }), [
    user, role, effectiveRole, isAuthenticated, loading, obras, empresas, convitesUsuario,
    activeObra, canAccessTab, canAccessObra, setActiveObra, getRoleForObra, isAdmin, isMasterAdmin, canViewFinancials, isCorretor
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
