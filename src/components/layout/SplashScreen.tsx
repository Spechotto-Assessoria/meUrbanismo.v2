import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [logoMeuOk, setLogoMeuOk] = useState(true);
  const [logoSpeOk, setLogoSpeOk] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeState('fading');
    }, 1800);

    const timer2 = setTimeout(() => {
      setFadeState('hidden');
      onFinish();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  if (fadeState === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0b1a2b] via-[#12314d] to-[#07111c] text-white px-6 py-5 transition-opacity duration-700 select-none ${
        fadeState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-sky-800/25 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex justify-end pt-1">
        <span className="text-[10px] text-sky-200/50 font-mono">v2.0 • PWA</span>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {/* Placa clara: a logo é navy e some no fundo escuro sem este contraste */}
        <div className="animate-float">
          <div className="w-[15.5rem] sm:w-72 overflow-hidden rounded-2xl bg-white px-5 py-3 shadow-lg shadow-black/30 ring-1 ring-slate-200/90">
            {logoMeuOk ? (
              <img
                src="/logo-meurbanismo.png"
                alt="meUrbanismo"
                className="w-full h-auto max-h-48 origin-center scale-[1.35] object-contain"
                onError={() => setLogoMeuOk(false)}
              />
            ) : (
              <p className="py-8 text-2xl font-extrabold tracking-tight text-slate-800">
                me<span className="text-sky-600">U</span>rbanismo
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-sky-100/90 uppercase">
            Planejar • Acompanhar • Realizar
          </p>
          <div className="mx-auto w-44 h-1.5 bg-slate-900/70 rounded-full overflow-hidden border border-slate-600/40">
            <div className="h-full w-2/3 bg-sky-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center pb-2 gap-2.5">
        <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-[0.18em]">
          Desenvolvido por
        </span>
        <div className="overflow-hidden rounded-xl bg-white px-5 py-2.5 shadow-md shadow-black/25 ring-1 ring-slate-200/90">
          {logoSpeOk ? (
            <img
              src="/logo-spechotto.png"
              alt="Spechotto Assessoria & Construção"
              className="h-16 sm:h-[4.75rem] w-auto origin-center scale-125 object-contain"
              onError={() => setLogoSpeOk(false)}
            />
          ) : (
            <span className="text-sm font-bold text-slate-800">
              Spechotto Assessoria & Construção
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
