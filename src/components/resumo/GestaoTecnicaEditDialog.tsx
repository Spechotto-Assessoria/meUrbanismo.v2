import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from '../tabs/ui-components';
import type { Obra } from '../../types';
import type { GestaoTecnicaFormData } from '../../hooks/useGestaoTecnicaObra';

type Props = {
  open: boolean;
  onClose: () => void;
  obra: Obra;
  onSalvar: (dados: GestaoTecnicaFormData) => Promise<void>;
  salvando: boolean;
  erro: string | null;
};

export const GestaoTecnicaEditDialog: React.FC<Props> = ({
  open,
  onClose,
  obra,
  onSalvar,
  salvando,
  erro,
}) => {
  const [supervisao, setSupervisao] = useState('');
  const [engenheiro, setEngenheiro] = useState('');
  const [crea, setCrea] = useState('');

  useEffect(() => {
    if (!open) return;
    setSupervisao(obra.supervisao_tecnica || '');
    setEngenheiro(obra.engenheiro_responsavel || '');
    setCrea(obra.crea_responsavel || '');
  }, [open, obra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSalvar({
      supervisao_tecnica: supervisao,
      engenheiro_responsavel: engenheiro,
      crea_responsavel: crea,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Gestão & Responsabilidade Técnica</DialogTitle>
        <p className="text-xs text-slate-500 mt-1">Edite os dados de supervisão e responsável técnico.</p>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supervisao-tecnica">Supervisão Técnica</Label>
            <Input
              id="supervisao-tecnica"
              value={supervisao}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupervisao(e.target.value)}
              placeholder="Spechotto Assessoria & Construção"
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="engenheiro-responsavel">Engenheiro Responsável</Label>
            <Input
              id="engenheiro-responsavel"
              value={engenheiro}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEngenheiro(e.target.value)}
              placeholder="Nome completo"
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crea-responsavel">Registro (CREA/CAU)</Label>
            <Input
              id="crea-responsavel"
              value={crea}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrea(e.target.value)}
              placeholder="CREA-SP 5069248190"
              className="bg-white"
            />
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600" disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
