import React, { useRef } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CalendarDays, 
  Camera, 
  FolderGit2, 
  PieChart, 
  Map, 
  ShoppingBag, 
  FileText, 
  Settings
} from 'lucide-react';
import { TabId } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { canAccessTab, isAdmin } = useAuth();
  const navContainerRef = useRef<HTMLDivElement>(null);

  const allTabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'andamento', label: 'Andamento', icon: <TrendingUp className="w-6 h-6" /> },
    { id: 'orcamento', label: 'Orçamento', icon: <DollarSign className="w-6 h-6" /> },
    { id: 'cronograma', label: 'Cronograma', icon: <CalendarDays className="w-6 h-6" /> },
    { id: 'acompanhamento', label: 'Acompanhamento', icon: <Camera className="w-6 h-6" /> },
    { id: 'documentos', label: 'Documentos', icon: <FolderGit2 className="w-6 h-6" /> },
    { id: 'viabilidade', label: 'Viabilidade', icon: <PieChart className="w-6 h-6" /> },
    { id: 'mapa', label: 'Mapa Lotes', icon: <Map className="w-6 h-6" />, badge: 'Em Breve' },
    { id: 'vendas', label: 'Vendas', icon: <ShoppingBag className="w-6 h-6" />, badge: 'Simulador' },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText className="w-6 h-6" /> },
    ...(isAdmin ? [{ id: 'admin' as TabId, label: 'Administração', icon: <Settings className="w-6 h-6" />, badge: 'VIP' }] : [])
  ];

  // Filtra abas conforme permissão do RBAC
  const visibleTabs = allTabs.filter(tab => canAccessTab(tab.id));

  const handleSelectTab = (tabId: TabId) => {
    onTabChange(tabId);

    // Navegação Inteligente: Rola suavemente até o container do conteúdo sem salto brusco
    requestAnimationFrame(() => {
      const container = document.getElementById('tab-content-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-2xl py-2 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div 
        ref={navContainerRef}
        className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-0.5 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex-shrink-0 snap-center min-w-[84px] sm:min-w-[96px] py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative group ${
                isActive 
                  ? 'bg-gradient-to-b from-brand-500/25 to-brand-600/10 text-brand-300 border border-brand-400/40 shadow-glow-sm scale-[1.03]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
              }`}
            >
              {/* Indicador de Barra Ativa Superior */}
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-brand-400 to-cyan-300 rounded-full shadow-glow"></div>
              )}

              {/* Badge Opcional */}
              {tab.badge && (
                <span className={`absolute -top-1.5 right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow ${
                  tab.badge === 'VIP' 
                    ? 'bg-emerald-500 text-slate-950' 
                    : tab.badge === 'Simulador' 
                    ? 'bg-brand-400 text-navy-950' 
                    : 'bg-amber-500 text-navy-950'
                }`}>
                  {tab.badge}
                </span>
              )}

              {/* Ícone de 24px */}
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-brand-400' : 'group-hover:scale-105'}`}>
                {tab.icon}
              </div>

              {/* Nome completo da aba sem cortes */}
              <span className={`text-[11px] font-semibold tracking-tight whitespace-nowrap leading-tight text-center ${
                isActive ? 'text-white font-bold' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
