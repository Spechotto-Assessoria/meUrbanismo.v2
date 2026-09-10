import { apiService } from '../../services/supabase';
import { progressoPonderado } from '../andamento';
import type { GerarRelatorioParams, DadosRelatorio } from './tipos';

function inPeriodo(dataRef: string | undefined, inicio: string, fim: string): boolean {
  if (!dataRef) return true;
  const chave = dataRef.slice(0, 7);
  return chave >= inicio && chave <= fim;
}

export async function fetchDadosRelatorio(params: GerarRelatorioParams): Promise<DadosRelatorio> {
  const { obra, tipo, titulo, periodoInicio, periodoFim, incluiFinanceiro, logoEmpresaUrl, empresaNome } = params;
  const obraId = obra.id;

  const [orcamentos, andamento, cronograma, diariosRaw, fotosRaw] = await Promise.all([
    apiService.getOrcamentos(obraId),
    apiService.getAndamento(obraId),
    apiService.getCronograma(obraId),
    apiService.getDiarios(obraId),
    apiService.getFotos(obraId)
  ]);

  const etapaIds = orcamentos.map((o) => o.id);
  const cronogramaMeses = etapaIds.length ? await apiService.getCronogramaMeses(etapaIds) : [];

  const cronogramaFiltrado = cronograma.filter((c) =>
    inPeriodo(c.mes_ano || c.mes, periodoInicio, periodoFim)
  );

  const diarios = diariosRaw.filter((d) => inPeriodo(d.data, periodoInicio, periodoFim));
  const fotos = fotosRaw.filter((f) => inPeriodo(f.data_registro, periodoInicio, periodoFim));

  const totalOrcado = orcamentos.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0);
  const totalExecutado = orcamentos.reduce((acc, item) => acc + (Number(item.valor_executado) || 0), 0);

  return {
    obra,
    tipo,
    titulo,
    periodoInicio,
    periodoFim,
    incluiFinanceiro,
    dataEmissao: new Date().toISOString(),
    logoEmpresaUrl,
    empresaNome,
    orcamentos,
    andamento,
    cronograma: cronogramaFiltrado,
    cronogramaMeses,
    diarios,
    fotos,
    geralPrevisto: progressoPonderado(andamento, 'previsto'),
    geralRealizado: progressoPonderado(andamento, 'realizado'),
    totalOrcado,
    totalExecutado
  };
}

export async function urlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function preloadImagensRelatorio(
  logoEmpresaUrl: string | null | undefined,
  fotosUrls: string[],
  limite = 6
): Promise<{ logoMeUrbanismo?: string; logoEmpresa?: string; fotos: string[] }> {
  const logoMeUrbanismo =
    (await urlToDataUri(`${window.location.origin}/logo-meurbanismo.png`)) || undefined;
  const logoEmpresa = logoEmpresaUrl ? (await urlToDataUri(logoEmpresaUrl)) || undefined : undefined;
  const fotos: string[] = [];
  for (const url of fotosUrls.slice(0, limite)) {
    const dataUri = await urlToDataUri(url);
    if (dataUri) fotos.push(dataUri);
  }
  return { logoMeUrbanismo, logoEmpresa, fotos };
}
