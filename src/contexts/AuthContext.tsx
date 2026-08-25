import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Obra, TabId } from '../types';
import { MOCK_USERS_PERFIS, MOCK_OBRAS } from '../services/mockData';
import { apiService } from '../services/supabase';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  obras: Obra[];
  activeObra: Obra | null;
  setActiveObra: (obra: Obra) => void;
  switchRole: (roleKey: 'admin' | 'investidor' | 'corretor' | 'cliente') => void;
  canAccessTab: (tabId: TabId) => boolean;
  isAdmin: boolean;
  isInvestidor: boolean;
  isCorretor: boolean;
  isCliente: boolean;
  canViewFinancials: boolean;
  canEditObra: boolean;
  canManageUsers: boolean;
  canToggleVisibility: boolean;
  refreshObras: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserKey, setCurrentUserKey] = useState<'admin' | 'investidor' | 'corretor' | 'cliente'>(() => {
    return (localStorage.getItem('meurbanismo_active_role_key') as any) || 'admin';
  });

  const [user, setUser] = useState<UserProfile>(MOCK_USERS_PERFIS[currentUserKey]);
  const [obras, setObras] = useState<Obra[]>(MOCK_OBRAS);
  const [activeObra, setActiveObraState] = useState<Obra | null>(MOCK_OBRAS[0]);

  const loadObras = async () => {
    const list = await apiService.getObras();
    if (list && list.length > 0) {
      setObras(list);
      const savedActiveId = localStorage.getItem('meurbanismo_active_obra_id');
      const found = list.find(o => o.id === savedActiveId) || list[0];
      setActiveObraState(found);
    }
  };

  useEffect(() => {
    loadObras();
  }, []);

  const setActiveObra = (obra: Obra) => {
    setActiveObraState(obra);
    localStorage.setItem('meurbanismo_active_obra_id', obra.id);
  };

  const switchRole = (roleKey: 'admin' | 'investidor' | 'corretor' | 'cliente') => {
    setCurrentUserKey(roleKey);
    const selectedProfile = MOCK_USERS_PERFIS[roleKey];
    setUser(selectedProfile);
    localStorage.setItem('meurbanismo_active_role_key', roleKey);
  };

  const role = user.role;
  const isAdmin = role === 'ADMINISTRADOR';
  const isInvestidor = role === 'PROPRIETARIO_INVESTIDOR';
  const isCorretor = role === 'CORRETOR';
  const isCliente = role === 'CLIENTE_COMPRADOR';

  // Matriz de Acessos Estrita por Perfil
  const canAccessTab = (tabId: TabId): boolean => {
    switch (tabId) {
      case 'andamento':
        return true; // Todos os 4 perfis
      case 'acompanhamento':
        return true; // Todos (com filtros de visualização nas fotos e diários)
      case 'documentos':
        return true; // Todos (com filtro visivel_convidados para Corretor e Cliente)
      case 'orcamento':
        return isAdmin || isInvestidor; // Bloqueado para Corretor e Cliente
      case 'cronograma':
        return isAdmin || isInvestidor; // Bloqueado para Corretor e Cliente
      case 'viabilidade':
        return isAdmin || isInvestidor; // Bloqueado para Corretor e Cliente
      case 'mapa':
        return true; // Todos os 4 perfis
      case 'vendas':
        return isAdmin || isInvestidor || isCorretor; // Bloqueado para Cliente
      case 'relatorios':
        return isAdmin || isInvestidor; // Bloqueado para Corretor e Cliente
      case 'admin':
        return isAdmin; // Exclusivo do Administrador
      default:
        return false;
    }
  };

  const canViewFinancials = isAdmin || isInvestidor;
  const canEditObra = isAdmin;
  const canManageUsers = isAdmin;
  const canToggleVisibility = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        obras,
        activeObra,
        setActiveObra,
        switchRole,
        canAccessTab,
        isAdmin,
        isInvestidor,
        isCorretor,
        isCliente,
        canViewFinancials,
        canEditObra,
        canManageUsers,
        canToggleVisibility,
        refreshObras: loadObras,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
