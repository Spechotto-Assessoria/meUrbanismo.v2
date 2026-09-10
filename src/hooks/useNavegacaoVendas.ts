import { useCallback } from 'react';
import type { TabId } from '../types';

const PARAM_LOTE = 'loteId';

/** Lê o loteId da query string da URL atual. */
export function lerLoteIdDaUrl(): string | undefined {
  const id = new URLSearchParams(window.location.search).get(PARAM_LOTE);
  return id?.trim() || undefined;
}

/** Remove o parâmetro loteId da URL sem recarregar a página. */
export function limparLoteIdDaUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM_LOTE);
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

function gravarLoteIdNaUrl(loteId?: string): void {
  const url = new URL(window.location.href);
  if (loteId) {
    url.searchParams.set(PARAM_LOTE, loteId);
  } else {
    url.searchParams.delete(PARAM_LOTE);
  }
  window.history.pushState({}, '', url.pathname + url.search + url.hash);
}

/**
 * Ponte de navegação Mapa → Vendas até migração para TanStack Router.
 * Grava loteId na URL e troca a aba ativa.
 */
export function useNavegacaoVendas(onTabChange: (tab: TabId) => void) {
  const navegarParaVendas = useCallback(
    (loteId?: string) => {
      gravarLoteIdNaUrl(loteId);
      onTabChange('vendas');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [onTabChange]
  );

  return { navegarParaVendas, lerLoteIdDaUrl, limparLoteIdDaUrl };
}
