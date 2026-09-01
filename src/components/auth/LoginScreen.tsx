import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthAlert } from './AuthAlert';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, resetPassword } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, nome);
        if (res.success) {
          setSuccess('Conta criada com sucesso! Verificando sessão...');
          setPassword('');
        } else {
          setError(res.error || 'Erro ao realizar cadastro.');
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          setSuccess('Autenticado com sucesso! Redirecionando...');
          setPassword('');
        } else {
          setError(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na conexão com o servidor de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Informe seu e-mail no campo acima para receber o link de redefinição.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccess('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.');
      } else {
        setError(res.error || 'Não foi possível enviar o e-mail de redefinição.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Falha ao iniciar autenticação Google.');
        setLoading(false);
      }
      // Em caso de sucesso, o navegador é redirecionado para o provedor OAuth,
      // então o estado de carregamento é mantido até a troca de página.
    } catch (err: any) {
      setError('Erro no login social Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100/80 backdrop-blur-md relative overflow-hidden">
      
      {/* BACKGROUND DECORATIVO */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden relative animate-fadeIn z-10">
        
        {/* CABEÇALHO CORPORATIVO */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-8 text-white text-center relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-blue-950/50 ring-1 ring-white/40 mb-3">
            <img
              src="/logo-meurbanismo.png"
              alt="meUrbanismo"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>

          <h1 className="text-2xl font-black tracking-tight">meUrbanismo</h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Engenharia Urbana & Gestão Integrada de Obras
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Acesso Restrito & Seguro
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {error && <AuthAlert type="error" message={error} />}
          {success && <AuthAlert type="success" message={success} />}

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: seu.email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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
                  required
                  disabled={loading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {loading
                ? 'Autenticando...'
                : isSignUp
                ? 'Criar Conta de Acesso'
                : 'Entrar na Plataforma'}
            </button>

            {!isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResetPassword}
                  className="text-[11px] text-slate-500 hover:text-blue-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
          </form>

          {/* GOOGLE SOCIAL LOGIN */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-2">Ou autentique com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Entrar com Google OAuth
          </button>

          {/* ALTERNAR LOGIN / CADASTRO */}
          <div className="text-center pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp
                ? 'Já possui uma conta? Fazer Login'
                : 'Novo usuário ou possui convite? Criar Conta'}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Ambiente protegido por criptografia de ponta a ponta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
