import type { CronogramaItem, DiarioObra, FotoObra, Lote, MedicaoItem } from '../../../types';
import { normalizeStatus } from '../../loteMapa';

export function inPeriodo(dataRef: string | undefined, inicio: string, fim: string): boolean {
  if (!dataRef) return true;
  const chave = dataRef.slice(0, 7);
  return chave >= inicio && chave <= fim;
}

export function medicaoNoPeriodo(m: MedicaoItem, inicio: string, fim: string): boolean {
  const ini = m.periodo_inicio?.slice(0, 7);
  const fimMed = m.periodo_fim?.slice(0, 7) || ini;
  const ref = ini || m.periodo_referencia?.slice(0, 7) || m.data_medicao?.slice(0, 7);
  if (!ref) return true;
  const medIni = ini || ref;
  const medFim = fimMed || ref;
  return medIni <= fim && medFim >= inicio;
}

export function filtrarCronogramaPeriodo(cronograma: CronogramaItem[], inicio: string, fim: string): CronogramaItem[] {
  return cronograma.filter((c) => inPeriodo(c.mes_ano || c.mes, inicio, fim));
}

export function filtrarDiarios(diarios: DiarioObra[], inicio: string, fim: string, todos: boolean): DiarioObra[] {
  if (todos) return diarios;
  return diarios.filter((d) => inPeriodo(d.data, inicio, fim));
}

export function filtrarFotos(fotos: FotoObra[], inicio: string, fim: string, todos: boolean): FotoObra[] {
  if (todos) return fotos;
  return fotos.filter((f) => inPeriodo(f.data_registro, inicio, fim));
}

export function filtrarMedicoes(medicoes: MedicaoItem[], inicio: string, fim: string, todos: boolean): MedicaoItem[] {
  if (todos) return medicoes;
  return medicoes.filter((m) => medicaoNoPeriodo(m, inicio, fim));
}

export function filtrarVendasLotes(
  lotes: Lote[],
  inicio: string,
  fim: string,
  modo: 'periodo' | 'acumulado'
): Lote[] {
  const vendidos = lotes.filter((l) => normalizeStatus(l.status) === 'vendido');
  if (modo === 'acumulado') return vendidos;
  return vendidos.filter((l) => inPeriodo(l.data_venda, inicio, fim));
}

export function contarLotesPorStatus(lotes: Lote[]) {
  let disponivel = 0;
  let reservado = 0;
  let vendido = 0;
  for (const l of lotes) {
    const s = normalizeStatus(l.status);
    if (s === 'vendido') vendido += 1;
    else if (s === 'reservado') reservado += 1;
    else disponivel += 1;
  }
  return { disponivel, reservado, vendido, total: lotes.length };
}
