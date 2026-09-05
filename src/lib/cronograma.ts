import * as XLSX from 'xlsx';
import { limparNomeEtapa } from './budget-parser';

export type EtapaCrono = { id: string; nome: string; valor_total: number };
export type Grid = Record<string, Record<string, number>>;

export type PontoCurvaS = {
  month: string;
  mesKey: string;
  Mensal: number;
  Acumulado: number;
  valorMes: number;
  valorAcum: number;
};

export type ScheduleRow = { nome: string; cells: Record<string, number> };

const MES_NOM = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

export const monthLabel = (k: string) => {
  const [y, m] = k.split('-');
  return `${m}/${y.slice(2)}`;
};

export function monthsBetween(start: string, end: string): string[] {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];
  const arr: string[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  const stop = new Date(e.getFullYear(), e.getMonth(), 1);
  while (cur <= stop) {
    arr.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return arr;
}

function pesosSeno(span: number): number[] {
  const w: number[] = [];
  let sum = 0;
  for (let i = 0; i < span; i++) {
    const t = (i + 1) / (span + 1);
    const p = Math.sin(t * Math.PI);
    w.push(p);
    sum += p;
  }
  return w.map((p) => (sum > 0 ? p / sum : 1 / span));
}

function preencherLinha(months: string[], start: number, end: number): Record<string, number> {
  const row: Record<string, number> = {};
  const n = months.length;
  const a = Math.max(0, Math.min(start, n - 1));
  const b = Math.max(a, Math.min(end, n - 1));
  const span = b - a + 1;
  const pesos = pesosSeno(span);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    if (i < a || i > b) {
      row[months[i]] = 0;
      continue;
    }
    const last = i === b;
    const pct = last ? Number((100 - acc).toFixed(2)) : Number((pesos[i - a] * 100).toFixed(2));
    acc = Number((acc + pct).toFixed(2));
    row[months[i]] = pct;
  }
  return row;
}

/** Curva S por etapa, janelas defasadas pela ordem. Cada linha soma 100%. */
export function gerarCronogramaBase(etapas: EtapaCrono[], months: string[]): Grid {
  const n = months.length;
  const k = etapas.length;
  const grid: Grid = {};
  if (n === 0) return grid;
  for (let i = 0; i < k; i++) {
    const startFrac = k <= 1 ? 0 : (i / k) * 0.4;
    const endFrac = k <= 1 ? 1 : 0.55 + (i / Math.max(1, k - 1)) * 0.45;
    const start = Math.floor(startFrac * n);
    const end = Math.min(n - 1, Math.max(start, Math.ceil(endFrac * n) - 1));
    grid[etapas[i].id] = preencherLinha(months, start, end);
  }
  return grid;
}

export function redistribuirLinha(months: string[], start: number, end: number): Record<string, number> {
  return preencherLinha(months, start, end);
}

export function calcularCurvaS(etapas: EtapaCrono[], months: string[], grid: Grid): PontoCurvaS[] {
  if (etapas.length === 0 || months.length === 0) return [];
  const totalObra = etapas.reduce((a, e) => a + (Number(e.valor_total) || 0), 0) || 1;
  let acumValor = 0;
  return months.map((m) => {
    const mesValor = etapas.reduce(
      (a, e) => a + ((Number(e.valor_total) || 0) * (Number(grid[e.id]?.[m]) || 0)) / 100,
      0
    );
    acumValor += mesValor;
    const pct = (mesValor / totalObra) * 100;
    const pctAcum = Math.min(100, (acumValor / totalObra) * 100);
    const fin = (v: number) => Number((Number.isFinite(v) && !Number.isNaN(v) ? v : 0).toFixed(2));
    return {
      mesKey: m,
      month: monthLabel(m),
      Mensal: fin(pct),
      Acumulado: fin(pctAcum),
      valorMes: fin(mesValor),
      valorAcum: fin(acumValor)
    };
  });
}

export function faixaEtapa(months: string[], row: Record<string, number> | undefined): { start: number; end: number } {
  let start = -1;
  let end = -1;
  months.forEach((m, i) => {
    if ((Number(row?.[m]) || 0) > 0) {
      if (start < 0) start = i;
      end = i;
    }
  });
  if (start < 0) return { start: 0, end: Math.max(0, months.length - 1) };
  return { start, end };
}

