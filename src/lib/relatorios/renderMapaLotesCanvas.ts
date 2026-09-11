import { coresLotePorStatus, lotesComSvg, parseViewBox, VIEWBOX_PADRAO } from '../loteMapa';
import type { Lote, MapaImgTransform } from '../../types';

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar masterplan'));
    img.src = url;
  });
}

function parsePolygonPoints(path: string): { x: number; y: number }[] {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    pts.push({ x: nums[i], y: nums[i + 1] });
  }
  return pts;
}

export async function renderMapaLotesCanvas(
  masterplanUrl: string | null | undefined,
  viewBox: string | null | undefined,
  lotes: Lote[],
  _transform?: MapaImgTransform | null
): Promise<string | null> {
  const lotesSvg = lotesComSvg(lotes);
  const vb = parseViewBox(viewBox || VIEWBOX_PADRAO);
  const w = 960;
  const h = Math.round(w * (vb.height / vb.width));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, w, h);

  const scaleX = w / vb.width;
  const scaleY = h / vb.height;

  if (masterplanUrl) {
    try {
      const img = await carregarImagem(masterplanUrl);
      ctx.drawImage(img, 0, 0, w, h);
    } catch {
      /* masterplan opcional */
    }
  }

  for (const lote of lotesSvg) {
    const path = lote.svg_path?.trim();
    if (!path) continue;
    const pts = parsePolygonPoints(path);
    if (pts.length < 3) continue;
    const cores = coresLotePorStatus(lote.status);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * scaleX;
      const y = p.y * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = cores.fill;
    ctx.fill();
    ctx.strokeStyle = cores.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
