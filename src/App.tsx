import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';

// Importação da nova aba Dashboard
import { DashboardTab } from './components/tabs/Dashboard';

import { AndamentoTab } from './components/tabs/AndamentoTab';
import { OrcamentoTab } from './components/tabs/OrcamentoTab';
import { CronogramaTab } from './components/tabs/CronogramaTab';
import { AcompanhamentoTab } from './components/tabs/AcompanhamentoTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { ViabilidadeTab } from './components/tabs/ViabilidadeTab';
import { MapaDisponibilidadeTab } from './components/tabs/MapaDisponibilidadeTab';
import { VendasTab } from './components/tabs/VendasTab';
import { RelatoriosTab } from './components/tabs/RelatoriosTab';
import { AdminTab } from './components/tabs/AdminTab';
import { TabId } from './types';

const MainApp: React.FC = () => {
  const { canAccessTab, role, activeObra, setActiveObra } = useAuth();

  // Define 'dashboard' como a aba inicial padrão
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Se o utilizador alternar para um papel sem acesso à aba atual, redireciona para 'dashboard'
  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab, canAccessTab]);

  // Função para limpar a obra selecionada e retornar ao Dashboard
  const handleGoToDashboard = () => {
    setActiveObra(null as any);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // Se não houver obra ativa ou a aba for 'dashboard', exibe a Dashboard inicial
    if (!activeObra || activeTab === 'dashboard') {
      return <DashboardTab />;
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
        return <AdminTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 max-w-full overflow-x-hidden">
        {/* Header Responsivo acionando o retorno à tela inicial ao clicar na logo */}
        <Header onLogoClick={handleGoToDashboard} />

        {/* Container Principal de Conteúdo */}
        <main
          id="tab-content-container"
          className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-24 sm:pb-28"
        >
          {renderContent()}
        </main>

        {/* Footer exibido apenas quando houver obra selecionada E fora do Dashboard */}
        {activeObra && activeTab !== 'dashboard' && (
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