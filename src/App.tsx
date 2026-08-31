import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';
import { LoginModal } from './components/auth/LoginModal';

import { DashboardTab } from './components/tabs/Dashboard';
import { ConvitesTab } from './components/tabs/ConvitesTab';
import { NovaEmpresaTab } from './components/tabs/NovaEmpresaTab';
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
import { TabId } from './types';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { canAccessTab, canAccessObra, role, activeObra, setActiveObra, isMasterAdmin } = useAuth();
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
      setActiveTab(activeObra ? 'resumo' : 'dashboard');
    }
  }, [role, activeTab, canAccessTab, activeObra]);

  const handleResetToDashboard = () => {
    setActiveObra(null as any);
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
  const showBottomNav = Boolean(activeObra && activeTab !== 'dashboard' && activeTab !== 'admin' && !isFormPage);

  // Verificação de Acesso por Convite da Obra Ativa
  const hasAccessToActiveObra = activeObra ? canAccessObra(activeObra.id) : true;

  const renderContent = () => {
    // Calculadora Geral de Viabilidade (Global)
    if (activeTab === 'estudo-viabilidade') {
      return <EstudoViabilidadeTab onBack={() => setActiveTab('dashboard')} />;
    }

    // Formulário de Nova Empresa (Global Admin)
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

    // Formulário de Nova Obra (Global Admin)
    if (activeTab === 'nova-obra') {
      return (
        <NovaObraTab
          onBack={() => setActiveTab('dashboard')}
          onGoToNovaEmpresa={() => setActiveTab('nova-empresa')}
          preSelectedEmpresaId={lastEmpresaCreatedId}
        />
      );
    }

    // Gestão de Convites / Admin (Global Admin)
    if (activeTab === 'admin') {
      return <ConvitesTab />;
    }

    // Painel Geral de Obras Administradas
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
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <LoginModal />

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