function parseMesHeader(raw: string, months: string[]): string | null {
  const s = norm(String(raw || ''));
  if (!s) return null;
  const iso = s.match(/(20\d{2})[-\/.](\d{1,2})/);
  if (iso) {
    const key = `${iso[1]}-${String(Number(iso[2])).padStart(2, '0')}-01`;
    return months.includes(key) ? key : null;
  }
  const mmyy = s.match(/^(\d{1,2})\s*[\/\-]\s*(\d{2,4})$/);
  if (mmyy) {
    const mes = Number(mmyy[1]);
    let ano = Number(mmyy[2]);
    if (ano < 100) ano += 2000;
    const key = `${ano}-${String(mes).padStart(2, '0')}-01`;
    return months.includes(key) ? key : null;
  }
  const nomeIdx = MES_NOM.findIndex((n) => s.startsWith(n));
  if (nomeIdx >= 0) {
    const anoM = s.match(/(20)?(\d{2})/);
    if (anoM) {
      const ano = anoM[1] ? Number(anoM[0]) : 2000 + Number(anoM[2]);
      const key = `${ano}-${String(nomeIdx + 1).padStart(2, '0')}-01`;
      return months.includes(key) ? key : null;
    }
  }
  const mesN = s.match(/mes\s*(\d+)/);
  if (mesN) {
    const idx = Number(mesN[1]) - 1;
    return months[idx] ?? null;
  }
  return months.find((m) => monthLabel(m) === s || m.startsWith(s)) ?? null;
}

function matchEtapa(nome: string, etapas: EtapaCrono[]): EtapaCrono | undefined {
  const alvo = norm(limparNomeEtapa(nome));
  if (!alvo) return undefined;
  const exact = etapas.find((e) => norm(e.nome) === alvo);
  if (exact) return exact;
  return etapas.find((e) => {
    const n = norm(e.nome);
    return n.includes(alvo) || alvo.includes(n);
  });
}

export function gridFromRows(rows: ScheduleRow[], etapas: EtapaCrono[], months: string[]): Grid {
  const grid: Grid = {};
  for (const e of etapas) grid[e.id] = Object.fromEntries(months.map((m) => [m, 0]));
  for (const row of rows) {
    const etapa = matchEtapa(row.nome, etapas);
    if (!etapa) continue;
    for (const m of months) {
      const v = Number(row.cells[m]) || 0;
      grid[etapa.id][m] = Math.max(0, Math.min(100, Number(v.toFixed(2))));
    }
  }
  return grid;
}

function toPct(raw: unknown, asFraction: boolean): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = asFraction ? raw * 100 : raw;
    return Math.max(0, Math.min(100, Number(n.toFixed(2))));
  }
  const s = String(raw ?? '').trim().replace('%', '').replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  const v = asFraction ? n * 100 : n;
  return Math.max(0, Math.min(100, Number(v.toFixed(2))));
}

export async function parseCronogramaFile(
  file: File,
  etapas: EtapaCrono[],
  months: string[]
): Promise<Grid> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' }) as unknown[][];
  if (aoa.length < 2) throw new Error('Planilha sem linhas de cronograma.');

  let headerRow = 0;
  for (let i = 0; i < Math.min(8, aoa.length); i++) {
    const hits = (aoa[i] || []).filter((c) => parseMesHeader(String(c), months)).length;
    if (hits >= 1) {
      headerRow = i;
      break;
    }
  }
  const header = (aoa[headerRow] || []).map((c) => String(c ?? ''));
  const colMes: (string | null)[] = header.map((h) => parseMesHeader(h, months));
  const nomeCol = colMes.findIndex((c) => !c);
  const idxNome = nomeCol >= 0 ? nomeCol : 0;

  const valoresBrutos: number[] = [];
  for (let r = headerRow + 1; r < aoa.length; r++) {
    const line = aoa[r] || [];
    colMes.forEach((mk, c) => {
      if (!mk || c === idxNome) return;
      const n = Number(String(line[c] ?? '').replace('%', '').replace(',', '.'));
      if (Number.isFinite(n) && n !== 0) valoresBrutos.push(n);
    });
  }
  const asFraction = valoresBrutos.length > 0 && valoresBrutos.every((v) => Math.abs(v) <= 1.5);

  const rows: ScheduleRow[] = [];
  for (let r = headerRow + 1; r < aoa.length; r++) {
    const line = aoa[r] || [];
    const nome = limparNomeEtapa(String(line[idxNome] ?? ''));
    if (!nome) continue;
    const cells: Record<string, number> = {};
    colMes.forEach((mk, c) => {
      if (!mk || c === idxNome) return;
      cells[mk] = toPct(line[c], asFraction);
    });
    rows.push({ nome, cells });
  }
  if (rows.length === 0) throw new Error('Nenhuma etapa reconhecida no arquivo.');
  return gridFromRows(rows, etapas, months);
}
