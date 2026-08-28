import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { TabId } from './types';

// Importação das Abas
import { DashboardTab } from './components/tabs/Dashboard';
import { CronogramaTab } from './components/tabs/CronogramaTab';
import { OrcamentoTab } from './components/tabs/OrcamentoTab';
import { ViabilidadeTab } from './components/tabs/ViabilidadeTab';
import { AcompanhamentoTab } from './components/tabs/AcompanhamentoTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { RelatoriosTab } from './components/tabs/RelatoriosTab';
import { MapaDisponibilidadeTab } from './components/tabs/MapaDisponibilidadeTab';
import { AdminTab } from './components/tabs/AdminTab';
import { NovaEmpresaTab } from './components/tabs/NovaEmpresaTab';
import { NovaObraTab } from './components/tabs/NovaObraTab';

export const App: React.FC = () => {
  const { canAccessTab, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito</h3>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            Sua conta atual não possui permissão para visualizar o conteúdo desta seção.
          </p>
          <button
            onClick={() => switchRole('ADMINISTRADOR')}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          >
            Alternar para Administrador
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigate={(tab: TabId) => setActiveTab(tab)} />;
      case 'cronograma':
      case 'andamento':
        return <CronogramaTab />;
      case 'orcamento':
        return <OrcamentoTab />;
      case 'viabilidade':
        return <ViabilidadeTab />;
      case 'acompanhamento':
        return <AcompanhamentoTab />;
      case 'documentos':
        return <DocumentosTab />;
      case 'relatorios':
        return <RelatoriosTab />;
      case 'mapa':
      case 'vendas':
        return <MapaDisponibilidadeTab />;
      case 'admin':
        return <AdminTab />;
      case 'nova-empresa':
        return <NovaEmpresaTab onSuccess={() => setActiveTab('admin')} />;
      case 'nova-obra':
        return <NovaObraTab onSuccess={() => setActiveTab('dashboard')} />;
      default:
        return <DashboardTab onNavigate={(tab: TabId) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mb-16 md:mb-0">
          {renderContent()}
        </main>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;