import React from 'react';
import { Input, Label, Select } from '../tabs/ui-components';
import type { StatusLote } from '../../lib/loteMapa';

type FormState = {
  quadra: string;
  setQuadra: (v: string) => void;
  numero: string;
  setNumero: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  valor: string;
  setValor: (v: string) => void;
  status: StatusLote;
  setStatus: (v: StatusLote) => void;
  svgPath: string;
  setSvgPath: (v: string) => void;
  erro: string | null;
};

export const LoteFormFields: React.FC<FormState> = ({
  quadra,
  setQuadra,
  numero,
  setNumero,
  area,
  setArea,
  valor,
  setValor,
  status,
  setStatus,
  svgPath,
  setSvgPath,
  erro,
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Quadra</Label>
        <Input value={quadra} onChange={(e) => setQuadra(e.target.value)} placeholder="Ex: Quadra A" />
      </div>
      <div>
        <Label>Lote</Label>
        <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 01" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Metragem (m²)</Label>
        <Input type="number" min={1} value={area} onChange={(e) => setArea(e.target.value)} />
      </div>
      <div>
        <Label>Valor (R$)</Label>
        <Input type="number" min={1} value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
    </div>
    <div>
      <Label>Status</Label>
      <Select value={status} onChange={(e) => setStatus(e.target.value as StatusLote)}>
        <option value="disponivel">Disponível</option>
        <option value="reservado">Reservado</option>
        <option value="vendido">Vendido</option>
      </Select>
    </div>
    <div>
      <Label>SVG Path</Label>
      <textarea
        value={svgPath}
        onChange={(e) => setSvgPath(e.target.value)}
        rows={4}
        placeholder="M 50 50 L 310 50 L 310 270 L 50 270 Z"
        className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
      />
      <p className="text-[10px] text-slate-400 mt-1">
        Coordenadas do polígono no viewBox do masterplan (atributo d do SVG).
      </p>
    </div>
    {erro && <p className="text-xs text-red-600">{erro}</p>}
  </div>
);
