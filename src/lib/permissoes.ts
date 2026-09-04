import type { TabId, UserRole } from '../types';

/** Abas da obra liberadas por perfil (exceto administrador, que vê todas). */
export const ABAS_DA_OBRA: TabId[] = [
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
];

const ABAS_INVESTIDOR: TabId[] = [...ABAS_DA_OBRA];

const ABAS_CLIENTE: TabId[] = [
  'resumo',
  'andamento',
  'acompanhamento',
  'documentos',
  'portfolio'
];

const ABAS_CORRETOR: TabId[] = [
  'resumo',
  'andamento',
  'acompanhamento',
  'mapa',
  'vendas',
  'portfolio'
];

export function abasDoPerfil(role: UserRole, isAdmin = false): TabId[] {
  if (isAdmin) return [...ABAS_DA_OBRA];
  switch (role) {
    case 'PROPRIETARIO_INVESTIDOR':
    case 'INVESTIDOR':
    case 'GESTOR':
    case 'ENGENHEIRO':
    case 'CONSULTOR':
      return ABAS_INVESTIDOR;
    case 'CORRETOR':
      return ABAS_CORRETOR;
    case 'CLIENTE_COMPRADOR':
      return ABAS_CLIENTE;
    default:
      return ['resumo', 'andamento', 'portfolio'];
  }
}

/**
 * O convidado só recebe aviso do que a aba dele consegue abrir.
 * fotos/andamento → cliente, corretor e investidor
 * documento → cliente e investidor (corretor não tem Documentos)
 * lote → corretor e investidor (cliente não tem Mapa)
 * diario/medicao → só quem vê financeiro
 */
export function perfilPodeVerNotificacao(tipo: string | undefined, role: UserRole, isAdmin = false): boolean {
  if (isAdmin) return true;
  const t = (tipo || 'geral').toLowerCase();
  const abas = abasDoPerfil(role, isAdmin);

  if (t === 'fotos' || t === 'andamento' || t === 'geral') {
    return abas.includes('acompanhamento') || abas.includes('andamento') || abas.includes('resumo');
  }
  if (t === 'documento') return abas.includes('documentos');
  if (t === 'lote') return abas.includes('mapa');
  if (t === 'diario' || t === 'medicao') {
    return role === 'PROPRIETARIO_INVESTIDOR' || role === 'INVESTIDOR' || role === 'GESTOR' || role === 'ENGENHEIRO' || role === 'CONSULTOR';
  }
  return false;
}
