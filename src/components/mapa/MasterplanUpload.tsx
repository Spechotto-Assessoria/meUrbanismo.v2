import React, { useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader2, Upload } from 'lucide-react';

GlobalWorkerOptions.workerSrc = workerSrc;
import { uploadMapaMasterplan } from '../../lib/storage';
import { VIEWBOX_PADRAO } from '../../lib/loteMapa';
import { Button } from '../tabs/ui-components';

type Props = {
  obraId: string;
  onUploaded: (url: string, viewBox: string) => Promise<void>;
  disabled?: boolean;
};

async function detectarViewBox(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const url = URL.createObjectURL(file);
    try {
      const pdf = await getDocument({ url }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const viewBox = `0 0 ${Math.round(vp.width)} ${Math.round(vp.height)}`;
      await pdf.cleanup();
      return viewBox;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? `0 0 ${img.naturalWidth} ${img.naturalHeight}`
          : VIEWBOX_PADRAO
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(VIEWBOX_PADRAO);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export const MasterplanUpload: React.FC<Props> = ({ obraId, onUploaded, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setEnviando(true);
    setErro(null);
    try {
      const [url, viewBox] = await Promise.all([
        uploadMapaMasterplan(file, obraId),
        detectarViewBox(file),
      ]);
      await onUploaded(url, viewBox);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha no upload da planta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || enviando}
        onClick={() => inputRef.current?.click()}
        className="gap-1.5"
      >
        {enviando ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {enviando ? 'Enviando...' : 'Upload da planta'}
      </Button>
      {erro && <p className="text-[10px] text-red-600 max-w-[200px] text-right">{erro}</p>}
    </div>
  );
};
