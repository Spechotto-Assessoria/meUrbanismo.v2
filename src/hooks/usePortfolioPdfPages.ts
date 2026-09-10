import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export function usePortfolioPdfPages(url: string) {
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const renderedRef = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementosRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregandoDoc, setCarregandoDoc] = useState(true);
  const [renderizadas, setRenderizadas] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregandoDoc(true);
    setErro(null);
    renderedRef.current.clear();
    setRenderizadas(0);

    const task = getDocument({ url });
    task.promise
      .then((pdf) => {
        if (cancelado) {
          void pdf.cleanup();
          return;
        }
        pdfRef.current = pdf;
        setTotalPaginas(pdf.numPages);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          const msg = e instanceof Error ? e.message : 'Não foi possível abrir o portfólio.';
          setErro(msg);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoDoc(false);
      });

    return () => {
      cancelado = true;
      observerRef.current?.disconnect();
      observerRef.current = null;
      renderTasksRef.current.forEach((t) => t.cancel());
      renderTasksRef.current.clear();
      void task.destroy();
      void pdfRef.current?.cleanup();
      pdfRef.current = null;
      elementosRef.current.clear();
    };
  }, [url]);

  const renderPagina = useCallback(async (num: number, canvas: HTMLCanvasElement, wrapperWidth: number) => {
    const pdf = pdfRef.current;
    if (!pdf || renderedRef.current.has(num)) return;

    renderTasksRef.current.get(num)?.cancel();

    try {
      const page = await pdf.getPage(num);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(Math.max((wrapperWidth - 4) / base.width, 0.5), 2.5);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderTasksRef.current.set(num, task);
      await task.promise;

      renderedRef.current.add(num);
      setRenderizadas(renderedRef.current.size);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'RenderingCancelledException') return;
      console.error(`Erro ao renderizar página ${num}:`, e);
    }
  }, []);

  useEffect(() => {
    if (!totalPaginas) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const num = Number((entry.target as HTMLElement).dataset.page);
          const canvas = entry.target.querySelector('canvas');
          if (!num || !canvas) return;
          void renderPagina(num, canvas, entry.target.clientWidth);
        });
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    );

    elementosRef.current.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [totalPaginas, renderPagina]);

  const registrarPagina = useCallback((num: number, el: HTMLDivElement | null) => {
    if (!el) {
      elementosRef.current.delete(num);
      return;
    }
    el.dataset.page = String(num);
    elementosRef.current.set(num, el);
    observerRef.current?.observe(el);
  }, []);

  return { totalPaginas, carregandoDoc, renderizadas, erro, registrarPagina };
};
