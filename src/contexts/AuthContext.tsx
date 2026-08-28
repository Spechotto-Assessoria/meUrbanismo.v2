import React, { createContext, useContext, useState } from 'react';
import { User, UserRole, Obra, TabId } from '../types';

interface AuthContextType {
  user: User;
  role: UserRole;
  obras: Obra[];
  activeObra: Obra | null;
  setActiveObra: (obra: Obra | null) => void;
  switchRole: (newRole: 'admin' | 'investidor' | 'corretor' | 'cliente') => void;
  canAccessTab: (tabId: TabId) => boolean;
}

const MOCK_USER: User = {
  id: 'usr_1',
  nome: 'Rennan Spechotto',
  email: 'rennan_seidl@hotmail.com',
  role: 'ADMINISTRADOR',
  avatar_url: '/logo-meurbanismo.png'
};

const MOCK_OBRAS: Obra[] = [
  {
    id: 'obra-001',
    nome: 'Residencial Reserva dos Ipês',
    cidade: 'Mirassol',
    uf: 'SP',
    tipo: 'Loteamento Fechado',
    foto_capa: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
  },
  {
    id: 'obra-002',
    nome: 'Villa Bella Urban Park',
    cidade: 'São José do Rio Preto',
    uf: 'SP',
    tipo: 'Loteamento Aberto',
    foto_capa: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>(MOCK_USER);
  const [role, setRole] = useState<UserRole>('ADMINISTRADOR');
  const [obras] = useState<Obra[]>(MOCK_OBRAS);
  const [activeObra, setActiveObraState] = useState<Obra | null>(MOCK_OBRAS[0]);

  // TRATAMENTO SEGURO DE ATRIBUIÇÃO DE OBRA
  const setActiveObra = (obra: Obra | null) => {
    if (!obra) {
      setActiveObraState(null);
      return;
    }
    setActiveObraState(obra);
  };

  const switchRole = (newRole: 'admin' | 'investidor' | 'corretor' | 'cliente') => {
    switch (newRole) {
      case 'admin':
        setRole('ADMINISTRADOR');
        break;
      case 'investidor':
        setRole('PROPRIETARIO_INVESTIDOR');
        break;
      case 'corretor':
        setRole('CORRETOR');
        break;
      case 'cliente':
        setRole('CLIENTE_COMPRADOR');
        break;
    }
  };

  const canAccessTab = (tabId: TabId): boolean => {
    if (tabId === 'dashboard') return true;

    switch (role) {
      case 'ADMINISTRADOR':
        return true;
      case 'PROPRIETARIO_INVESTIDOR':
        return ['andamento', 'orcamento', 'cronograma', 'viabilidade', 'acompanhamento', 'documentos', 'relatorios', 'mapa', 'vendas'].includes(tabId);
      case 'CORRETOR':
        return ['andamento', 'vendas', 'mapa', 'documentos', 'acompanhamento'].includes(tabId);
      case 'CLIENTE_COMPRADOR':
        return ['andamento', 'mapa', 'documentos', 'acompanhamento'].includes(tabId);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        obras,
        activeObra,
        setActiveObra,
        switchRole,
        canAccessTab
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