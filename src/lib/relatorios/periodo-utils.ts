import {
  endOfMonth,
  format,
  lastDayOfMonth,
  startOfMonth,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Normaliza para YYYY-MM-DD. */
export function normalizarData(valor: string): string {
  return valor.slice(0, 10);
}

/** Intervalo padrão: primeiro ao último dia do mês anterior. */
export function periodoMesAnteriorPadrao(): { inicio: string; fim: string } {
  const ref = subMonths(new Date(), 1);
  return {
    inicio: format(startOfMonth(ref), 'yyyy-MM-dd'),
    fim: format(endOfMonth(ref), 'yyyy-MM-dd')
  };
}

/** Intervalo do mês corrente (primeiro ao último dia). */
export function periodoMesAtual(): { inicio: string; fim: string } {
  const ref = new Date();
  return {
    inicio: format(startOfMonth(ref), 'yyyy-MM-dd'),
    fim: format(endOfMonth(ref), 'yyyy-MM-dd')
  };
}

export function periodoValido(inicio: string, fim: string): boolean {
  return normalizarData(inicio) <= normalizarData(fim);
}

export function parseDataIso(valor: string): Date {
  return new Date(`${normalizarData(valor)}T12:00:00`);
}

export function formatarDataCurta(valor: string): string {
  return format(parseDataIso(valor), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatarIntervalo(inicio: string, fim: string): string {
  const ini = normalizarData(inicio);
  const fin = normalizarData(fim);
  if (ini === fin) return formatarDataCurta(ini);
  return `${formatarDataCurta(ini)} — ${formatarDataCurta(fin)}`;
}

/** Chaves YYYY-MM para overlap de cronograma. */
export function mesesNoIntervalo(inicio: string, fim: string): { ini: string; fim: string } {
  const ini = normalizarData(inicio).slice(0, 7);
  const fin = normalizarData(fim).slice(0, 7);
  return { ini, fim };
}

export function ultimoDiaDoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split('-').map(Number);
  const ultimo = lastDayOfMonth(new Date(ano, mes - 1, 1));
  return format(ultimo, 'yyyy-MM-dd');
}
