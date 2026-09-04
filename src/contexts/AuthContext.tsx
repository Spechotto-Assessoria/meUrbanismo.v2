import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, Obra, Empresa, TabId, User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { dataService } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  obras: Obra[];
  empresas: Empresa[];
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
  isAdmin: boolean;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
  isCorretor: boolean;
}

const MASTER_ADMIN_EMAIL = 'rennan.spechotto@gmail.com';
const MASTER_ADMIN_EMAIL_ALT = 'rennan_seidl@hotmail.com';

const AUTH_STORAGE_KEY = 'meurbanismo_auth_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

const isMasterEmail = (email?: string | null): boolean => {
  const clean = (email || '').toLowerCase().trim();
  return clean === MASTER_ADMIN_EMAIL || clean === MASTER_ADMIN_EMAIL_ALT;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // IMPORTANTE: o estado de usuário NUNCA deve ser inicializado a partir de dados
  // brutos do localStorage. Esse blob não é assinado nem verificado pelo servidor,
  // então um usuário poderia editá-lo via DevTools (ex.: setar role: 'ADMINISTRADOR')
  // e escalar privilégios instantaneamente. O usuário só é considerado autenticado
  // após a confirmação de uma sessão real junto ao Supabase (ver initAuth abaixo),
  // e o PAPEL (role) é sempre lido da tabela "perfis" no banco — nunca de um valor
  // que o próprio cliente possa forjar (como user_metadata, que é editável pelo
  // usuário via supabase.auth.updateUser()).
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [activeObra, setActiveObraState] = useState<Obra | null>(null);

  /**
   * Busca o papel (role) real do usuário na tabela public.perfis — fonte da
   * verdade protegida por RLS no banco. Nunca confia em user_metadata (que o
   * próprio usuário pode alterar via API) para conceder privilégios.
   */
  const fetchRoleFromPerfis = async (userId: string, email: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase.from('perfis').select('role').eq('id', userId).maybeSingle();
      if (!error && data && isValidRole(data.role)) {
        return data.role;
      }
    } catch (e) {
      console.error('Erro ao buscar perfil do usuário:', e);
    }
    // Fallback apenas para o instante entre o cadastro e a execução do trigger
    // de auto-provisionamento (public.handle_new_user) no banco.
    return isMasterEmail(email) ? 'ADMINISTRADOR' : 'CLIENTE_COMPRADOR';
  };

  const syncUserFromSupabase = async (sbUser: any): Promise<void> => {
    if (!sbUser) {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const email = sbUser.email || '';
    const userRole = await fetchRoleFromPerfis(sbUser.id, email);
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
    // Cache apenas para exibição otimista de UI (nome/avatar); nunca é usado
    // para conceder acesso — veja o comentário no initAuth abaixo.
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
  };

  // Inicialização e escuta da sessão no Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao verificar sessão Supabase:', error.message);
        }

        if (session?.user) {
          // Fonte da verdade: sessão real e válida confirmada pelo Supabase.
          await syncUserFromSupabase(session.user);
        } else {
          // Sem sessão válida no servidor: nunca reidratar o usuário a partir de
          // um blob de localStorage não verificado. Limpa qualquer resquício local
          // e exige novo login, fechando o vetor de escalonamento de privilégios.
          setUser(null);
          setRole('CLIENTE_COMPRADOR');
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
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Master Admin: e-mails fixos sempre têm acesso irrestrito total a tudo
  const isMasterAdmin = isMasterEmail(user?.email) || user?.role === 'ADMINISTRADOR';

  const isAuthenticated = Boolean(user);
  const isAdmin = isMasterAdmin;
  const canViewFinancials = isMasterAdmin || role === 'PROPRIETARIO_INVESTIDOR' || role === 'GESTOR' || role === 'ENGENHEIRO' || role === 'CONSULTOR' || role === 'INVESTIDOR';
  const isCorretor = isMasterAdmin || role === 'CORRETOR';

  /**
   * Busca as obras e empresas reais do Supabase.
   *
   * "obras" vem da view "obras_publicas": o próprio Postgres já filtra as
   * linhas conforme os convites do usuário (RLS/has_obra_access) e mascara as
   * colunas financeiras para quem não tem permissão — não é uma filtragem
   * feita aqui no cliente, então não pode ser burlada via DevTools.
   */
  const refreshObras = useCallback(async (): Promise<void> => {
    if (!user) {
      setObras([]);
      setEmpresas([]);
      return;
    }
    try {
      const [obrasData, empresasData] = await Promise.all([
        dataService.getObras(),
        dataService.getEmpresas()
      ]);
      setObras(obrasData);
      setEmpresas(empresasData);
    } catch (e) {
      console.error('Erro ao carregar obras/empresas do Supabase:', e);
    }
  }, [user]);

  useEffect(() => {
    void refreshObras();
  }, [refreshObras]);

  // Seleciona obra padrão ao logar se houver obras
  useEffect(() => {
    if (user && !activeObra && obras.length > 0) {
      setActiveObraState(obras[0]);
    }
  }, [user, obras, activeObra]);

  const setActiveObra = (obra: Obra | null) => {
    setActiveObraState(obra);
  };

  const addEmpresa = async (novaData: Omit<Empresa, 'id'>): Promise<Empresa> => {
    const novaEmpresa = await dataService.saveEmpresa(novaData);
    setEmpresas(prev => [novaEmpresa, ...prev]);
    return novaEmpresa;
  };

  const updateEmpresa = async (empresa: Empresa): Promise<Empresa> => {
    const atualizada = await dataService.saveEmpresa(empresa);
    setEmpresas(prev => prev.map(e => (e.id === atualizada.id ? atualizada : e)));
    return atualizada;
  };

  /**
   * Atualiza o logo de uma empresa já cadastrada (chamado após o upload do
   * arquivo para o Storage) e sincroniza o estado local, para que o novo
   * logo apareça imediatamente onde a lista de "empresas" é usada (ex.:
   * seletor de empresa em Nova Obra), sem precisar recarregar a página.
   */
  const updateEmpresaLogo = async (id: string, logoUrl: string): Promise<Empresa> => {
    const empresaAtualizada = await dataService.updateEmpresaLogo(id, logoUrl);
    setEmpresas(prev => prev.map(e => (e.id === id ? empresaAtualizada : e)));
    return empresaAtualizada;
  };

  const deleteEmpresa = async (id: string): Promise<void> => {
    await dataService.deleteEmpresa(id);
    setEmpresas(prev => prev.filter(e => e.id !== id));
    await refreshObras();
  };

  const addObra = async (novaData: Omit<Obra, 'id'>): Promise<Obra> => {
    const novaObra = await dataService.saveObra(novaData);
    await refreshObras();
    return novaObra;
  };

  const updateObra = async (obra: Obra): Promise<Obra> => {
    const atualizada = await dataService.saveObra(obra);
    await refreshObras();
    if (activeObra?.id === atualizada.id) {
      setActiveObraState(atualizada);
    }
    return atualizada;
  };

  const updateObraFotoCapa = async (id: string, fotoUrl: string): Promise<Obra> => {
    const atualizada = await dataService.updateObraFotoCapa(id, fotoUrl);
    await refreshObras();
    if (activeObra?.id === id) {
      setActiveObraState(atualizada);
    }
    return atualizada;
  };

  const deleteObra = async (id: string): Promise<void> => {
    await dataService.deleteObra(id);
    if (activeObra?.id === id) {
      setActiveObraState(null);
    }
    await refreshObras();
  };

  const setObraArquivada = async (id: string, arquivada: boolean): Promise<Obra> => {
    const atualizada = await dataService.setObraArquivada(id, arquivada);
    await refreshObras();
    if (arquivada && activeObra?.id === id) {
      setActiveObraState(null);
    }
    return atualizada;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !pass) return { success: false, error: 'E-mail e senha são obrigatórios.' };

    // SEGURANÇA: a autenticação é validada exclusivamente pelo Supabase Auth.
    // Não existe (e não deve existir) nenhum atalho de senha para o admin master
    // ou qualquer outro usuário — isso seria uma porta dos fundos exploravel por
    // qualquer pessoa que soubesse o e-mail do administrador. O papel de
    // ADMINISTRADOR é concedido automaticamente pela tabela "perfis" somente
    // após uma autenticação real e bem-sucedida com a senha correta.
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (error) {
        // Log detalhado apenas no console do navegador (não exposto na UI) para
        // facilitar o diagnóstico — ex.: distinguir senha errada de e-mail não
        // confirmado, sem ajudar um invasor a enumerar contas existentes.
        console.error(`[auth] Falha no login para "${email}": ${error.status || ''} ${error.message}`);

        if (/email not confirmed/i.test(error.message)) {
          return {
            success: false,
            error: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam) para o link de confirmação enviado pelo Supabase.'
          };
        }

        return { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha, ou use "Esqueci minha senha".' };
      }

      if (data.user) {
        await syncUserFromSupabase(data.user);
        return { success: true };
      }

      return { success: false, error: 'Não foi possível obter dados do usuário.' };
    } catch {
      return { success: false, error: 'Erro ao conectar ao serviço de autenticação. Tente novamente.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email) return { success: false, error: 'Informe o e-mail cadastrado.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      if (error) {
        console.error('[auth] Falha ao solicitar redefinição de senha:', error.message);
        return { success: false, error: 'Não foi possível enviar o e-mail de redefinição. Tente novamente em instantes.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar ao serviço de autenticação. Tente novamente.' };
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
            nome: nome || email.split('@')[0]
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await syncUserFromSupabase(data.user);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar usuário.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Usamos skipBrowserRedirect: true para impedir que o navegador seja redirecionado
      // automaticamente para a página de erro 400 JSON do Supabase se o provedor estiver desabilitado.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (error) {
        return {
          success: false,
          error: 'O login com Google está desativado ou não configurado neste projeto. Por favor, utilize seu e-mail e senha cadastrados.'
        };
      }

      // Se retornou a URL de autorização, verificamos se o provedor do projeto está ativo
      if (data?.url) {
        try {
          // Faz uma checagem preliminar para saber se o endpoint não responde com 400/erro de provedor
          const res = await fetch(data.url, { method: 'GET', headers: { Accept: 'text/html,application/xhtml+xml' } });
          if (!res.ok) {
            return {
              success: false,
              error: 'O login com Google está desativado ou não configurado neste projeto do Supabase. Utilize e-mail e senha.'
            };
          }
          // Se a resposta for OK (redirecionamento do Google), podemos navegar com segurança
          window.location.href = data.url;
          return { success: true };
        } catch {
          // Em caso de CORS no fetch preliminar ou erro de rede, se o Google não estiver configurado
          return {
            success: false,
            error: 'O login com Google está desativado ou não configurado neste projeto. Por favor, utilize seu e-mail e senha.'
          };
        }
      }

      return {
        success: false,
        error: 'O login com Google está desativado ou não configurado neste projeto. Utilize seu e-mail e senha.'
      };
    } catch {
      return {
        success: false,
        error: 'O login com Google está desativado ou não configurado neste projeto. Utilize e-mail e senha.'
      };
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
      setObras([]);
      setEmpresas([]);
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

  /**
   * Verifica se o usuário tem acesso à obra informada.
   *
   * IMPORTANTE: isto NÃO é a barreira de segurança real — é apenas um atalho
   * de conveniência para a UI. A lista "obras" já vem filtrada pelo Postgres
   * (RLS + has_obra_access na view "obras_publicas"), então mesmo que este
   * cálculo aqui fosse manipulado via DevTools, o servidor nunca devolveria
   * dados de uma obra não autorizada.
   */
  const canAccessObra = (obraId: string): boolean => {
    if (isMasterAdmin) return true;
    return obras.some(o => o.id === obraId);
  };

  // A lista de obras já reflete exatamente o que o usuário tem permissão de
  // ver (filtrado pelo próprio banco), então basta devolvê-la diretamente.
  const getUserObras = (): Obra[] =>
    obras.filter(o => !o.arquivada && o.status !== 'Arquivada');

  // Validação de acesso a cada uma das abas da obra e abas globais
  const canAccessTab = (tabId: TabId): boolean => {
    if (!user) return false;

    // Abas globais
    if (tabId === 'dashboard' || tabId === 'nova-empresa' || tabId === 'nova-obra' || tabId === 'empresas') {
      return isMasterAdmin;
    }

    // Administrador tem acesso total irrestrito a todas as abas
    if (isMasterAdmin) return true;

    // Menu dos módulos da Obra
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
