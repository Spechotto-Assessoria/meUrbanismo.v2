import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TabId } from '../../types';
import { LayoutDashboard, HardHat, Map, FileText, CalendarDays } from 'lucide-react';

export interface BottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onSelectTab?: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onSelectTab }) => {
  const { canAccessTab } = useAuth();
  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cronograma', label: 'Avanço', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'acompanhamento', label: 'Diário', icon: <HardHat className="w-5 h-5" /> },
    { id: 'mapa', label: 'Mapa', icon: <Map className="w-5 h-5" /> },
    { id: 'documentos', label: 'Docs', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 md:hidden z-40 flex items-center justify-around">
      {navItems.map((item) => {
        if (!canAccessTab(item.id)) return null;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};