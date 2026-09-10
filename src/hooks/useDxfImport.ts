import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Lote, MapaImgTransform } from '../types';
import { parsearArquivoDxf, type PoligonoDxf, type ResultadoDxf } from '../lib/dxfImport';
import { parseImgTransform, TRANSFORM_PADRAO } from '../lib/loteMapa';

export function useDxfImport(activeTransform?: MapaImgTransform | null) {
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [imagemPreviewUrl, setImagemPreviewUrl] = useState<string | null>(null);
  const [resultadoDxf, setResultadoDxf] = useState<ResultadoDxf | null>(null);
  const [transform, setTransform] = useState<MapaImgTransform>(
    parseImgTransform(activeTransform)
  );
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!resultadoDxf) {
      setTransform(parseImgTransform(activeTransform));
    }
  }, [activeTransform, resultadoDxf]);

  const previewLotes = useMemo((): Lote[] => {
    if (!resultadoDxf) return [];
    return resultadoDxf.poligonos.map((p, i) => ({
      id: `preview-${i}`,
      quadra: 'Importado',
      numero: String(i + 1).padStart(2, '0'),
      area_m2: 0,
      valor_total: 0,
      valor_m2: 0,
      status: 'disponivel',
      svg_path: p.svg_path,
      label_x: p.label_x,
      label_y: p.label_y,
    }));
  }, [resultadoDxf]);

  const selecionarImagem = useCallback((file: File) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setErro('Use apenas JPG ou PNG para o masterplan.');
      return;
    }
    if (imagemPreviewUrl) URL.revokeObjectURL(imagemPreviewUrl);
    setImagemArquivo(file);
    setImagemPreviewUrl(URL.createObjectURL(file));
    setErro(null);
  }, [imagemPreviewUrl]);

  const selecionarDxf = useCallback(async (file: File) => {
    setErro(null);
    try {
      const resultado = await parsearArquivoDxf(file);
      setResultadoDxf(resultado);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Falha ao processar o DXF.');
      setResultadoDxf(null);
    }
  }, []);

  const limparPreview = useCallback(() => {
    if (imagemPreviewUrl) URL.revokeObjectURL(imagemPreviewUrl);
    setImagemArquivo(null);
    setImagemPreviewUrl(null);
    setResultadoDxf(null);
    setTransform(TRANSFORM_PADRAO);
    setErro(null);
  }, [imagemPreviewUrl]);

  const poligonosParaSalvar = (): PoligonoDxf[] => resultadoDxf?.poligonos ?? [];

  return {
    imagemArquivo,
    imagemPreviewUrl,
    resultadoDxf,
    viewBoxDxf: resultadoDxf?.viewBox ?? null,
    previewLotes,
    transform,
    setTransform,
    erro,
    setErro,
    selecionarImagem,
    selecionarDxf,
    limparPreview,
    poligonosParaSalvar,
    prontoParaSalvar: Boolean(imagemArquivo && resultadoDxf && resultadoDxf.poligonos.length > 0),
  };
}
