import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Obra, Empresa, TabId } from '../types';
import { apiService } from '../services/supabase';

export interface AuthContextType {
  user: User | null;
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  obras: Obra[];
  empresas: Empresa[];
  role: UserRole;
  isAdmin: boolean;
  isCorretor: boolean;
  isPublicView: boolean;
  canViewFinancials: boolean;
  canAccessTab: (tabId: TabId) => boolean;
  switchRole: (newRole: UserRole) => void;
  addObra: (obra: Omit<Obra, 'id'>) => Promise<Obra>;
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => Promise<Empresa>;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeObra, setActiveObra] = useState<Obra | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMINISTRADOR');

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      const [obrasData, empresasData, usersData] = await Promise.all([
        apiService.getObras(),
        apiService.getEmpresas(),
        apiService.getUsers()
      ]);

      setObras(obrasData);
      setEmpresas(empresasData);

      if (obrasData.length > 0) {
        setActiveObra(obrasData[0]);
      }
      if (usersData.length > 0) {
        setUser(usersData[0]);
        setCurrentRole(usersData[0].role || 'ADMINISTRADOR');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do contexto de autenticação:', error);
    }
  };

  const role: UserRole = currentRole || user?.role || 'ADMINISTRADOR';
  const isAdmin = role === 'ADMINISTRADOR';
  const isCorretor = role === 'CORRETOR';
  const isPublicView = role === 'CLIENTE_COMPRADOR' || role === 'PROPRIETARIO_INVESTIDOR';
  const canViewFinancials = role === 'ADMINISTRADOR' || role === 'PROPRIETARIO_INVESTIDOR';

  const canAccessTab = (tabId: TabId): boolean => {
    if (isAdmin) return true;
    switch (tabId) {
      case 'dashboard':
      case 'andamento':
      case 'cronograma':
      case 'acompanhamento':
      case 'documentos':
      case 'relatorios':
        return true;
      case 'mapa':
      case 'vendas':
        return role !== 'CLIENTE_COMPRADOR';
      case 'orcamento':
      case 'viabilidade':
        return canViewFinancials;
      case 'admin':
      case 'nova-empresa':
      case 'nova-obra':
        return isAdmin;
      default:
        return true;
    }
  };

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const addObra = async (novaObraData: Omit<Obra, 'id'>): Promise<Obra> => {
    const criada = await apiService.saveObra(novaObraData);
    const atualizadas = await apiService.getObras();
    setObras(atualizadas);
    setActiveObra(criada);
    return criada;
  };

  const addEmpresa = async (novaEmpresaData: Omit<Empresa, 'id'>): Promise<Empresa> => {
    const criada = await apiService.saveEmpresa(novaEmpresaData);
    const atualizadas = await apiService.getEmpresas();
    setEmpresas(atualizadas);
    return criada;
  };

  const login = async (email: string): Promise<boolean> => {
    const usersData = await apiService.getUsers();
    const found = usersData.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      setCurrentRole(found.role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeObra,
        setActiveObra,
        obras,
        empresas,
        role,
        isAdmin,
        isCorretor,
        isPublicView,
        canViewFinancials,
        canAccessTab,
        switchRole,
        addObra,
        addEmpresa,
        login,
        logout
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