import React from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { useLoteFormState } from '../../hooks/useLoteFormState';
import type { LoteFormData } from '../../lib/loteMapa';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '../tabs/ui-components';
import { LoteFormFields } from './LoteFormFields';

type Props = {
  open: boolean;
  onClose: () => void;
  onSalvar: (dados: LoteFormData) => Promise<void>;
  salvando?: boolean;
};

export const LoteFormModal: React.FC<Props> = ({ open, onClose, onSalvar, salvando }) => {
  const form = useLoteFormState(null);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSalvar = async () => {
    const { dados, erro } = form.validarESerializar();
    if (erro) return;
    try {
      await onSalvar(dados);
      form.reset();
      onClose();
    } catch (e: unknown) {
      form.setErro(e instanceof Error ? e.message : 'Não foi possível criar o lote.');
    }
  };

  if (!open) return null;

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
        <DialogTitle className="flex items-center gap-2 pr-8">
          <Plus className="w-5 h-5 text-blue-600" /> Adicionar Novo Lote
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <LoteFormFields {...form} />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1 gap-2" onClick={handleSalvar} disabled={salvando}>
            {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar lote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
