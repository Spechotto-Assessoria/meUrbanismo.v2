import React, { useEffect, useState } from 'react';
import { Input } from '../tabs/ui-components';

/** Formata número como moeda BRL (R$ 1.234,56). */
export function formatMoeda(valor: number): string {
  return (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Props = {
  value: number;
  onChange: (valor: number) => void;
  disabled?: boolean;
  className?: string;
};

export const InputMoeda: React.FC<Props> = ({ value, onChange, disabled, className = '' }) => {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => formatMoeda(value));

  useEffect(() => {
    if (!focused) setText(formatMoeda(value));
  }, [value, focused]);

  return (
    <Input
      inputMode="decimal"
      disabled={disabled}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const numerico = Number(e.target.value.replace(/\D/g, '').slice(0, 15)) / 100;
        setText(formatMoeda(numerico));
        onChange(numerico);
      }}
      className={`text-right font-mono tabular-nums font-bold ${className}`}
    />
  );
};
