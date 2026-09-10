import React, { useEffect, useState } from 'react';
import { Calculator, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useLoteFormState } from '../../hooks/useLoteFormState';
import { coresLotePorStatus, formatBRL, normalizeStatus } from '../../lib/loteMapa';
import type { Lote } from '../../types';
import type { LoteFormData } from '../../lib/loteMapa';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../tabs/ui-components';
import { LoteFormFields } from './LoteFormFields';

type Props = {
  lote: Lote | null;
  open: boolean;
  onClose: () => void;
  podeEditar: boolean;
  podeSimularVenda?: boolean;
  onSimularVenda?: () => void;
  onSalvar: (dados: LoteFormData) => Promise<void>;
  onExcluir: () => Promise<void>;
  salvando?: boolean;
  excluindo?: boolean;
};

export const LoteDetalheModal: React.FC<Props> = ({
  lote,
  open,
  onClose,
  podeEditar,
  podeSimularVenda,
  onSimularVenda,
  onSalvar,
  onExcluir,
  salvando,
  excluindo,
}) => {
  const [editando, setEditando] = useState(false);
  const form = useLoteFormState(lote);

  useEffect(() => {
    if (!open) setEditando(false);
  }, [open, lote?.id]);

  if (!lote || !open) return null;

  const badge = coresLotePorStatus(lote.status);
  const busy = salvando || excluindo;

  const handleSalvar = async () => {
    const { dados, erro } = form.validarESerializar();
    if (erro) return;
    try {
      await onSalvar(dados);
      setEditando(false);
    } catch (e: unknown) {
      form.setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  };

  const handleExcluir = async () => {
    if (!confirm(`Excluir definitivamente o Lote ${lote.numero} (${lote.quadra})?`)) return;
    try {
      await onExcluir();
      onClose();
    } catch (e: unknown) {
      form.setErro(e instanceof Error ? e.message : 'Não foi possível excluir o lote.');
    }
  };

  const handleClose = () => {
    setEditando(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <button
        type="button"
        onClick={handleClose}
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

            {(podeEditar || (podeSimularVenda && normalizeStatus(lote.status) === 'disponivel')) && (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  {podeEditar && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setEditando(true)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar lote
                    </Button>
                  )}
                  {podeSimularVenda && normalizeStatus(lote.status) === 'disponivel' && onSimularVenda && (
                    <Button
                      type="button"
                      className="flex-1 gap-2"
                      onClick={onSimularVenda}
                    >
                      <Calculator className="w-3.5 h-3.5" /> Simular Venda
                    </Button>
                  )}
                </div>
                {podeEditar && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 text-red-700 border-red-200 hover:bg-red-50"
                    onClick={handleExcluir}
                    disabled={busy}
                  >
                    {excluindo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Excluir lote
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <LoteFormFields {...form} />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditando(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1 gap-2" onClick={handleSalvar} disabled={busy}>
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
