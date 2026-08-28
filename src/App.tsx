import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';

import { DashboardTab } from './components/tabs/Dashboard';
import { ConvitesTab } from './components/tabs/ConvitesTab';
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
import { ShieldAlert } from 'lucide-react';

const MainApp: React.FC = () => {
  const { canAccessTab, role, activeObra, setActiveObra, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab, canAccessTab]);

  // Função garantida para voltar SEMPRE para a tela inicial
  const handleGoToDashboard = () => {
    setActiveObra(null as any);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectObra = () => {
    setActiveTab('andamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAdmin = () => {
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showBottomNav = Boolean(activeObra && activeTab !== 'dashboard' && activeTab !== 'admin');

  const renderContent = () => {
    // Se a aba for 'dashboard' OU não houver obra selecionada (exceto na aba 'admin')
    if (activeTab === 'dashboard' || (!activeObra && activeTab !== 'admin')) {
      return (
        <DashboardTab
          onSelectObra={handleSelectObra}
          onSelectAdmin={handleSelectAdmin}
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
      case 'admin':
        return <ConvitesTab />;
      default:
        return (
          <DashboardTab
            onSelectObra={handleSelectObra}
            onSelectAdmin={handleSelectAdmin}
          />
        );
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 max-w-full overflow-x-hidden relative">
        <Header
          onLogoClick={handleGoToDashboard}
          onNavigateAdmin={() => {
            setActiveTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <main
          id="tab-content-container"
          className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 transition-all ${showBottomNav ? 'pb-24 sm:pb-28' : 'pb-6'
            }`}
        >
          {renderContent()}
        </main>

        {/* BOTÃO FLUTUANTE DE SIMULAÇÃO */}
        {role !== 'ADMINISTRADOR' && (
          <button
            type="button"
            onClick={() => switchRole('admin')}
            className="fixed top-16 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-full shadow-lg border border-emerald-400 flex items-center gap-1.5 cursor-pointer animate-bounce"
            title="Voltar ao modo Administrador"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Voltar p/ Admin</span>
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