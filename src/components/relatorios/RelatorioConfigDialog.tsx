import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label
} from '../tabs/ui-components';
import { RELATORIO_CARDS } from '../../lib/relatorios/tipos';
import { financeiroPadraoMarcado } from '../../lib/relatorios/acesso';
import type { RelatorioTipo } from '../../types';
import type { GerarRelatorioParams } from '../../lib/relatorios/tipos';

type Props = {
  open: boolean;
  tipo: RelatorioTipo | null;
  onClose: () => void;
  onGerar: (params: Omit<GerarRelatorioParams, 'obra' | 'logoEmpresaUrl' | 'empresaNome'>) => Promise<void>;
  gerando: boolean;
  userEmail?: string;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
};

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const RelatorioConfigDialog: React.FC<Props> = ({
  open,
  tipo,
  onClose,
  onGerar,
  gerando,
  userEmail,
  isMasterAdmin,
  canViewFinancials
}) => {
  const card = useMemo(() => RELATORIO_CARDS.find((c) => c.tipo === tipo), [tipo]);
  const [titulo, setTitulo] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState(mesAtual());
  const [periodoFim, setPeriodoFim] = useState(mesAtual());
  const [incluiFinanceiro, setIncluiFinanceiro] = useState(false);

  useEffect(() => {
    if (!open || !card) return;
    setTitulo(card.tituloPadrao);
    setPeriodoInicio(mesAtual());
    setPeriodoFim(mesAtual());
    setIncluiFinanceiro(financeiroPadraoMarcado(userEmail, isMasterAdmin) && canViewFinancials);
  }, [open, card, userEmail, isMasterAdmin, canViewFinancials]);

  if (!tipo || !card) return null;

  const financeiroDesabilitado = !canViewFinancials;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (periodoInicio > periodoFim) return;
    await onGerar({
      tipo,
      titulo: titulo.trim() || card.tituloPadrao,
      periodoInicio,
      periodoFim,
      incluiFinanceiro: financeiroDesabilitado ? false : incluiFinanceiro
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Configurar Relatório</DialogTitle>
        <p className="text-xs text-slate-500 mt-1">{card.descricao}</p>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo-relatorio">Título do Relatório</Label>
            <Input
              id="titulo-relatorio"
              value={titulo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mes-inicio">Mês Início</Label>
              <Input
                id="mes-inicio"
                type="month"
                value={periodoInicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mes-fim">Mês Fim</Label>
              <Input
                id="mes-fim"
                type="month"
                value={periodoFim}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodoFim(e.target.value)}
              />
            </div>
          </div>

          <label className={`flex items-center gap-2 text-xs ${financeiroDesabilitado ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={incluiFinanceiro}
              disabled={financeiroDesabilitado}
              onChange={(e) => setIncluiFinanceiro(e.target.checked)}
            />
            <span className="text-slate-700">Incluir dados financeiros</span>
          </label>

          {periodoInicio > periodoFim && (
            <p className="text-xs text-red-600">O mês início deve ser anterior ou igual ao mês fim.</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={gerando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-500 hover:bg-brand-600"
              disabled={gerando || periodoInicio > periodoFim}
            >
              {gerando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Gerando...
                </>
              ) : (
                'Gerar e Salvar PDF'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
