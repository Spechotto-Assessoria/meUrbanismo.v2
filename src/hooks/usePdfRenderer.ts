import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export function usePdfRenderer(url: string | null) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const loadRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderRef = useRef<RenderTask | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [largura, setLargura] = useState(0);
  const [altura, setAltura] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      pdfRef.current = null;
      setTotalPaginas(0);
      setPagina(1);
      return;
    }
    let cancelado = false;
    setLoading(true);
    setErro(null);
    const task = getDocument({ url });
    loadRef.current = task;
    task.promise
      .then((pdf) => {
        if (cancelado) {
          void pdf.cleanup();
          return;
        }
        pdfRef.current = pdf;
        setTotalPaginas(pdf.numPages);
        setPagina(1);
      })
      .catch((e: any) => {
        if (!cancelado) setErro(e?.message || 'Não foi possível abrir o PDF.');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
      void loadRef.current?.destroy();
      loadRef.current = null;
      void pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, [url]);

  const renderPagina = useCallback(async (pageNum: number, zoom: number) => {
    const canvas = canvasRef.current;
    const pdf = pdfRef.current;
    if (!canvas || !pdf) return;
    renderRef.current?.cancel();
    setLoading(true);
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D indisponível.');
      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderRef.current = task;
      await task.promise;
      setLargura(viewport.width);
      setAltura(viewport.height);
      setErro(null);
    } catch (e: any) {
      if (e?.name === 'RenderingCancelledException') return;
      console.error('Falha ao renderizar PDF:', e);
      setErro(e?.message || 'Não foi possível renderizar a página.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!url || !pdfRef.current) return;
    void renderPagina(pagina, scale);
  }, [url, pagina, scale, totalPaginas, renderPagina]);

  const irPara = (delta: number) => {
    setPagina((p) => Math.min(totalPaginas || 1, Math.max(1, p + delta)));
  };

  return {
    canvasRef,
    pagina,
    totalPaginas,
    scale,
    setScale,
    largura,
    altura,
    loading,
    erro,
    irPara
  };
}
