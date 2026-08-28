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
import { EstudoViabilidadeTab } from './components/tabs/EstudoViabilidadeTab';
import { TabId } from './types';

const MainApp: React.FC = () => {
  const { canAccessTab, role, activeObra, setActiveObra } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | 'estudo-viabilidade'>('dashboard');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [lastEmpresaCreatedId, setLastEmpresaCreatedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (
      activeTab !== 'dashboard' &&
      activeTab !== 'admin' &&
      activeTab !== 'nova-empresa' &&
      activeTab !== 'nova-obra' &&
      activeTab !== 'estudo-viabilidade' &&
      canAccessTab &&
      !canAccessTab(activeTab as TabId)
    ) {
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
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFormPage = activeTab === 'nova-empresa' || activeTab === 'nova-obra' || activeTab === 'estudo-viabilidade';
  const showBottomNav = Boolean(activeObra && activeTab !== 'dashboard' && activeTab !== 'admin' && !isFormPage);

  const renderContent = () => {
    if (activeTab === 'estudo-viabilidade') {
      return <EstudoViabilidadeTab onBack={() => setActiveTab('dashboard')} />;
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
          onNavigateToViabilidade={() => setActiveTab('estudo-viabilidade')}
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
            onNavigateToViabilidade={() => setActiveTab('estudo-viabilidade')}
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
          className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 transition-all ${showBottomNav ? 'pb-24 sm:pb-28' : 'pb-6'
            }`}
        >
          {renderContent()}
        </main>

        {showBottomNav && (
          <BottomNav activeTab={activeTab as TabId} onTabChange={(t) => setActiveTab(t)} />
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