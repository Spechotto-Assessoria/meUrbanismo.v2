import React, { useEffect, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'hidden'>('visible');

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#081726] via-[#0F2942] to-[#07101b] text-white p-6 transition-opacity duration-700 select-none ${
        fadeState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-500/15 blur-3xl pointer-events-none"></div>

      <div className="w-full flex justify-end pt-2">
        <span className="text-[10px] text-brand-300/60 font-mono">v2.0 • PWA</span>
      </div>

      {/* Centro: Bússola e Logotipo meUrbanismo */}
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="relative animate-float">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-2 shadow-glow border border-brand-400/30 flex items-center justify-center">
            <img 
              src="/logo-meurbanismo.png" 
              alt="meUrbanismo" 
              className="w-full h-full object-contain drop-shadow-md"
              onError={(e) => {
                // Fallback se a imagem não carregar imediatamente
                e.currentTarget.style.display = 'none';
              }}
            />
            <Compass className="w-16 h-16 text-brand-400 animate-spin-slow absolute" style={{ display: 'none' }} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-1.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
            meUrbanismo
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-brand-300/90 uppercase">
            Planejar • Acompanhar • Realizar
          </p>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-44 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 mt-4">
          <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-300 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Rodapé: Desenvolvido por Spechotto */}
      <div className="flex flex-col items-center text-center pb-4 space-y-1">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Desenvolvido por</span>
        <div className="flex items-center gap-2">
          <img 
            src="/logo-spechotto.png" 
            alt="Spechotto Assessoria & Construção" 
            className="h-6 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-xs font-bold text-slate-200">SPECHOTTO ASSESSORIA & CONSTRUÇÃO</span>
        </div>
      </div>
    </div>
  );
};
