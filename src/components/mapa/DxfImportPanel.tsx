import React, { useRef } from 'react';
import { FileImage, FileType, Loader2, Save } from 'lucide-react';
import type { MapaImgTransform } from '../../types';
import { Button, Label } from '../tabs/ui-components';

type Props = {
  imagemNome?: string | null;
  dxfNome?: string | null;
  poligonosCount: number;
  transform: MapaImgTransform;
  onTransformChange: (t: MapaImgTransform) => void;
  onImagemSelect: (file: File) => void;
  onDxfSelect: (file: File) => void;
  onSalvar: () => void;
  prontoParaSalvar: boolean;
  salvando?: boolean;
  erro?: string | null;
};

function SliderControle({
  label,
  valor,
  min,
  max,
  step,
  unidade,
  onChange,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  step: number;
  unidade: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
        <Label>{label}</Label>
        <span>{valor}{unidade}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-700"
      />
    </div>
  );
}

export const DxfImportPanel: React.FC<Props> = ({
  imagemNome,
  dxfNome,
  poligonosCount,
  transform,
  onTransformChange,
  onImagemSelect,
  onDxfSelect,
  onSalvar,
  prontoParaSalvar,
  salvando,
  erro,
}) => {
  const imgRef = useRef<HTMLInputElement>(null);
  const dxfRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Importador DXF</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Envie a imagem do masterplan e o arquivo AutoCAD (.DXF) para gerar os lotes automaticamente.
        </p>
      </div>

      <div className="space-y-2">
        <input
          ref={imgRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onImagemSelect(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 justify-start"
          onClick={() => imgRef.current?.click()}
        >
          <FileImage className="w-4 h-4 text-blue-600" />
          {imagemNome ? `Imagem: ${imagemNome}` : '1. Upload Masterplan (JPG/PNG)'}
        </Button>

        <input
          ref={dxfRef}
          type="file"
          accept=".dxf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onDxfSelect(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 justify-start"
          onClick={() => dxfRef.current?.click()}
        >
          <FileType className="w-4 h-4 text-slate-700" />
          {dxfNome ? `DXF: ${dxfNome}` : '2. Upload Arquivo .DXF'}
        </Button>
      </div>

      {poligonosCount > 0 && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {poligonosCount} polígono(s) detectado(s). Ajuste o alinhamento abaixo.
        </p>
      )}

      <div className="space-y-3 pt-1 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-500 uppercase">Alinhamento da imagem</p>
        <SliderControle
          label="Escala"
          valor={transform.scale}
          min={50}
          max={200}
          step={1}
          unidade="%"
          onChange={(v) => onTransformChange({ ...transform, scale: v })}
        />
        <SliderControle
          label="Offset X"
          valor={transform.offsetX}
          min={-50}
          max={50}
          step={0.5}
          unidade="%"
          onChange={(v) => onTransformChange({ ...transform, offsetX: v })}
        />
        <SliderControle
          label="Offset Y"
          valor={transform.offsetY}
          min={-50}
          max={50}
          step={0.5}
          unidade="%"
          onChange={(v) => onTransformChange({ ...transform, offsetY: v })}
        />
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <Button
        type="button"
        className="w-full gap-2"
        disabled={!prontoParaSalvar || salvando}
        onClick={onSalvar}
      >
        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Loteamento
      </Button>
    </div>
  );
};
