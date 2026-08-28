import React, { createContext, useContext, useState, useEffect } from 'react';
import { TabId, UserRole, Obra } from '../types';

interface AuthContextType {
  user: any;
  role: UserRole;
  realRole: UserRole;
  isSimulating: boolean;
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  switchRole: (newRole: UserRole) => void;
  restoreRealRole: () => void;
  canAccessTab: (tabId: TabId) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapeamento rígido de acessos por perfil
const PERMISSOES_POR_PERFIL: Record<string, TabId[]> = {
  ADMINISTRADOR: [
    'dashboard', 'andamento', 'orcamento', 'cronograma', 'acompanhamento',
    'documentos', 'viabilidade', 'mapa', 'vendas', 'relatorios', 'admin',
    'nova-empresa', 'nova-obra'
  ],
  INVESTIDOR: [
    'dashboard', 'orcamento', 'cronograma', 'viabilidade', 'relatorios'
  ],
  PROPRIETARIO: [
    'dashboard', 'orcamento', 'cronograma', 'viabilidade', 'relatorios'
  ],
  CORRETOR: [
    'dashboard', 'mapa', 'vendas', 'documentos'
  ],
  CLIENTE: [
    'dashboard', 'andamento', 'documentos'
  ],
  ENGENHEIRO: [
    'dashboard', 'andamento', 'cronograma', 'acompanhamento', 'documentos'
  ],
  GESTOR: [
    'dashboard', 'andamento', 'orcamento', 'cronograma', 'acompanhamento',
    'documentos', 'viabilidade', 'mapa', 'vendas', 'relatorios'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dados do usuário logado (padrão Administrador para o seu e-mail)
  const [user] = useState({
    email: 'rennan.spechotto@gmail.com',
    nome: 'Spechotto'
  });

  const [realRole] = useState<UserRole>('ADMINISTRADOR');
  const [activeRole, setActiveRole] = useState<UserRole>('ADMINISTRADOR');
  const [activeObra, setActiveObra] = useState<Obra | null>(null);

  // Troca de perfil (simulação pelo Administrador)
  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  // Volta para o perfil real de Administrador
  const restoreRealRole = () => {
    setActiveRole(realRole);
  };

  // Validação estrita de permissão por aba
  const canAccessTab = (tabId: TabId): boolean => {
    if (activeRole === 'ADMINISTRADOR') return true;
    
    const permissoes = PERMISSOES_POR_PERFIL[activeRole] || ['dashboard'];
    return permissoes.includes(tabId);
  };

  const isSimulating = activeRole !== realRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole,
        realRole,
        isSimulating,
        activeObra,
        setActiveObra,
        switchRole,
        restoreRealRole,
        canAccessTab,
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