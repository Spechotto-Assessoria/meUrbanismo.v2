import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label
} from '../tabs/ui-components';
import {
  RELATORIO_CARDS,
  tipoPermiteTodoHistorico,
  tipoPrecisaPeriodo
} from '../../lib/relatorios/tipos';
import { financeiroPadraoMarcado } from '../../lib/relatorios/acesso';
import { periodoMesAnteriorPadrao, periodoValido } from '../../lib/relatorios/periodo-utils';
import { PeriodoRangePicker } from './PeriodoRangePicker';
import type { RelatorioTipo } from '../../types';
import type { GerarRelatorioParams, ModoVendasRelatorio } from '../../lib/relatorios/tipos';

type Props = {
  open: boolean;
  tipo: RelatorioTipo | null;
  onClose: () => void;
  onGerar: (params: Omit<GerarRelatorioParams, 'obra' | 'logoEmpresaUrl' | 'empresaNome'>) => void;
  userEmail?: string;
  isMasterAdmin: boolean;
  canViewFinancials: boolean;
};

export const RelatorioConfigDialog: React.FC<Props> = ({
  open,
  tipo,
  onClose,
  onGerar,
  userEmail,
  isMasterAdmin,
  canViewFinancials
}) => {
  const card = useMemo(() => RELATORIO_CARDS.find((c) => c.tipo === tipo), [tipo]);
  const [titulo, setTitulo] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [incluiFinanceiro, setIncluiFinanceiro] = useState(false);
  const [todosPeriodos, setTodosPeriodos] = useState(false);
  const [modoVendas, setModoVendas] = useState<ModoVendasRelatorio>('acumulado');

  const exibirPeriodo = tipo ? tipoPrecisaPeriodo(tipo) : false;
  const exibirTodoHistorico = tipo ? tipoPermiteTodoHistorico(tipo) : false;
  const exibirModoVendas = tipo === 'mapa_lotes' || tipo === 'global';
  const periodoInvalido = exibirPeriodo && !todosPeriodos && !periodoValido(periodoInicio, periodoFim);

  useEffect(() => {
    if (!open || !card) return;
    const padrao = periodoMesAnteriorPadrao();
    setTitulo(card.tituloPadrao);
    setPeriodoInicio(padrao.inicio);
    setPeriodoFim(padrao.fim);
    setTodosPeriodos(false);
    setModoVendas('acumulado');
    setIncluiFinanceiro(financeiroPadraoMarcado(userEmail, isMasterAdmin) && canViewFinancials);
  }, [open, card, userEmail, isMasterAdmin, canViewFinancials]);

  if (!tipo || !card) return null;

  const financeiroDesabilitado = !canViewFinancials;

  const handlePeriodoChange = (inicio: string, fim: string) => {
    setPeriodoInicio(inicio);
    setPeriodoFim(fim);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (periodoInvalido) return;
    onGerar({
      tipo,
      titulo: titulo.trim() || card.tituloPadrao,
      periodoInicio,
      periodoFim,
      incluiFinanceiro: financeiroDesabilitado ? false : incluiFinanceiro,
      todosPeriodos: exibirTodoHistorico ? todosPeriodos : false,
      modoVendas: exibirModoVendas ? modoVendas : 'acumulado'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Configurar Relatório</DialogTitle>
        <p className="text-xs text-slate-500 mt-1">{card.descricao}</p>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo-relatorio">Título do Relatório</Label>
            <Input
              id="titulo-relatorio"
              value={titulo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
              className="bg-white"
            />
          </div>

          {exibirPeriodo && !todosPeriodos && (
            <PeriodoRangePicker
              inicio={periodoInicio}
              fim={periodoFim}
              onChange={handlePeriodoChange}
            />
          )}

          {exibirTodoHistorico && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={todosPeriodos}
                onChange={(e) => setTodosPeriodos(e.target.checked)}
              />
              <span className="text-slate-700">Todo o histórico (sem filtro de período)</span>
            </label>
          )}

          {exibirModoVendas && (
            <div className="space-y-2 text-xs">
              <Label>Escopo de vendas</Label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="modo-vendas"
                  checked={modoVendas === 'periodo'}
                  onChange={() => setModoVendas('periodo')}
                  disabled={todosPeriodos}
                />
                <span className="text-slate-700">Vendas do período selecionado</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="modo-vendas"
                  checked={modoVendas === 'acumulado'}
                  onChange={() => setModoVendas('acumulado')}
                />
                <span className="text-slate-700">Vendas acumuladas (todo o empreendimento)</span>
              </label>
            </div>
          )}

          <label className={`flex items-center gap-2 text-xs ${financeiroDesabilitado ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={incluiFinanceiro}
              disabled={financeiroDesabilitado}
              onChange={(e) => setIncluiFinanceiro(e.target.checked)}
            />
            <span className="text-slate-700">Incluir dados financeiros</span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-500 hover:bg-brand-600"
              disabled={periodoInvalido}
            >
              Gerar e Salvar PDF
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
