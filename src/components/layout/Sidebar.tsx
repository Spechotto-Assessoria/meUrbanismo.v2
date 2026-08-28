import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TabId } from '../../types';
import {
    LayoutDashboard,
    CalendarDays,
    Calculator,
    TrendingUp,
    HardHat,
    FileText,
    PieChart,
    Map,
    ShieldCheck
} from 'lucide-react';

interface SidebarProps {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const { canAccessTab, isAdmin } = useAuth();

    const menuItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'cronograma', label: 'Cronograma Physical', icon: <CalendarDays className="w-4 h-4" /> },
        { id: 'orcamento', label: 'Orçamento Executivo', icon: <Calculator className="w-4 h-4" /> },
        { id: 'viabilidade', label: 'Estudo de Viabilidade', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'acompanhamento', label: 'Diário de Obra & Medição', icon: <HardHat className="w-4 h-4" /> },
        { id: 'documentos', label: 'Acervo de Documentos', icon: <FileText className="w-4 h-4" /> },
        { id: 'relatorios', label: 'Relatórios BI', icon: <PieChart className="w-4 h-4" /> },
        { id: 'mapa', label: 'Mapa de Lotes', icon: <Map className="w-4 h-4" /> },
    ];

    if (isAdmin) {
        menuItems.push({ id: 'admin', label: 'Painel Admin', icon: <ShieldCheck className="w-4 h-4" /> });
    }

    return (
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 hidden md:flex flex-col justify-between">
            <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Navegação Principal
                </div>
                {menuItems.map((item) => {
                    if (!canAccessTab(item.id)) return null;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};