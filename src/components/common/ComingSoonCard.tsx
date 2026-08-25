import React, { useState } from 'react';
import { Sparkles, Info, X, CheckCircle, Clock } from 'lucide-react';

interface ComingSoonCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badgeText?: string;
  featuresList?: string[];
  children?: React.ReactNode;
  isUnlockedForAdmin?: boolean;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  badgeText = 'Em Breve',
  featuresList = [],
  children,
  isUnlockedForAdmin = false
}) => {
  const [showModal, setShowModal] = useState(false);

  if (isUnlockedForAdmin && children) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-navy-900/90 via-navy-850/80 to-navy-950/90 backdrop-blur-xl p-6 sm:p-8 shadow-glass transition-all duration-300">
      {/* Fita Diagonal 'Em Breve' */}
      <div className="absolute top-0 right-0 overflow-hidden w-36 h-36 pointer-events-none z-10">
        <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black tracking-widest py-1.5 right-[-35px] top-[24px] w-[150px] text-center shadow-lg uppercase">
          {badgeText}
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-400/30 flex items-center justify-center text-brand-400 shadow-glow-sm">
          {icon}
        </div>
        <div className="flex-1 pr-12">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" /> Lançamento Previsto
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 mt-4 leading-relaxed bg-navy-950/50 p-4 rounded-xl border border-slate-800/80">
        {description}
      </p>

      {featuresList.length > 0 && (
        <div className="mt-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos que estarão disponíveis:</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {featuresList.map((feat, index) => (
              <li key={index} className="flex items-center gap-2 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/30">
                <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold shadow-glow transition-all duration-150"
        >
          <Info className="w-4 h-4" />
          Como funcionará este módulo?
        </button>
        <span className="text-xs text-slate-400 italic">
          * Em fase final de homologação técnica.
        </span>
      </div>

      {/* Modal Explicativo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-navy-900 border border-slate-700/80 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-brand-400">meUrbanismo • Spechotto Assessoria & Construção</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>{description}</p>
              <div className="bg-navy-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-semibold text-white text-xs uppercase tracking-wider">Benefícios para a Gestão:</h5>
                <p className="text-xs text-slate-400">
                  Total transparência para compradores e agilidade para os corretores parceiros, tudo integrado em tempo real com o banco de dados do Supabase.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Entendi, fechar modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
