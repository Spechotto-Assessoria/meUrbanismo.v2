import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AuthAlertProps {
  type: 'error' | 'success';
  message: string;
}

/**
 * Feedback visual padronizado para os formulários de autenticação.
 * Utiliza tons sóbrios (slate/rose/emerald) para manter a identidade
 * corporativa, evitando cores berrantes.
 */
export const AuthAlert: React.FC<AuthAlertProps> = ({ type, message }) => {
  const isError = type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-fadeIn ${
        isError
          ? 'bg-rose-50/80 border-rose-200 text-rose-800'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
      }`}
    >
      {isError ? (
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      )}
      <span className="leading-snug">{message}</span>
    </div>
  );
};
