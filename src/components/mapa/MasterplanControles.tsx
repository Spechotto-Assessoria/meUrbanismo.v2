import React, { useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { VIEWBOX_PADRAO } from '../../lib/loteMapa';
import { Button, Input, Label } from '../tabs/ui-components';

GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
  masterplanUrl?: string | null;
  viewBox?: string | null;
  onUpload: (file: File, viewBox: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onSaveViewBox: (viewBox: string) => Promise<void>;
  isUploading?: boolean;
  isDeleting?: boolean;
  isSavingViewBox?: boolean;
};

async function detectarViewBox(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const url = URL.createObjectURL(file);
    try {
      const pdf = await getDocument({ url }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const vb = `0 0 ${Math.round(vp.width)} ${Math.round(vp.height)}`;
      await pdf.cleanup();
      return vb;
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

export const MasterplanControles: React.FC<Props> = ({
  masterplanUrl,
  viewBox,
  onUpload,
  onDelete,
  onSaveViewBox,
  isUploading,
  isDeleting,
  isSavingViewBox,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [viewBoxLocal, setViewBoxLocal] = useState(viewBox || VIEWBOX_PADRAO);

  React.useEffect(() => {
    setViewBoxLocal(viewBox || VIEWBOX_PADRAO);
  }, [viewBox]);

  const busy = isUploading || isDeleting || isSavingViewBox;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErro(null);
    try {
      const vb = await detectarViewBox(file);
      await onUpload(file, vb);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha no upload da planta.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir a planta do masterplan? Os lotes permanecem, mas o fundo será removido.')) return;
    setErro(null);
    try {
      await onDelete();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir a planta.');
    }
  };

  const handleSaveViewBox = async () => {
    const vb = viewBoxLocal.trim();
    if (!/^0\s+0\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/.test(vb)) {
      setErro('ViewBox inválido. Use o formato: 0 0 1920 1080');
      return;
    }
    setErro(null);
    try {
      await onSaveViewBox(vb);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar viewBox.');
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex flex-wrap gap-2 justify-end">
        {!masterplanUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isUploading ? 'Enviando...' : 'Upload da planta'}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="gap-1.5"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Substituir imagem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={handleDelete}
              className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Excluir imagem
            </Button>
          </>
        )}
      </div>

      {masterplanUrl && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>ViewBox</Label>
            <Input
              value={viewBoxLocal}
              onChange={(e) => setViewBoxLocal(e.target.value)}
              placeholder="0 0 1920 1080"
              className="text-xs font-mono"
            />
          </div>
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={handleSaveViewBox}>
            {isSavingViewBox ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
          </Button>
        </div>
      )}

      {erro && <p className="text-[10px] text-red-600 text-right">{erro}</p>}
    </div>
  );
};
