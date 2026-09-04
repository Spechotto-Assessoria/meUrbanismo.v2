import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';
import { LoginScreen } from './components/auth/LoginScreen';

import { DashboardTab } from './components/tabs/Dashboard';
import { ConvitesTab } from './components/tabs/ConvitesTab';
import { NovaEmpresaTab } from './components/tabs/NovaEmpresaTab';
import { EmpresasTab } from './components/tabs/EmpresasTab';
import { NovaObraTab } from './components/tabs/NovaObraTab';
import { ResumoObraTab } from './components/tabs/ResumoObraTab';
import { OrcamentoTab } from './components/tabs/OrcamentoTab';
import { CronogramaTab } from './components/tabs/CronogramaTab';
import { AndamentoTab } from './components/tabs/AndamentoTab';
import { ViabilidadeTab } from './components/tabs/ViabilidadeTab';
import { AcompanhamentoTab } from './components/tabs/AcompanhamentoTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { MapaDisponibilidadeTab } from './components/tabs/MapaDisponibilidadeTab';
import { VendasTab } from './components/tabs/VendasTab';
import { RelatoriosTab } from './components/tabs/RelatoriosTab';
import { PortfolioTab } from './components/tabs/PortfolioTab';
import { EstudoViabilidadeTab } from './components/tabs/EstudoViabilidadeTab';
import { TabId, Obra, Empresa } from './types';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { canAccessTab, canAccessObra, role, activeObra, setActiveObra, isMasterAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | 'estudo-viabilidade'>('dashboard');
  const [lastEmpresaCreatedId, setLastEmpresaCreatedId] = useState<string | undefined>(undefined);
  const [obraToEdit, setObraToEdit] = useState<Obra | null>(null);
  const [empresaToEdit, setEmpresaToEdit] = useState<Empresa | null>(null);
  const [empresaFormOrigem, setEmpresaFormOrigem] = useState<'dashboard' | 'empresas'>('dashboard');

  useEffect(() => {
    if (
      activeTab !== 'estudo-viabilidade' &&
      canAccessTab &&
      !canAccessTab(activeTab as TabId)
    ) {
      setActiveTab(activeObra ? 'resumo' : 'dashboard');
    }
  }, [role, activeTab, canAccessTab, activeObra]);

  const handleResetToDashboard = () => {
    setActiveObra(null as any);
    setObraToEdit(null);
    setEmpresaToEdit(null);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectObra = () => {
    setActiveTab('resumo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAdmin = () => {
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFormPage = activeTab === 'nova-empresa' || activeTab === 'nova-obra' || activeTab === 'estudo-viabilidade';
  const showBottomNav = Boolean(
    activeObra &&
    activeTab !== 'dashboard' &&
    activeTab !== 'admin' &&
    activeTab !== 'empresas' &&
    !isFormPage
  );

  // Verificação estrita de acesso por convite da obra ativa
  const hasAccessToActiveObra = activeObra ? canAccessObra(activeObra.id) : true;

  const renderContent = () => {
    // Calculadora Geral de Viabilidade (Global)
    if (activeTab === 'estudo-viabilidade') {
      return <EstudoViabilidadeTab onBack={() => setActiveTab('dashboard')} />;
    }

    // Formulário de Nova Empresa (somente administrador)
    if (activeTab === 'nova-empresa') {
      if (!isMasterAdmin) {
        return (
          <DashboardTab
            onSelectObra={handleSelectObra}
            onSelectAdmin={handleSelectAdmin}
            onNavigateToEmpresas={() => setActiveTab('empresas')}
          />
        );
      }
      const voltar = () => {
        setEmpresaToEdit(null);
        setActiveTab(empresaFormOrigem === 'empresas' ? 'empresas' : 'dashboard');
      };
      return (
        <NovaEmpresaTab
          onBack={voltar}
          empresaToEdit={empresaToEdit}
          onSuccess={(empresaId) => {
            setEmpresaToEdit(null);
            if (empresaFormOrigem === 'empresas' || empresaToEdit) {
              setActiveTab('empresas');
            } else {
              setLastEmpresaCreatedId(empresaId);
              setActiveTab('nova-obra');
            }
          }}
        />
      );
    }

    if (activeTab === 'empresas') {
      return (
        <EmpresasTab
          onBack={() => setActiveTab('dashboard')}
          onNovaEmpresa={
            isMasterAdmin
              ? () => {
                  setEmpresaToEdit(null);
                  setEmpresaFormOrigem('empresas');
                  setActiveTab('nova-empresa');
                }
              : undefined
          }
          onEditEmpresa={
            isMasterAdmin
              ? (empresa) => {
                  setEmpresaToEdit(empresa);
                  setEmpresaFormOrigem('empresas');
                  setActiveTab('nova-empresa');
                }
              : undefined
          }
        />
      );
    }

    // Formulário de Nova Obra (somente administrador)
    if (activeTab === 'nova-obra') {
      if (!isMasterAdmin) {
        return (
          <DashboardTab
            onSelectObra={handleSelectObra}
            onSelectAdmin={handleSelectAdmin}
            onNavigateToEmpresas={() => setActiveTab('empresas')}
          />
        );
      }
      return (
        <NovaObraTab
          onBack={() => {
            setObraToEdit(null);
            setActiveTab('dashboard');
          }}
          onGoToNovaEmpresa={() => setActiveTab('nova-empresa')}
          preSelectedEmpresaId={lastEmpresaCreatedId}
          obraToEdit={obraToEdit}
        />
      );
    }

    // Gestão de Convites / Admin (somente administrador)
    if (activeTab === 'admin') {
      if (!isMasterAdmin) {
        return (
          <DashboardTab
            onSelectObra={handleSelectObra}
            onSelectAdmin={handleSelectAdmin}
            onNavigateToEmpresas={() => setActiveTab('empresas')}
          />
        );
      }
      return <ConvitesTab />;
    }

    // Painel Geral de Obras Administradas
    if (activeTab === 'dashboard' || !activeObra) {
      return (
        <DashboardTab
          onSelectObra={handleSelectObra}
          onSelectAdmin={handleSelectAdmin}
          onNavigateToNovaEmpresa={
            isMasterAdmin
              ? () => {
                  setEmpresaToEdit(null);
                  setEmpresaFormOrigem('dashboard');
                  setActiveTab('nova-empresa');
                }
              : undefined
          }
          onNavigateToNovaObra={
            isMasterAdmin
              ? () => {
                  setObraToEdit(null);
                  setActiveTab('nova-obra');
                }
              : undefined
          }
          onNavigateToViabilidade={isMasterAdmin ? () => setActiveTab('estudo-viabilidade') : undefined}
          onNavigateToEmpresas={() => setActiveTab('empresas')}
          onEditObra={
            isMasterAdmin
              ? (obra) => {
                  setObraToEdit(obra);
                  setActiveTab('nova-obra');
                }
              : undefined
          }
        />
      );
    }

    // Se o usuário tentar acessar uma obra sem convite ativo (e não for Master Admin)
    if (!hasAccessToActiveObra) {
      return (
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Acesso Restrito ao Empreendimento</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seu usuário não possui um convite ativo vinculado ao <strong>{activeObra.nome}</strong>. Solicite acesso ao administrador da Spechotto ou selecione uma obra autorizada.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleResetToDashboard}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Geral
            </button>
          </div>
        </div>
      );
    }

    // ==========================================
    // MENU DOS 11 MÓDULOS EXCLUSIVOS DA OBRA
    // ==========================================
    switch (activeTab) {
      case 'resumo':
        return <ResumoObraTab onNavigateTab={(t) => setActiveTab(t)} />;
      case 'orcamento':
        return <OrcamentoTab />;
      case 'cronograma':
        return <CronogramaTab />;
      case 'andamento':
        return <AndamentoTab />;
      case 'viabilidade':
        return <ViabilidadeTab />;
      case 'acompanhamento':
        return <AcompanhamentoTab />;
      case 'documentos':
        return <DocumentosTab />;
      case 'mapa':
        return <MapaDisponibilidadeTab />;
      case 'vendas':
        return <VendasTab />;
      case 'relatorios':
        return <RelatoriosTab />;
      case 'portfolio':
        return <PortfolioTab />;
      default:
        return <ResumoObraTab onNavigateTab={(t) => setActiveTab(t)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 max-w-full overflow-x-hidden relative">
      <Header
        onLogoClick={handleResetToDashboard}
        onNavigateAdmin={handleSelectAdmin}
        onAbrirNotificacao={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main
        id="tab-content-container"
        className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 transition-all ${
          showBottomNav ? 'pb-24 sm:pb-28' : 'pb-6'
        }`}
      >
        {renderContent()}
      </main>

      {showBottomNav && (
        <BottomNav activeTab={activeTab as TabId} onTabChange={(t) => setActiveTab(t)} />
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-bold text-slate-400">Verificando credenciais seguras...</span>
        </div>
      </div>
    );
  }

  // PROTEÇÃO CRÍTICA DE ROTAS: Sem sessão válida, bloqueia tudo e exibe a tela de login
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;