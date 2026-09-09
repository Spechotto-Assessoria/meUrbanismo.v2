import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import { coresLotePorStatus, formatBRL, normalizeStatus } from '../../lib/loteMapa';
import type { Lote } from '../../types';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
} from '../tabs/ui-components';

type Props = {
  lote: Lote | null;
  open: boolean;
  onClose: () => void;
  podeEditar: boolean;
  onSalvar: (dados: Pick<Lote, 'status' | 'area_m2' | 'valor_total' | 'valor_m2'>) => Promise<void>;
  salvando?: boolean;
};

export const LoteDetalheModal: React.FC<Props> = ({
  lote,
  open,
  onClose,
  podeEditar,
  onSalvar,
  salvando,
}) => {
  const [editando, setEditando] = useState(false);
  const [status, setStatus] = useState<ReturnType<typeof normalizeStatus>>('disponivel');
  const [area, setArea] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!lote) return;
    setEditando(false);
    setStatus(normalizeStatus(lote.status));
    setArea(String(lote.area_m2 ?? ''));
    setValor(String(lote.valor_total ?? ''));
    setErro(null);
  }, [lote]);

  if (!lote) return null;

  const badge = coresLotePorStatus(lote.status);

  const handleSalvar = async () => {
    const areaNum = Number(area.replace(',', '.'));
    const valorNum = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (!areaNum || areaNum <= 0) {
      setErro('Informe uma metragem válida.');
      return;
    }
    if (!valorNum || valorNum <= 0) {
      setErro('Informe um valor válido.');
      return;
    }
    setErro(null);
    try {
      const valorM2 = Math.round((valorNum / areaNum) * 100) / 100;
      await onSalvar({
        status,
        area_m2: areaNum,
        valor_total: valorNum,
        valor_m2: valorM2,
      });
      setEditando(false);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <DialogHeader>
        <div className="flex items-center gap-2 pr-8">
          <Badge className="bg-blue-50 text-blue-900 border-blue-200">{lote.quadra}</Badge>
          <DialogTitle>Lote {lote.numero}</DialogTitle>
        </div>
      </DialogHeader>

      <DialogContent>
        {!editando ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Metragem</span>
                <strong className="text-base text-slate-900">{lote.area_m2 ?? '—'} m²</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Valor</span>
                <strong className="text-base text-slate-900">{formatBRL(lote.valor_total)}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Status comercial</span>
              <Badge className={badge.badgeClass}>{badge.label}</Badge>
            </div>

            {podeEditar && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setEditando(true)}
              >
                <Pencil className="w-3.5 h-3.5" /> Editar lote
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="disponivel">Disponível</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </Select>
            </div>
            <div>
              <Label>Metragem (m²)</Label>
              <Input
                type="number"
                min={1}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min={1}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            {erro && <p className="text-xs text-red-600">{erro}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditando(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1 gap-2" onClick={handleSalvar} disabled={salvando}>
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
