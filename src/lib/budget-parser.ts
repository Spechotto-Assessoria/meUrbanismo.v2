import * as XLSX from 'xlsx';

export type ColumnMapping = {
  descricao: number | null;
  codigo: number | null;
  unidade: number | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number | null;
};

export type ParsedEtapa = {
  nome: string;
  codigo?: string | null;
  valor_total: number;
};

export type SheetRead = {
  headers: string[];
  rows: unknown[][];
  headerRow: number;
  mapping: ColumnMapping;
};

const NONE_MAP: ColumnMapping = {
  descricao: null,
  codigo: null,
  unidade: null,
  quantidade: null,
  valor_unitario: null,
  valor_total: null
};

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function parseMoney(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw ?? '').trim();
  if (!s) return 0;
  const limpo = s.replace(/[^\d,.-]/g, '');
  if (!limpo) return 0;
  if (limpo.includes(',') && limpo.includes('.')) {
    return Number(limpo.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (limpo.includes(',')) return Number(limpo.replace(',', '.')) || 0;
  return Number(limpo) || 0;
}

function cellStr(raw: unknown): string {
  if (raw == null) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

function guessCol(headers: string[], keys: string[]): number | null {
  const idx = headers.findIndex((h) => keys.some((k) => norm(h).includes(k)));
  return idx >= 0 ? idx : null;
}

export function guessMapping(headers: string[]): ColumnMapping {
  return {
    descricao: guessCol(headers, ['descricao', 'descricao / etapa', 'etapa', 'servico', 'nome']),
    codigo: guessCol(headers, ['codigo', 'item', 'cod']),
    unidade: guessCol(headers, ['unidade', 'unid', 'un ']),
    quantidade: guessCol(headers, ['quantidade', 'qtd', 'qtde']),
    valor_unitario: guessCol(headers, ['unitario', 'unit', 'preco']),
    valor_total: guessCol(headers, ['valor total', 'total', 'preco total', 'v. total'])
  };
}

const UNIDADES_MAE = new Set(['', 'vb', 'verba', 'gl', 'global', '%', 'percent']);
const UNIDADES_ITEM = new Set([
  'm2', 'm²', 'm3', 'm³', 'm', 'ml', 'km', 'un', 'und', 'unid', 'kg', 't', 'ton',
  'h', 'hh', 'mes', 'mês', 'dia', 'cj', 'conj', 'pc', 'pç', 'l', 'lt'
]);

function ehItemDetalhe(codigo: string | null): boolean {
  if (!codigo) return false;
  const c = codigo.replace(/\.0+$/, '');
  return /^\d+\.\d+/.test(c);
}

const RE_CABECALHO =
  /\b(codigo|c[oó]digo|item|itens|descricao|descri[cç][aã]o|unidades?|unid|quantidade|quant|qtde?|valor\s*unit(?:[aá]rio)?|pre[cç]o\s*unit(?:[aá]rio)?|valor\s*total|pre[cç]o\s*total|unit)\b\.?/gi;

const RE_UNID_QTD =
  /\b(m²|m2|m³|m3|km|ml|unid|und|un|kg|ton|hh|h|meses|mes|mês|dia|cj|conj|p[cç]|lt)\b\.?\s+[\d.]+(?:[.,]\d+)?/i;

export function limparNomeEtapa(nome: string): string {
  let s = nome.replace(/^\d+([.\-]\d+)*\s*[.)\-]?\s*/, '');
  s = s.replace(RE_CABECALHO, ' ');
  s = s.replace(/\(R\$\)/gi, ' ');
  s = s.replace(/\bR\$\s*[\d.]+[.,]\d{2}\b/gi, ' ');
  s = s.replace(RE_UNID_QTD, ' ');
  s = s.replace(/[\d.]+,\d{2}/g, ' ');
  return s.replace(/[|•·]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function ehSubitemPdf(resto: string): boolean {
  const rs = resto.match(/R\$\s*[\d.]+[.,]\d{2}/gi) || [];
  if (rs.length >= 1) return true;
  if (RE_UNID_QTD.test(resto)) return true;
  const decimais = resto.match(/[\d.]+,\d{2}/g) || [];
  if (decimais.length >= 2) return true;
  return false;
}

function ehLinhaMaeExcel(
  codigo: string,
  unidade: string,
  qtd: number,
  unitario: number,
  total: number
): boolean {
  if (ehItemDetalhe(codigo)) return false;
  const u = norm(unidade).replace(/\.$/, '');
  const itemComDetalhe =
    UNIDADES_ITEM.has(u) && (qtd > 1 || (unitario > 0 && Math.abs(unitario - total) > 0.009));
  if (itemComDetalhe) return false;
  if (qtd > 1 && unitario > 0 && Math.abs(unitario - total) > 0.009) return false;
  const cod = codigo.replace(/\.0+$/, '');
  if (cod && /^\d+$/.test(cod)) return true;
  if (UNIDADES_MAE.has(u)) return true;
  if ((qtd === 0 || qtd === 1) && (unitario === 0 || Math.abs(unitario - total) < 0.009)) return true;
  return false;
}

export function buildEtapas(rows: unknown[][], mapping: ColumnMapping, startRow: number): ParsedEtapa[] {
  const colDesc = mapping.descricao;
  const colTotal = mapping.valor_total;
  const colUnit = mapping.valor_unitario;
  const colQtd = mapping.quantidade;
  const colCod = mapping.codigo;
  const colUnid = mapping.unidade;
  if (colDesc == null) return [];

  const etapas: ParsedEtapa[] = [];
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const bruto = cellStr(row[colDesc]);
    if (ehSubitemPdf(bruto)) continue;
    const nome = limparNomeEtapa(bruto);
    if (!nome || nome.length < 2) continue;
    if (/^(total|soma|subtotal|geral)\b/i.test(nome)) continue;
    const codigo = colCod != null ? cellStr(row[colCod]) : '';
    const unidade = colUnid != null ? cellStr(row[colUnid]) : '';
    const qtd = colQtd != null ? parseMoney(row[colQtd]) : 0;
    const unitario = colUnit != null ? parseMoney(row[colUnit]) : 0;

    let total = colTotal != null ? parseMoney(row[colTotal]) : 0;
    if (total <= 0 && unitario > 0 && qtd > 0) total = qtd * unitario;
    if (total <= 0) continue;
    if (!ehLinhaMaeExcel(codigo, unidade, qtd, unitario, total)) continue;

    etapas.push({ nome, codigo: codigo || null, valor_total: total });
  }
  return etapas;
}

export async function readSheetRows(file: File): Promise<SheetRead> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('Planilha vazia.');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as unknown[][];
  let headerRow = 0;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const cells = (rows[i] || []).map((c) => cellStr(c));
    const joined = norm(cells.join(' '));
    if (joined.includes('descricao') || joined.includes('etapa') || joined.includes('total')) {
      headerRow = i;
      break;
    }
  }
  const headers = (rows[headerRow] || []).map((c, i) => cellStr(c) || `Coluna ${i + 1}`);
  const mapping = guessMapping(headers);
  if (mapping.descricao == null && headers.length > 0) mapping.descricao = 0;
  if (mapping.valor_total == null && headers.length > 1) mapping.valor_total = headers.length - 1;
  return { headers, rows, headerRow, mapping };
}

