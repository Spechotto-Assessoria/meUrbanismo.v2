import { useEffect, useState, type ReactNode } from 'react';

const INPUT =
  'w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-right font-mono text-xs tabular-nums text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-800';

export type PremissaKind = 'money' | 'percent' | 'integer';

function maskBRL(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function formatPct(n: number, decimals: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatInt(n: number) {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString('pt-BR');
}

function parsePct(raw: string) {
  const t = raw.replace(/[^\d,.\-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  label: string;
  suffix: string;
  kind: PremissaKind;
  value: number;
  disabled?: boolean;
  decimals?: number;
  onChange: (v: number) => void;
  hint?: ReactNode;
};

export function PremissaCampo({
  label,
  suffix,
  kind,
  value,
  disabled,
  decimals = 2,
  onChange,
  hint,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() =>
    kind === 'money' ? maskBRL(value) : kind === 'percent' ? formatPct(value, decimals) : formatInt(value)
  );

  useEffect(() => {
    if (focused) return;
    setText(
      kind === 'money' ? maskBRL(value) : kind === 'percent' ? formatPct(value, decimals) : formatInt(value)
    );
  }, [value, focused, kind, decimals]);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="relative">
        <input
          inputMode={kind === 'integer' ? 'numeric' : 'decimal'}
          disabled={disabled}
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value;
            if (kind === 'money') {
              const v = Number(raw.replace(/\D/g, '').slice(0, 15)) / 100;
              setText(maskBRL(v));
              onChange(v);
              return;
            }
            if (kind === 'percent') {
              const cleaned = raw.replace(/[^\d,.\-]/g, '').replace('.', ',');
              setText(cleaned);
              onChange(parsePct(cleaned));
              return;
            }
            const v = Number(raw.replace(/\D/g, '')) || 0;
            setText(formatInt(v));
            onChange(v);
          }}
          className={`${INPUT} pr-16`}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
          {suffix}
        </span>
      </div>
      {hint}
    </div>
  );
}
