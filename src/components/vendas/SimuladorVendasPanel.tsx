import React, { useEffect } from 'react';
import { Calculator, FileText, Loader2 } from 'lucide-react';
import { formatBRL } from '../../lib/loteMapa';
import { labelLote, OPCOES_BALOES, OPCOES_CORRECAO, OPCOES_ENTRADA, PRAZO_MAXIMO } from '../../lib/simuladorVendas';
import type { Lote } from '../../types';
import { Badge, Button, Input, Label, Select } from '../tabs/ui-components';

type SimuladorState = {
  percEntrada: number;
  setPercEntrada: (v: number) => void;
  prazo: number;
  setPrazo: (v: number) => void;
  qtdBaloes: number;
  setQtdBaloes: (v: number) => void;
  valorBalao: number;
  setValorBalao: (v: number) => void;
  correcao: string;
  setCorrecao: (v: import('../../lib/simuladorVendas').IndiceCorrecao) => void;
  valorLote: number;
  setValorLote: (v: number) => void;
  valorEntrada: number;
  totalBaloes: number;
  saldoFinanciar: number;
  parcelaMensal: number;
};

type Props = {
  simulador: SimuladorState;
  loteSelecionado: Lote | null;
  loteTravado: boolean;
  lotesDisponiveis: Lote[];
  onSelecionarLote: (loteId: string) => void;
  isLoadingLote: boolean;
  podeReservar: boolean;
  loteDisponivel: boolean;
  onGerarProposta: () => void;
  isReservando: boolean;
};

export const SimuladorVendasPanel: React.FC<Props> = ({
  simulador,
  loteSelecionado,
  loteTravado,
  lotesDisponiveis,
  onSelecionarLote,
  isLoadingLote,
  podeReservar,
  loteDisponivel,
  onGerarProposta,
  isReservando,
}) => {
  const {
    percEntrada, setPercEntrada, prazo, setPrazo,
    qtdBaloes, setQtdBaloes, valorBalao, setValorBalao,
    correcao, setCorrecao, valorLote, setValorLote,
    valorEntrada, totalBaloes, saldoFinanciar, parcelaMensal,
  } = simulador;

  useEffect(() => {
    if (loteSelecionado?.valor_total != null && loteTravado) {
      setValorLote(loteSelecionado.valor_total);
    }
  }, [loteSelecionado, loteTravado, setValorLote]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Simulador Financeiro de Loteamento
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Financiamento direto em até {PRAZO_MAXIMO} parcelas mensais
          </p>
        </div>
        {loteSelecionado && (
          <Badge className="bg-blue-50 text-blue-900 border-blue-200">
            {labelLote(loteSelecionado.quadra, loteSelecionado.numero)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/50 border border-slate-700/60 space-y-4 backdrop-blur-sm">
          {!loteTravado && (
            <div>
              <Label className="text-slate-300 mb-1.5 block">Selecionar Lote Disponível</Label>
              <Select
                value={loteSelecionado?.id || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSelecionarLote(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                disabled={isLoadingLote}
              >
                <option value="">Escolha um lote...</option>
                {lotesDisponiveis.map((l) => (
                  <option key={l.id} value={l.id}>
                    {labelLote(l.quadra, l.numero)} — {formatBRL(l.valor_total)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label className="text-slate-300 mb-1.5 block">Valor do Lote (R$)</Label>
            <Input
              type="number"
              value={valorLote}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorLote(Number(e.target.value))}
              disabled={loteTravado}
              className="bg-slate-950 border-slate-700 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 mb-1.5 block">
                Entrada ({percEntrada}% = {formatBRL(valorEntrada)})
              </Label>
              <Select
                value={percEntrada}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPercEntrada(Number(e.target.value))}
                className="bg-slate-950 border-slate-700 text-white"
              >
                {OPCOES_ENTRADA.map((p) => (
                  <option key={p} value={p}>{p}% de Entrada</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Prazo (máx. {PRAZO_MAXIMO}x)</Label>
              <Input
                type="number"
                min={1}
                max={PRAZO_MAXIMO}
                value={prazo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrazo(Number(e.target.value))}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Índice de Correção</Label>
            <Select
              value={correcao}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCorrecao(e.target.value as typeof OPCOES_CORRECAO[number])
              }
              className="bg-slate-950 border-slate-700 text-white"
            >
              {OPCOES_CORRECAO.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-700/60">
            <div>
              <Label className="text-slate-400 mb-1 block">Balões Intermediários</Label>
              <Select
                value={qtdBaloes}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQtdBaloes(Number(e.target.value))}
                className="bg-slate-950 border-slate-700 text-white"
              >
                {OPCOES_BALOES.map((q) => (
                  <option key={q} value={q}>
                    {q === 0 ? 'Sem balões' : `${q} parcelas`}
                  </option>
                ))}
              </Select>
            </div>
            {qtdBaloes > 0 && (
              <div>
                <Label className="text-slate-400 mb-1 block">Valor de Cada Balão (R$)</Label>
                <Input
                  type="number"
                  value={valorBalao}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorBalao(Number(e.target.value))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/50 border border-slate-600/50 space-y-4 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo</span>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {prazo}x
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Parcela Mensal</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{formatBRL(parcelaMensal)}</div>
              <span className="text-[10px] text-slate-500 mt-1 block">{correcao}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Entrada ({percEntrada}%)</span>
                <span className="font-bold text-white">{formatBRL(valorEntrada)}</span>
              </div>
              {qtdBaloes > 0 && (
                <div className="flex justify-between">
                  <span>Balões ({qtdBaloes}x)</span>
                  <span className="font-bold text-amber-300">{formatBRL(totalBaloes)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Saldo Financiado</span>
                <span className="font-bold text-slate-200">{formatBRL(saldoFinanciar)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {podeReservar ? (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={onGerarProposta}
                disabled={!loteSelecionado || !loteDisponivel || isReservando}
              >
                {isReservando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Gerar Proposta e Reservar Lote
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={onGerarProposta}
                disabled={!loteSelecionado}
              >
                <FileText className="w-4 h-4" />
                Visualizar Proposta
              </Button>
            )}
            {!loteDisponivel && loteSelecionado && (
              <p className="text-[10px] text-amber-600 text-center">
                Este lote não está mais disponível para reserva.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
