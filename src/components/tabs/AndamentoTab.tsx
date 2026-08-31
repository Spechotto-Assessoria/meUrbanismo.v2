import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MacroEtapa } from '../../types';
import { apiService } from '../../services/supabase';
import {
  TrendingUp,
  Calendar,
  MapPin,
  CheckCircle2,
  Edit3,
  Save,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const AndamentoTab: React.FC = () => {
  const { activeObra, isMasterAdmin } = useAuth();
  const [etapas, setEtapas] = useState<MacroEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const STORAGE_KEY = `meurbanismo_andamento_etapas_${activeObra?.id || 'default'}`;

  useEffect(() => {
    const loadEtapas = async () => {
      if (!activeObra) return;
      setLoading(true);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setEtapas(JSON.parse(saved));
          setLoading(false);
          return;
        } catch (e) {
          console.error(e);
        }
      }

      const defaultEtapas = await apiService.getMacroEtapas();
      setEtapas(defaultEtapas);
      setLoading(false);
    };
    loadEtapas();
  }, [activeObra?.id]);

  const handleSalvarProgresso = () => {
    setSalvando(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etapas));
    setTimeout(() => {
      setSalvando(false);
      setEditando(false);
      setMensagemSucesso('Progresso físico atualizado com sucesso pela Spechotto!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    }, 500);
  };

  const handlePercentualChange = (id: string, novoValor: number) => {
    const clamped = Math.min(100, Math.max(0, novoValor));
    setEtapas(prev => prev.map(e => e.id === id ? { ...e, percentual_realizado: clamped } : e));
  };

  if (!activeObra) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        Nenhum empreendimento selecionado.
      </div>
    );
  }

  // Cálculo da média ponderada do progresso geral
  const pesoTotal = etapas.reduce((acc, curr) => acc + (curr.peso_orcamento || 10), 0) || 1;
  const progressoPonderado = etapas.reduce((acc, curr) => {
    const peso = curr.peso_orcamento || 10;
    const real = curr.percentual_realizado || 0;
    return acc + (real * peso);
  }, 0) / pesoTotal;

  const progressoGlobal = parseFloat(progressoPonderado.toFixed(1));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      
      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {mensagemSucesso}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Evolução Construtiva
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              {activeObra.tipo || 'Loteamento'}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">{activeObra.nome}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> {activeObra.cidade} - {activeObra.uf}
          </p>
        </div>

        {isMasterAdmin && (
          <div className="flex items-center gap-2">
            {editando ? (
              <button
                type="button"
                onClick={handleSalvarProgresso}
                disabled={salvando}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-blue-600" /> Atualizar Mensal (Spechotto)
              </button>
            )}
          </div>
        )}
      </div>

      {/* CARD PRINCIPAL DE PROGRESSO GERAL */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avanço Físico Global</span>
            <h2 className="text-3xl font-black text-slate-900">{progressoGlobal}% Concluído</h2>
          </div>
          <div className="text-right text-xs text-slate-500 hidden sm:block">
            <span>Última medição: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></span>
            <p className="text-[11px] text-slate-400">Spechotto Assessoria Técnica</p>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressoGlobal}%` }}
          />
        </div>
      </div>

      {/* ETAPAS DA OBRA */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Detalhamento por Macro Etapa
          </h3>
          <span className="text-xs text-slate-500">{etapas.length} etapas ativas</span>
        </div>

        <div className="space-y-4">
          {etapas.map((etapa) => {
            const perc = etapa.percentual_realizado || 0;
            const prev = etapa.percentual_previsto || 100;

            return (
              <div key={etapa.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{etapa.nome}</h4>
                    <span className="text-[10px] text-slate-500">
                      Peso no orçamento: {etapa.peso_orcamento}% • Previsto: {prev}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {editando ? (
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600">Realizado:</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={perc}
                          onChange={(e) => handlePercentualChange(etapa.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{perc}%</span>
                        <span className="text-[9px] text-slate-400 block">executado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      perc >= 100 ? 'bg-emerald-500' : perc > 50 ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};