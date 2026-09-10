import React, { useEffect } from 'react';
import { Calculator, FileText, Loader2 } from 'lucide-react';
import { labelLote, OPCOES_BALOES, OPCOES_CORRECAO, OPCOES_ENTRADA, PRAZO_MAXIMO } from '../../lib/simuladorVendas';
import type { Lote } from '../../types';
import { Badge, Button, Input, Label, Select } from '../tabs/ui-components';
import { formatMoeda, InputMoeda } from './InputMoeda';

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
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-blue-700" />
            </span>
            Simulador Financeiro de Loteamento
          </h2>
          <p className="text-xs text-slate-500 mt-1 pl-10">
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
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          {!loteTravado && (
            <div>
              <Label className="mb-1.5 block">Selecionar Lote Disponível</Label>
              <Select
                value={loteSelecionado?.id || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSelecionarLote(e.target.value)}
                disabled={isLoadingLote}
              >
                <option value="">Escolha um lote...</option>
                {lotesDisponiveis.map((l) => (
                  <option key={l.id} value={l.id}>
                    {labelLote(l.quadra, l.numero)} — {formatMoeda(l.valor_total ?? 0)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Valor do Lote</Label>
            <InputMoeda
              value={valorLote}
              onChange={setValorLote}
              disabled={loteTravado}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">
                Entrada ({percEntrada}% = {formatMoeda(valorEntrada)})
              </Label>
              <Select
                value={percEntrada}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPercEntrada(Number(e.target.value))}
              >
                {OPCOES_ENTRADA.map((p) => (
                  <option key={p} value={p}>{p}% de Entrada</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Prazo (máx. {PRAZO_MAXIMO}x)</Label>
              <Input
                type="number"
                min={1}
                max={PRAZO_MAXIMO}
                value={prazo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrazo(Number(e.target.value))}
                className="text-right font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Índice de Correção</Label>
            <Select
              value={correcao}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCorrecao(e.target.value as typeof OPCOES_CORRECAO[number])
              }
            >
              {OPCOES_CORRECAO.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            <div>
              <Label className="mb-1 block">Balões Intermediários</Label>
              <Select
                value={qtdBaloes}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQtdBaloes(Number(e.target.value))}
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
                <Label className="mb-1 block">Valor de Cada Balão</Label>
                <InputMoeda value={valorBalao} onChange={setValorBalao} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {prazo.toLocaleString('pt-BR')}x
              </span>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm text-center">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wide">
                Parcela Mensal
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 tabular-nums">
                {formatMoeda(parcelaMensal)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">{correcao}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-500">Entrada ({percEntrada}%)</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatMoeda(valorEntrada)}</span>
              </div>
              {qtdBaloes > 0 && (
                <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-slate-500">Balões ({qtdBaloes}x)</span>
                  <span className="font-bold text-amber-700 tabular-nums">{formatMoeda(totalBaloes)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-500">Saldo Financiado</span>
                <span className="font-bold text-slate-800 tabular-nums">{formatMoeda(saldoFinanciar)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {podeReservar ? (
              <Button
                type="button"
                className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800"
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
              <p className="text-[10px] text-amber-700 text-center bg-amber-50 border border-amber-200 rounded-lg py-1.5">
                Este lote não está mais disponível para reserva.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
