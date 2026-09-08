/** Fallbacks quando as APIs públicas do BCB não respondem. */
export const IPCA_FALLBACK_AM = 0.4;
export const INCC_FALLBACK_AM = 0.5;

export type IndicesEconomicos = {
  ipcaAm: number;
  inccAm: number;
  ipcaFonte: 'focus' | 'sgs' | 'fallback';
  inccFonte: 'sgs' | 'fallback';
  atualizadoEm: string | null;
};

const FOCUS_IPCA =
  'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoInflacao12Meses' +
  "?$top=1&$format=json&$orderby=Data desc&$filter=Indicador eq 'IPCA' and baseCalculo eq 0";
const SGS_IPCA = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json';
const SGS_INCC = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/12?formato=json';

type SgsPonto = { data: string; valor: string };
type FocusResp = { value?: { Mediana?: number; Data?: string }[] };

let cache: IndicesEconomicos | null = null;
let pending: Promise<IndicesEconomicos> | null = null;

function arred2(n: number) {
  return Math.round(n * 100) / 100;
}

function anualParaMensal(aaPct: number) {
  return (Math.pow(1 + aaPct / 100, 1 / 12) - 1) * 100;
}

function mediaGeometricaAm(pcts: number[]) {
  if (!pcts.length) return null;
  const prod = pcts.reduce((acc, p) => acc * (1 + p / 100), 1);
  return (Math.pow(prod, 1 / pcts.length) - 1) * 100;
}

async function fetchJson<T>(url: string, ms = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

function parseSgs(pontos: SgsPonto[] | null | undefined) {
  if (!Array.isArray(pontos) || !pontos.length) return null;
  const pcts = pontos.map((p) => Number(String(p.valor).replace(',', '.'))).filter((n) => Number.isFinite(n));
  const media = mediaGeometricaAm(pcts);
  if (media == null || !Number.isFinite(media)) return null;
  const ultimo = pontos[pontos.length - 1]?.data ?? null;
  return { am: arred2(media), data: ultimo };
}

async function buscarIpca(): Promise<{ am: number; fonte: IndicesEconomicos['ipcaFonte']; data: string | null }> {
  try {
    const json = await fetchJson<FocusResp>(FOCUS_IPCA);
    const row = json.value?.[0];
    const mediana = Number(row?.Mediana);
    if (Number.isFinite(mediana) && mediana > -5 && mediana < 40) {
      return { am: arred2(anualParaMensal(mediana)), fonte: 'focus', data: row?.Data ?? null };
    }
  } catch {
    /* fallback SGS */
  }
  try {
    const sgs = parseSgs(await fetchJson<SgsPonto[]>(SGS_IPCA));
    if (sgs) return { am: sgs.am, fonte: 'sgs', data: sgs.data };
  } catch {
    /* fallback hardcoded */
  }
  return { am: IPCA_FALLBACK_AM, fonte: 'fallback', data: null };
}

async function buscarIncc(): Promise<{ am: number; fonte: IndicesEconomicos['inccFonte']; data: string | null }> {
  try {
    const sgs = parseSgs(await fetchJson<SgsPonto[]>(SGS_INCC));
    if (sgs) return { am: sgs.am, fonte: 'sgs', data: sgs.data };
  } catch {
    /* fallback hardcoded */
  }
  return { am: INCC_FALLBACK_AM, fonte: 'fallback', data: null };
}

export async function buscarIndicesEconomicos(): Promise<IndicesEconomicos> {
  if (cache) return cache;
  if (pending) return pending;
  pending = Promise.all([buscarIpca(), buscarIncc()])
    .then(([ipca, incc]) => {
      cache = {
        ipcaAm: ipca.am,
        inccAm: incc.am,
        ipcaFonte: ipca.fonte,
        inccFonte: incc.fonte,
        atualizadoEm: ipca.data || incc.data,
      };
      return cache;
    })
    .catch((): IndicesEconomicos => {
      const fallback: IndicesEconomicos = {
        ipcaAm: IPCA_FALLBACK_AM,
        inccAm: INCC_FALLBACK_AM,
        ipcaFonte: 'fallback',
        inccFonte: 'fallback',
        atualizadoEm: null,
      };
      cache = fallback;
      return fallback;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function rotuloFonteIndice(fonte: IndicesEconomicos['ipcaFonte'] | IndicesEconomicos['inccFonte']) {
  if (fonte === 'focus') return 'Focus BCB';
  if (fonte === 'sgs') return 'SGS BCB';
  return 'padrão';
}

export function formatarDataIndice(raw: string | null) {
  if (!raw) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (br) return raw;
  return raw;
}