const RE_MOEDA = /(?:R\$\s*)?([\d.]{1,3}(?:\.\d{3})*,\d{2}|[\d]+(?:[.,]\d{2})?)\s*$/;

export function etapasDeLinhasPdf(linhas: string[]): ParsedEtapa[] {
  const etapas: ParsedEtapa[] = [];
  for (const linha of linhas) {
    const m = linha.match(RE_MOEDA);
    if (!m || m.index == null) continue;
    const valor = parseMoney(m[1]);
    if (valor <= 0) continue;
    const resto = linha.slice(0, m.index).trim();
    if (ehSubitemPdf(resto)) continue;
    const nome = limparNomeEtapa(resto);
    if (nome.length < 3) continue;
    if (/^(total|soma|subtotal|geral)\b/i.test(nome)) continue;
    etapas.push({ nome, valor_total: valor });
  }
  return etapas;
}

export async function parseBudgetPdf(file: File): Promise<ParsedEtapa[]> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const linhas: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let atual = '';
    let lastY: number | null = null;
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      const y = item.transform?.[5];
      const t = (item.str || '').trim();
      if (!t) continue;
      if (lastY != null && y != null && Math.abs(lastY - y) > 4) {
        if (atual.trim()) linhas.push(atual.trim());
        atual = t;
      } else {
        atual = atual ? `${atual} ${t}` : t;
      }
      lastY = y ?? lastY;
    }
    if (atual.trim()) linhas.push(atual.trim());
  }

  const etapas = etapasDeLinhasPdf(linhas);

  if (etapas.length === 0) {
    throw new Error(
      'Nenhuma etapa encontrada no PDF. Use um PDF com texto selecionável ou envie a planilha .xlsx.'
    );
  }
  return etapas;
}

export async function parseBudgetFile(file: File): Promise<{ sheet?: SheetRead; etapas?: ParsedEtapa[] }> {
  const nome = file.name.toLowerCase();
  if (nome.endsWith('.pdf') || file.type === 'application/pdf') {
    const etapas = await parseBudgetPdf(file);
    return { etapas };
  }
  const sheet = await readSheetRows(file);
  return { sheet };
}
