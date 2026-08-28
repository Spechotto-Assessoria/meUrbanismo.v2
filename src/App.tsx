import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';

import { DashboardTab } from './components/tabs/Dashboard';
import { ConvitesTab } from './components/tabs/ConvitesTab';
import { NovaEmpresaTab } from './components/tabs/NovaEmpresaTab';
import { NovaObraTab } from './components/tabs/NovaObraTab';
import { AndamentoTab } from './components/tabs/AndamentoTab';
import { OrcamentoTab } from './components/tabs/OrcamentoTab';
import { CronogramaTab } from './components/tabs/CronogramaTab';
import { AcompanhamentoTab } from './components/tabs/AcompanhamentoTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { ViabilidadeTab } from './components/tabs/ViabilidadeTab';
import { MapaDisponibilidadeTab } from './components/tabs/MapaDisponibilidadeTab';
import { VendasTab } from './components/tabs/VendasTab';
import { RelatoriosTab } from './components/tabs/RelatoriosTab';
import { TabId } from './types';
import { ShieldAlert, Lock } from 'lucide-react';

const MainApp: React.FC = () => {
  const { canAccessTab, role, isSimulating, activeObra, setActiveObra, restoreRealRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [lastEmpresaCreatedId, setLastEmpresaCreatedId] = useState<string | undefined>(undefined);

  // Redireciona para o Dashboard caso tente acessar uma aba não permitida no perfil simulado
  useEffect(() => {
    if (canAccessTab && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab, canAccessTab]);

  const handleResetToDashboard = () => {
    setActiveObra(null as any);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectObra = () => {
    setActiveTab('andamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAdmin = () => {
    if (canAccessTab('admin')) {
      setActiveTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isFormPage = activeTab === 'nova-empresa' || activeTab === 'nova-obra';
  const showBottomNav = Boolean(activeObra && activeTab !== 'dashboard' && activeTab !== 'admin' && !isFormPage);

  const renderContent = () => {
    // Bloqueio de Segurança para a aba atual
    if (canAccessTab && !canAccessTab(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-slate-900/60 rounded-3xl border border-slate-800 shadow-xl my-8">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Perfil {role}</h3>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            Este recurso não está disponível para o perfil visualizado no momento.
          </p>
          {isSimulating && (
            <button
              type="button"
              onClick={restoreRealRole}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Voltar ao Perfil Administrador
            </button>
          )}
        </div>
      );
    }

    if (activeTab === 'nova-empresa') {
      return (
        <NovaEmpresaTab
          onBack={() => setActiveTab('dashboard')}
          onSuccess={(empresaId) => {
            setLastEmpresaCreatedId(empresaId);
            setActiveTab('nova-obra');
          }}
        />
      );
    }

    if (activeTab === 'nova-obra') {
      return (
        <NovaObraTab
          onBack={() => setActiveTab('dashboard')}
          onGoToNovaEmpresa={() => setActiveTab('nova-empresa')}
          preSelectedEmpresaId={lastEmpresaCreatedId}
        />
      );
    }

    if (activeTab === 'admin') {
      return <ConvitesTab />;
    }

    if (activeTab === 'dashboard' || !activeObra) {
      return (
        <DashboardTab
          onSelectObra={handleSelectObra}
          onSelectAdmin={handleSelectAdmin}
          onNavigateToNovaEmpresa={() => setActiveTab('nova-empresa')}
          onNavigateToNovaObra={() => setActiveTab('nova-obra')}
        />
      );
    }

    switch (activeTab) {
      case 'andamento':
        return <AndamentoTab />;
      case 'orcamento':
        return <OrcamentoTab />;
      case 'cronograma':
        return <CronogramaTab />;
      case 'acompanhamento':
        return <AcompanhamentoTab />;
      case 'documentos':
        return <DocumentosTab />;
      case 'viabilidade':
        return <ViabilidadeTab />;
      case 'mapa':
        return <MapaDisponibilidadeTab />;
      case 'vendas':
        return <VendasTab />;
      case 'relatorios':
        return <RelatoriosTab />;
      default:
        return (
          <DashboardTab
            onSelectObra={handleSelectObra}
            onSelectAdmin={handleSelectAdmin}
            onNavigateToNovaEmpresa={() => setActiveTab('nova-empresa')}
            onNavigateToNovaObra={() => setActiveTab('nova-obra')}
          />
        );
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 max-w-full overflow-x-hidden relative">
        <Header
          onLogoClick={handleResetToDashboard}
          onNavigateAdmin={handleSelectAdmin}
        />

        <main
          id="tab-content-container"
          className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 transition-all ${
            showBottomNav ? 'pb-24 sm:pb-28' : 'pb-6'
          }`}
        >
          {renderContent()}
        </main>

        {/* Botão Flutuante de Retorno ao Admin (Aparece sempre que um perfil simulado estiver ativo) */}
        {isSimulating && (
          <button
            type="button"
            onClick={restoreRealRole}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[999] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-2xl border-2 border-emerald-300 flex items-center gap-2 cursor-pointer animate-bounce transition-all hover:scale-105"
            title="Sair do modo de simulação e voltar ao Administrador"
          >
            <ShieldAlert className="w-5 h-5 text-emerald-200" />
            <span>Voltar p/ Admin ({role})</span>
          </button>
        )}

        {showBottomNav && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </div>
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;