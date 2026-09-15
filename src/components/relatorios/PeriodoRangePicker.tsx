import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from './Calendar';
import { Label } from '../tabs/ui-components';
import {
  formatarIntervalo,
  normalizarData,
  parseDataIso,
  periodoMesAnteriorPadrao,
  periodoMesAtual,
  periodoValido
} from '../../lib/relatorios/periodo-utils';

type Props = {
  inicio: string;
  fim: string;
  onChange: (inicio: string, fim: string) => void;
  disabled?: boolean;
};

function paraDateRange(inicio: string, fim: string): DateRange | undefined {
  if (!inicio || !fim) return undefined;
  return { from: parseDataIso(inicio), to: parseDataIso(fim) };
}

function deDateRange(range?: DateRange): { inicio: string; fim: string } | null {
  if (!range?.from) return null;
  const inicio = format(range.from, 'yyyy-MM-dd');
  const fim = range.to ? format(range.to, 'yyyy-MM-dd') : inicio;
  return { inicio, fim };
}

export const PeriodoRangePicker: React.FC<Props> = ({ inicio, fim, onChange, disabled }) => {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const range = paraDateRange(inicio, fim);
  const invalido = !periodoValido(inicio, fim);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto]);

  const aplicarPreset = (preset: { inicio: string; fim: string }) => {
    onChange(preset.inicio, preset.fim);
    setAberto(false);
  };

  const handleSelect = (selected?: DateRange) => {
    const parsed = deDateRange(selected);
    if (!parsed) return;
    onChange(parsed.inicio, parsed.fim);
    if (selected?.from && selected?.to) setAberto(false);
  };

  const labelBotao = inicio && fim
    ? formatarIntervalo(inicio, fim)
    : 'Selecione o período';

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <Label>Período</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((v) => !v)}
        className={`flex h-9 w-full items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm transition-colors
          ${invalido ? 'border-red-300' : 'border-slate-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white cursor-pointer'}
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500`}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate text-slate-700">{labelBotao}</span>
      </button>

      {invalido && (
        <p className="text-xs text-red-600">A data início deve ser anterior ou igual à data fim.</p>
      )}

      {aberto && !disabled && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-soft p-3 space-y-3
            sm:left-auto sm:right-0 sm:w-auto sm:min-w-[320px]"
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => aplicarPreset(periodoMesAnteriorPadrao())}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Mês anterior
            </button>
            <button
              type="button"
              onClick={() => aplicarPreset(periodoMesAtual())}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Mês atual
            </button>
          </div>

          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={range}
            onSelect={handleSelect}
            defaultMonth={range?.from ?? parse(normalizarData(inicio), 'yyyy-MM-dd', new Date())}
            locale={ptBR}
          />

          {range?.from && (
            <p className="text-[10px] text-slate-500 text-center">
              {range.to
                ? formatarIntervalo(inicio, fim)
                : `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} — selecione a data fim`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
