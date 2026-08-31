import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../contexts/AuthContext';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  X,
  UserCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, loginWithEmail, loginWithGoogle, loginAsProfile, user, isMasterAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithEmail(email, password);
      if (res.success) {
        setSuccess('Login realizado com sucesso!');
        setTimeout(() => {
          setSuccess(null);
          setShowLoginModal(false);
        }, 800);
      } else {
        setError(res.error || 'Falha ao autenticar.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccess('Autenticado via Google OAuth!');
      setTimeout(() => {
        setSuccess(null);
        setShowLoginModal(false);
      }, 800);
    } catch (err: any) {
      setError('Erro no login social Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoProfile = (role: UserRole) => {
    loginAsProfile(role);
    setSuccess(`Acessando como ${DEMO_USERS[role].nome}`);
    setTimeout(() => {
      setSuccess(null);
      setShowLoginModal(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 mb-3">
            <img src="/logo-meurbanismo.png" alt="meUrbanismo" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-xl font-black tracking-tight">meUrbanismo</h2>
          <p className="text-xs text-blue-200 mt-0.5">Gestão Inteligente & Engenharia Urbana</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {success}
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: seu.email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Senha
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Verificando Credenciais...' : 'Entrar na Plataforma'}
            </button>
          </form>

          {/* SOCIAL GOOGLE LOGIN */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-2">Ou autentique com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Entrar com Google
          </button>

          {/* ALTERNADOR RÁPIDO DE PERFIS (DEMO & TESTES) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Acesso Rápido por Papel
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemoProfile('ADMINISTRADOR')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Administrador Master
                </div>
                <div className="text-[9px] text-blue-700/80 truncate">rennan.spechotto@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoProfile('PROPRIETARIO_INVESTIDOR')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Investidor
                </div>
                <div className="text-[9px] text-slate-500 truncate">Proprietário Gleba</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoProfile('CORRETOR')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Corretor
                </div>
                <div className="text-[9px] text-slate-500 truncate">Vendas & Mapa</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoProfile('CLIENTE_COMPRADOR')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Adquirente
                </div>
                <div className="text-[9px] text-slate-500 truncate">Cliente Comprador</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
