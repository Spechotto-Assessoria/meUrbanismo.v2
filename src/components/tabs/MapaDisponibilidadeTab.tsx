import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lote } from '../../types';
import { apiService } from '../../services/supabase';
import {
  Map,
  CheckCircle,
  Clock,
  Lock,
  MapPin,
  X,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  UserCheck
} from 'lucide-react';

export const MapaDisponibilidadeTab: React.FC = () => {
  const { activeObra, isAdmin, isCorretor, isMasterAdmin } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [buscaQuadra, setBuscaQuadra] = useState('');
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `meurbanismo_lotes_mapa_${activeObra?.id || 'default'}`;

  const loadData = async () => {
    if (!activeObra) return;
    setLoading(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLotes(JSON.parse(saved));
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    const data = await apiService.getLotes(activeObra.id);
    // Se a lista estiver vazia, gera 4 quadras com 8 lotes cada para o mapa interativo
    if (data.length === 0) {
      const demoLotes: Lote[] = [];
      const quadras = ['Quadra A', 'Quadra B', 'Quadra C', 'Quadra D'];
      quadras.forEach((q) => {
        for (let i = 1; i <= 8; i++) {
          const area = 300 + (i % 3) * 50;
          const status = i <= 3 ? 'disponivel' : i <= 5 ? 'reservado' : 'vendido';
          demoLotes.push({
            id: `lote-${q}-${i}`,
            obra_id: activeObra.id,
            quadra: q,
            numero: String(i).padStart(2, '0'),
            area_m2: area,
            frente_m: 12,
            fundo_m: area / 12,
            valor_m2: 600,
            valor_total: area * 600,
            status: status as any,
            topografia: 'Plano'
          });
        }
      });
      setLotes(demoLotes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoLotes));
    } else {
      setLotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id]);

  const handleUpdateStatus = (novoStatus: any) => {
    if (!selectedLote) return;
    const atualizados = lotes.map(l => l.id === selectedLote.id ? { ...l, status: novoStatus } : l);
    setLotes(atualizados);
    setSelectedLote({ ...selectedLote, status: novoStatus });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
  };

  const lotesFiltrados = lotes.filter(l => {
    const statusNormalizado = (l.status || '').toLowerCase();
    const filtroNormalizado = filtroStatus.toLowerCase();
    const matchStatus = filtroStatus === 'TODOS' || statusNormalizado === filtroNormalizado;
    const termo = buscaQuadra.toLowerCase();
    const matchBusca = !buscaQuadra || (l.quadra || '').toLowerCase().includes(termo) || (l.numero || '').includes(termo);
    return matchStatus && matchBusca;
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'disponivel':
      case 'disponível':
        return { label: 'Disponível', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', btn: 'bg-emerald-500' };
      case 'reservado':
        return { label: 'Reservado', bg: 'bg-amber-50 text-amber-800 border-amber-200', btn: 'bg-amber-500' };
      case 'vendido':
        return { label: 'Vendido', bg: 'bg-slate-100 text-slate-500 border-slate-200', btn: 'bg-slate-400' };
      default:
        return { label: 'Disponível', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', btn: 'bg-emerald-500' };
    }
  };

  const formatBRL = (v?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  const quadrasUnicas = Array.from(new Set(lotesFiltrados.map(l => l.quadra || 'Quadra A')));

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-fadeIn">
      
      {/* HEADER DO MAPA */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Implantação Urbanística
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Tempo Real
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" /> Mapa de Disponibilidade Interativo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clique sobre qualquer lote para visualizar dimensões, R$/m², valor global ou alterar status
          </p>
        </div>

        {/* LEGENDA DE CORES */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponível
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reservado
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Vendido
          </span>
        </div>
      </div>

      {/* FILTROS & BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Quadra ou Número do Lote..."
            value={buscaQuadra}
            onChange={e => setBuscaQuadra(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {['TODOS', 'Disponível', 'Reservado', 'Vendido'].map(st => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filtroStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* GRADE INTERATIVA DE QUADRAS E LOTES */}
      <div className="space-y-6">
        {quadrasUnicas.map(quadraNome => {
          const lotesDaQuadra = lotesFiltrados.filter(l => (l.quadra || 'Quadra A') === quadraNome);

          return (
            <div key={quadraNome} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> {quadraNome}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {lotesDaQuadra.length} lotes listados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {lotesDaQuadra.map(lote => {
                  const badge = getStatusBadge(lote.status);
                  const isSelected = selectedLote?.id === lote.id;

                  return (
                    <button
                      key={lote.id}
                      type="button"
                      onClick={() => setSelectedLote(lote)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black text-slate-800">
                          Lote {lote.numero}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${badge.btn}`}></span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold text-slate-700">{lote.area_m2} m²</div>
                        <div className="text-[10px] font-extrabold text-blue-900 truncate">
                          {formatBRL(lote.valor_total)}
                        </div>
                      </div>

                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-center border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DETALHES DO LOTE */}
      {selectedLote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedLote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase">
                {selectedLote.quadra}
              </span>
              <h3 className="text-lg font-black text-slate-900">Lote {selectedLote.numero}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Área Privativa</span>
                <strong className="text-base text-slate-900">{selectedLote.area_m2} m²</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Valor por m²</span>
                <strong className="text-base text-slate-900">{formatBRL(selectedLote.valor_m2 || 600)}/m²</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Dimensões (Frente x Fundo)</span>
                <strong className="text-slate-800">{selectedLote.frente_m || 12}m × {selectedLote.fundo_m || 25}m</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Topografia</span>
                <strong className="text-slate-800">{selectedLote.topografia || 'Plano'}</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Valor de Tabela</span>
              <span className="text-2xl font-black text-blue-950">{formatBRL(selectedLote.valor_total)}</span>
            </div>

            {/* AÇÕES DE STATUS (DISPONÍVEL, RESERVADO, VENDIDO) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Alterar Status do Lote:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('disponivel')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    (selectedLote.status || '').toLowerCase() === 'disponivel'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'
                  }`}
                >
                  Disponível
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('reservado')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    (selectedLote.status || '').toLowerCase() === 'reservado'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border-slate-200'
                  }`}
                >
                  Reservado
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('vendido')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    (selectedLote.status || '').toLowerCase() === 'vendido'
                      ? 'bg-slate-700 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Vendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
