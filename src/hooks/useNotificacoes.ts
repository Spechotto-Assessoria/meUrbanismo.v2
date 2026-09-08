import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { dataService } from '../services/supabase';
import type { Notificacao, TabId, UserRole } from '../types';
import { perfilPodeVerNotificacao } from '../lib/permissoes';

const PERMISSAO_PUSH_KEY = 'meurbanismo_push_asked_v1';

function podeUsarNotificationApi(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function exibirPushSistema(titulo: string, corpo: string) {
  if (!podeUsarNotificationApi()) return;
  if (Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
  try {
    new Notification(titulo, {
      body: corpo,
      icon: '/logo-meurbanismo.png',
      badge: '/logo-meurbanismo.png',
      tag: `meurbanismo-${titulo}`
    });
  } catch {
    // Navegadores sem suporte a Notification constructor (ex.: alguns WebViews).
  }
}

export function tabDestinoNotificacao(tipo?: string): TabId {
  switch (tipo) {
    case 'fotos':
      return 'acompanhamento';
    case 'documento':
      return 'documentos';
    case 'andamento':
      return 'andamento';
    case 'diario':
    case 'medicao':
      return 'acompanhamento';
    case 'lote':
      return 'mapa';
    default:
      return 'resumo';
  }
}

export type SubAbaAcompanhamento = 'fotos' | 'diario' | 'medicoes';

export function subAbaDestinoNotificacao(tipo?: string): SubAbaAcompanhamento {
  if (tipo === 'diario') return 'diario';
  if (tipo === 'medicao') return 'medicoes';
  return 'fotos';
}

export function tempoRelativo(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

export function useNotificacoes(email?: string | null, role?: UserRole | null, isAdmin = false) {
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const emailRef = useRef(email);
  const roleRef = useRef(role);
  const adminRef = useRef(isAdmin);

  emailRef.current = email;
  roleRef.current = role;
  adminRef.current = isAdmin;

  const permitido = useCallback((n: Notificacao) => {
    if (!roleRef.current) return false;
    return perfilPodeVerNotificacao(n.tipo, roleRef.current, adminRef.current);
  }, []);

  const carregar = useCallback(async () => {
    if (!emailRef.current) {
      setItens([]);
      return;
    }
    setCarregando(true);
    const lista = await dataService.getNotificacoes();
    setItens(lista.filter(permitido));
    setCarregando(false);
  }, [permitido]);

  useEffect(() => {
    if (!email) {
      setItens([]);
      return;
    }

    void carregar();

    const canal = supabase
      .channel(`notificacoes-${email.toLowerCase()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes' },
        payload => {
          const row = (payload.new || payload.old) as Notificacao | undefined;
          if (!row) return;
          if (row.destinatario_email?.toLowerCase() !== email.toLowerCase()) return;

          if (payload.eventType === 'DELETE') {
            setItens(prev => prev.filter(n => n.id !== row.id));
            return;
          }

          const atual = payload.new as Notificacao;
          if (!permitido(atual)) return;

          setItens(prev => {
            const sem = prev.filter(n => n.id !== atual.id);
            return [atual, ...sem].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (!atual.lida) {
              exibirPushSistema(atual.titulo, atual.mensagem);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [email, carregar, permitido]);

  const pedirPermissaoPush = useCallback(async () => {
    if (!podeUsarNotificationApi()) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(PERMISSAO_PUSH_KEY) === '1') return;
    localStorage.setItem(PERMISSAO_PUSH_KEY, '1');
    const resultado = await Notification.requestPermission();
    if (resultado === 'granted') {
      const tokenWeb = `web:${emailRef.current || 'anon'}:${Date.now()}`;
      await dataService.registrarDispositivoPush(tokenWeb, 'web');
    }
  }, []);

  const marcarLida = useCallback(async (id: string) => {
    setItens(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true, lida_em: new Date().toISOString() } : n))
    );
    await dataService.marcarNotificacaoLida(id);
  }, []);

  const marcarTodas = useCallback(async () => {
    setItens(prev => prev.map(n => ({ ...n, lida: true, lida_em: new Date().toISOString() })));
    await dataService.marcarTodasNotificacoesLidas();
  }, []);

  const naoLidas = itens.filter(n => !n.lida).length;

  return {
    itens,
    carregando,
    naoLidas,
    carregar,
    marcarLida,
    marcarTodas,
    pedirPermissaoPush
  };
}
