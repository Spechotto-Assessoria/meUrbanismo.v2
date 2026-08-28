import React, { createContext, useContext, useState } from 'react';
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
  canAccessTab: (tabId: TabId) => boolean;
  isAdmin: boolean;
  canViewFinancials: boolean;
  isCorretor: boolean;
}

const MOCK_USER: User = {
  id: 'usr_1',
  nome: 'Administrador',
  email: 'admin@meurbanismo.com.br',
  role: 'ADMINISTRADOR',
  avatar_url: '/logo-meurbanismo.png'
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
    foto_capa: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>(MOCK_USER);
  const [role, setRole] = useState<UserRole>('ADMINISTRADOR');
  const [empresas, setEmpresas] = useState<Empresa[]>(MOCK_EMPRESAS);
  const [obras, setObras] = useState<Obra[]>(MOCK_OBRAS);
  const [activeObra, setActiveObraState] = useState<Obra | null>(MOCK_OBRAS[0]);

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

  // Mapeia roles simplificadas (usadas no simulador de perfil) para roles internas
  const switchRole = (newRole: SwitchRoleParam) => {
    const roleMap: Record<SwitchRoleParam, UserRole> = {
      admin: 'ADMINISTRADOR',
      investidor: 'PROPRIETARIO_INVESTIDOR',
      corretor: 'CORRETOR',
      cliente: 'CLIENTE_COMPRADOR'
    };
    setRole(roleMap[newRole]);
  };

  const isAdmin = role === 'ADMINISTRADOR';
  const canViewFinancials = role === 'ADMINISTRADOR' || role === 'PROPRIETARIO_INVESTIDOR';
  const isCorretor = role === 'CORRETOR' || role === 'ADMINISTRADOR';

  const canAccessTab = (tabId: TabId): boolean => {
    if (tabId === 'dashboard' || tabId === 'nova-empresa' || tabId === 'nova-obra') return true;

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
        empresas,
        activeObra,
        setActiveObra,
        addEmpresa,
        addObra,
        switchRole,
        canAccessTab,
        isAdmin,
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