import DxfParser from 'dxf-parser';

export interface PoligonoDxf {
  svg_path: string;
  label_x: number;
  label_y: number;
}

export interface ResultadoDxf {
  poligonos: PoligonoDxf[];
  viewBox: string;
}

type Ponto = { x: number; y: number };

function extrairVertices(entity: { type?: string; vertices?: Array<{ x?: number; y?: number }> }): Ponto[] {
  if (entity.type !== 'LWPOLYLINE' && entity.type !== 'POLYLINE') return [];
  return (entity.vertices || [])
    .filter((v) => v.x != null && v.y != null)
    .map((v) => ({ x: v.x!, y: v.y! }));
}

function pontosParaSvgPath(pontos: Ponto[], minX: number, maxY: number): PoligonoDxf {
  const transformados = pontos.map((p) => ({
    x: p.x - minX,
    y: maxY - p.y,
  }));

  const d = transformados
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ') + ' Z';

  const label_x =
    Math.round((transformados.reduce((s, p) => s + p.x, 0) / transformados.length) * 100) / 100;
  const label_y =
    Math.round((transformados.reduce((s, p) => s + p.y, 0) / transformados.length) * 100) / 100;

  return { svg_path: d, label_x, label_y };
}

export function parsearConteudoDxf(conteudo: string): ResultadoDxf {
  const parser = new DxfParser();
  const dxf = parser.parseSync(conteudo);

  if (!dxf?.entities?.length) {
    throw new Error('Nenhuma entidade encontrada no arquivo DXF.');
  }

  const polilinhas = dxf.entities.filter(
    (e) => e.type === 'LWPOLYLINE' || e.type === 'POLYLINE'
  );

  const gruposVertices = polilinhas
    .map(extrairVertices)
    .filter((pts) => pts.length >= 3);

  if (gruposVertices.length === 0) {
    throw new Error('Nenhum LWPOLYLINE ou POLYLINE com vértices suficientes foi encontrado.');
  }

  const todosPontos = gruposVertices.flat();
  const minX = Math.min(...todosPontos.map((p) => p.x));
  const maxX = Math.max(...todosPontos.map((p) => p.x));
  const minY = Math.min(...todosPontos.map((p) => p.y));
  const maxY = Math.max(...todosPontos.map((p) => p.y));

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  const poligonos = gruposVertices.map((pts) => pontosParaSvgPath(pts, minX, maxY));
  const viewBox = `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`;

  return { poligonos, viewBox };
}

export async function parsearArquivoDxf(file: File): Promise<ResultadoDxf> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext !== 'dxf') {
    throw new Error('Selecione um arquivo .DXF válido.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('O arquivo DXF excede 20 MB.');
  }

  const conteudo = await file.text();
  return parsearConteudoDxf(conteudo);
}
