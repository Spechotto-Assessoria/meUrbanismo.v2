import { apiService } from '../../services/supabase';
import { progressoPonderado } from '../andamento';
import { monthLabel, type PontoCurvaS } from '../cronograma';
import type { CronogramaItem } from '../../types';
import type { GerarRelatorioParams, DadosRelatorio } from './tipos';
import {
  contarLotesPorStatus,
  filtrarCronogramaPeriodo,
  filtrarDiarios,
  filtrarFotos,
  filtrarMedicoes,
  filtrarVendasLotes
} from './fetch/periodoFiltros';
import { fetchViabilidadeDados } from './fetch/fetchViabilidadeDados';

function cronogramaParaCurvaS(cronograma: CronogramaItem[]): PontoCurvaS[] {
  return cronograma.map((c) => {
    const mesKey = c.mes_ano || c.mes || '';
    return {
      mesKey,
      month: c.mes_label || monthLabel(mesKey) || mesKey,
      Mensal: Number(c.percentual_realizado_mes) || 0,
      Acumulado: Number(c.percentual_realizado_acumulado) || 0,
      valorMes: Number(c.valor_realizado_mes) || 0,
      valorAcum: Number(c.valor_realizado_acumulado) || 0
    };
  });
}

export async function fetchDadosRelatorio(params: GerarRelatorioParams): Promise<DadosRelatorio> {
  const {
    obra,
    tipo,
    titulo,
    periodoInicio,
    periodoFim,
    incluiFinanceiro,
    todosPeriodos = false,
    modoVendas = 'acumulado',
    empresaNome
  } = params;
  const obraId = obra.id;

  const precisaViabilidade = tipo === 'viabilidade' || tipo === 'global';
  const precisaLotes = tipo === 'mapa_lotes' || tipo === 'global';
  const precisaAcompanhamento = tipo === 'acompanhamento' || tipo === 'global';
  const precisaMedicoes = precisaAcompanhamento;

  const [orcamentos, andamento, cronogramaRaw, diariosRaw, fotosRaw, medicoesRaw, lotesRaw, viabilidade] =
    await Promise.all([
      apiService.getOrcamentos(obraId),
      apiService.getAndamento(obraId),
      apiService.getCronograma(obraId),
      precisaAcompanhamento ? apiService.getDiarios(obraId) : Promise.resolve([]),
      precisaAcompanhamento ? apiService.getFotos(obraId) : Promise.resolve([]),
      precisaMedicoes ? apiService.getMedicoes(obraId) : Promise.resolve([]),
      precisaLotes ? apiService.getLotes(obraId) : Promise.resolve([]),
      precisaViabilidade ? fetchViabilidadeDados(obraId, obra) : Promise.resolve(null)
    ]);

  const etapaIds = orcamentos.map((o) => o.id);
  const cronogramaMeses = etapaIds.length ? await apiService.getCronogramaMeses(etapaIds) : [];

  const cronograma = [...cronogramaRaw].sort((a, b) =>
    (a.mes_ano || a.mes || '').localeCompare(b.mes_ano || b.mes || '')
  );
  const cronogramaPeriodo = filtrarCronogramaPeriodo(cronograma, periodoInicio, periodoFim);

  const diarios = filtrarDiarios(diariosRaw, periodoInicio, periodoFim, todosPeriodos);
  const fotos = filtrarFotos(fotosRaw, periodoInicio, periodoFim, todosPeriodos);
  const medicoes = filtrarMedicoes(medicoesRaw, periodoInicio, periodoFim, todosPeriodos);
  const lotes = lotesRaw;
  const modoVendasEfetivo = todosPeriodos ? 'acumulado' : modoVendas;
  const vendasPeriodo = filtrarVendasLotes(lotes, periodoInicio, periodoFim, modoVendasEfetivo);

  const totalOrcado = orcamentos.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0);
  const totalExecutado = orcamentos.reduce((acc, item) => acc + (Number(item.valor_executado) || 0), 0);

  return {
    obra,
    tipo,
    titulo,
    periodoInicio,
    periodoFim,
    incluiFinanceiro,
    todosPeriodos,
    modoVendas,
    dataEmissao: new Date().toISOString(),
    empresaNome,
    orcamentos,
    andamento,
    cronograma,
    cronogramaPeriodo,
    cronogramaMeses,
    chartCurvaS: cronogramaParaCurvaS(cronograma),
    diarios,
    fotos,
    medicoes,
    lotes,
    vendasPeriodo,
    contagemLotes: contarLotesPorStatus(lotes),
    viabilidade,
    geralPrevisto: progressoPonderado(andamento, 'previsto'),
    geralRealizado: progressoPonderado(andamento, 'realizado'),
    totalOrcado,
    totalExecutado,
    totalOrcadoResumo: totalOrcado > 0 ? totalOrcado : Number(obra.custo_orcado) || 0
  };
}
