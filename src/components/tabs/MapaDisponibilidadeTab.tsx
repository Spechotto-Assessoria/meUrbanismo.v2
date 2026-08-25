import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lote } from '../../types';
import { apiService } from '../../services/supabase';
import { ComingSoonCard } from '../common/ComingSoonCard';
import { 
  Map, 
  CheckCircle, 
  Clock, 
  Lock, 
  MapPin, 
  X, 
  Layers, 
  Sparkles,
  Search
} from 'lucide-react';

export const MapaDisponibilidadeTab: React.FC = () => {
  const { activeObra, isAdmin, isCorretor } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [buscaQuadra, setBuscaQuadra] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!activeObra) return;
      const data = await apiService.getLotes(activeObra.id);
      setLotes(data);
    };
    loadData();
  }, [activeObra?.id]);

  const lotesFiltrados = lotes.filter(l => {
    const matchStatus = filtroStatus === 'TODOS' || l.status === filtroStatus;
    const matchBusca = buscaQuadra === '' || l.quadra.toLowerCase().includes(buscaQuadra.toLowerCase()) || l.numero.includes(buscaQuadra);
    return matchStatus && matchBusca;
  });

  const getStatusColor = (status: Lote['status']) => {
    switch (status) {
      case 'Disponível':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'Reservado':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      case 'Vendido':
        return 'bg-slate-800 text-slate-400 border-slate-700/60 opacity-60';
      case 'Bloqueado':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const isUnlocked = isAdmin || isCorretor;

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* CARD TRANSLÚCIDO COM FITA 'EM BREVE' (OU MAPA COMPLETO SE LIBERADO) */}
      <ComingSoonCard
        title="Mapa de Disponibilidade Interativo"
        subtitle="Visualização geoespacial de quadras, topografia e status de cada lote em tempo real"
        description="O Mapa de Disponibilidade do meUrbanismo trará uma planta interativa em SVG/Leaflet com visualização 3D dos lotes, recuos, cotas altimétricas e reserva instantânea com envio de link para o cliente."
        icon={<Map className="w-8 h-8" />}
        badgeText="Em Breve"
        featuresList={[
          'Visualização de quadras e lotes em alta definição',
          'Filtro dinâmico por metragem, posição de sol e topografia',
          'Status em tempo real sincronizado com o Supabase',
          'Reserva de lote e geração de link de pagamento'
        ]}
        isUnlockedForAdmin={isUnlocked}
      >
        {/* CONTEÚDO LIBERADO PARA ADMIN E CORRETORES */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Map className="w-5 h-5 text-brand-400" />
                Painel de Disponibilidade de Lotes
              </h3>
              <p className="text-xs text-slate-400">
                Reserva, consulta de metragens e valores de tabela
              </p>
            </div>

            {/* LEGENDA DE STATUS */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponível
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reservado
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span> Vendido
              </span>
            </div>
          </div>

          {/* BUSCA E FILTROS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por Quadra ou Lote..."
                value={buscaQuadra}
                onChange={e => setBuscaQuadra(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-400"
              />
            </div>

            <div className="flex items-center gap-1">
              {['TODOS', 'Disponível', 'Reservado', 'Vendido'].map(st => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    filtroStatus === st
                      ? 'bg-brand-500 text-white'
                      : 'bg-navy-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* GRID DE LOTES INTERATIVO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lotesFiltrados.map((lote) => (
              <button
                key={lote.id}
                onClick={() => setSelectedLote(lote)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 space-y-1.5 ${getStatusColor(lote.status)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-tight">
                    Q{lote.quadra} • L{lote.numero}
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {lote.status}
                  </span>
                </div>

                <div className="text-sm font-black text-white">
                  R$ {lote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </div>

                <div className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>{lote.area_m2} m²</span>
                  <span>{lote.topografia}</span>
                </div>
              </button>
            ))}
          </div>

          {/* MODAL DETALHES DO LOTE */}
          {selectedLote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-md rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
                <button
                  onClick={() => setSelectedLote(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Quadra {selectedLote.quadra} - Lote {selectedLote.numero}
                    </h3>
                    <p className="text-xs text-brand-300 font-semibold">{activeObra?.nome}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-white">{selectedLote.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Área Total:</span>
                    <span className="font-bold text-slate-200">{selectedLote.area_m2} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dimensões:</span>
                    <span className="font-bold text-slate-200">{selectedLote.frente_m}m frente x {selectedLote.fundo_m}m fundo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Topografia:</span>
                    <span className="font-bold text-slate-200">{selectedLote.topografia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valor do m²:</span>
                    <span className="font-bold text-slate-200">R$ {selectedLote.valor_m2.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-bold">Valor Total:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      R$ {selectedLote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      alert(`Reserva simulada com sucesso para a Quadra ${selectedLote.quadra} Lote ${selectedLote.numero}!`);
                      setSelectedLote(null);
                    }}
                    className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 shadow-glow text-xs"
                  >
                    Simular Proposta de Venda deste Lote
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComingSoonCard>

    </div>
  );
};
