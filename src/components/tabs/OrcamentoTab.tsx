import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OrcamentoItem } from '../../types';
import { apiService } from '../../services/supabase';
import { SkeletonTable } from '../common/SkeletonLoader';
import { 
  DollarSign, 
  UploadCloud, 
  Plus, 
  FileSpreadsheet, 
  CheckCircle, 
  TrendingUp, 
  Filter, 
  Sparkles,
  X
} from 'lucide-react';

export const OrcamentoTab: React.FC = () => {
  const { activeObra, isAdmin } = useAuth();
  const [orcamentos, setOrcamentos] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Novo item form state
  const [novoItem, setNovoItem] = useState<Partial<OrcamentoItem>>({
    categoria: 'Terraplanagem',
    descricao: '',
    unidade: 'm³',
    quantidade: 100,
    valor_unitario: 50,
    percentual_executado: 0
  });

  const loadData = async () => {
    if (!activeObra) return;
    setLoading(true);
    const data = await apiService.getOrcamentos(activeObra.id);
    setOrcamentos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id]);

  const totalOrcado = orcamentos.reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalExecutado = orcamentos.reduce((acc, curr) => acc + curr.valor_executado, 0);
  const percentualGeral = totalOrcado > 0 ? ((totalExecutado / totalOrcado) * 100).toFixed(1) : '0.0';
  const saldoRestante = totalOrcado - totalExecutado;

  const categorias = ['TODAS', ...Array.from(new Set(orcamentos.map(i => i.categoria)))];

  const itensFiltrados = categoriaFiltro === 'TODAS' 
    ? orcamentos 
    : orcamentos.filter(i => i.categoria === categoriaFiltro);

  const handleSimularImportacao = () => {
    setImportStatus('Processando arquivo Base64 e convertendo matriz de custos...');
    setTimeout(() => {
      setImportStatus('Sincronizando itens com o Cronograma Físico-Financeiro...');
      setTimeout(() => {
        setImportStatus('Sucesso! 6 itens importados e cronograma sincronizado.');
        setTimeout(() => {
          setShowImportModal(false);
          setImportStatus(null);
          loadData();
        }, 1200);
      }, 1000);
    }, 1200);
  };

  const handleSalvarNovoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObra || !novoItem.descricao) return;

    const qtd = Number(novoItem.quantidade) || 0;
    const valUnit = Number(novoItem.valor_unitario) || 0;
    const valTotal = qtd * valUnit;
    const percExec = Number(novoItem.percentual_executado) || 0;
    const valExec = (valTotal * percExec) / 100;

    const itemSalvo: OrcamentoItem = {
      id: `orc-${Date.now()}`,
      obra_id: activeObra.id,
      codigo_sinapi: novoItem.codigo_sinapi || 'SINAPI-AUTO',
      categoria: novoItem.categoria as any || 'Terraplanagem',
      descricao: novoItem.descricao,
      unidade: novoItem.unidade || 'un',
      quantidade: qtd,
      valor_unitario: valUnit,
      valor_total: valTotal,
      percentual_executado: percExec,
      valor_executado: valExec,
      data_atualizacao: new Date().toISOString().split('T')[0]
    };

    await apiService.saveOrcamento(itemSalvo);
    await loadData();
    setShowAddModal(false);
    setNovoItem({
      categoria: 'Terraplanagem',
      descricao: '',
      unidade: 'm³',
      quantidade: 100,
      valor_unitario: 50,
      percentual_executado: 0
    });
  };

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* TOTALIZADORES FINANCEIROS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
            Orçamento Global Previsto
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            100% da planilha contratada
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-brand-500/30 shadow-glow-sm">
          <div className="text-[11px] font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
            Total Medido / Executado
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-300 mt-1">
            R$ {totalExecutado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            {percentualGeral}% do custo total realizado
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-850 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            Saldo a Executar
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            R$ {saldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {(100 - Number(percentualGeral)).toFixed(1)}% pendente de medição
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES E FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold pl-1">
            <Filter className="w-3.5 h-3.5" />
          </span>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoriaFiltro === cat
                  ? 'bg-brand-500 text-white shadow-glow-sm'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-400" />
              Importar Planilha (Base64)
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-xs font-semibold text-white shadow-glow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Item
            </button>
          </div>
        )}
      </div>

      {/* LISTA COMPACTA ADAPTADA PARA MOBILE */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="space-y-3">
          {itensFiltrados.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
            >
              {/* Linha 1: Categoria, Código e Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20 font-semibold">
                  {item.categoria}
                </span>
                {item.codigo_sinapi && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    SINAPI: {item.codigo_sinapi}
                  </span>
                )}
              </div>

              {/* Linha 2: Descrição */}
              <div className="text-sm font-semibold text-white leading-snug">
                {item.descricao}
              </div>

              {/* Linha 3: Quantidade, Valor Unitário e Valor Total */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-[10px] block">Quantidade</span>
                  <span className="font-bold text-slate-200">
                    {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Preço Unitário</span>
                  <span className="font-bold text-slate-200">
                    R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                  <span className="text-slate-400 text-[10px] block">Total Orçado</span>
                  <span className="font-black text-brand-300 text-sm">
                    R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso do Item */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    Executado: R$ {item.valor_executado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`font-bold ${item.percentual_executado >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {item.percentual_executado}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.percentual_executado >= 100 ? 'bg-emerald-400' : 'bg-brand-500'}`}
                    style={{ width: `${item.percentual_executado}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO BASE64 COM SINCRONIZAÇÃO */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Importar Orçamento & Cronograma</h3>
                <p className="text-xs text-slate-400">Sincronização automática via Base64 / Edge Function</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-navy-950 border border-dashed border-slate-700 text-center space-y-3">
              <UploadCloud className="w-10 h-10 text-brand-400 mx-auto animate-bounce" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Selecione o arquivo da planilha (XLSX, CSV ou PDF)</p>
                <p className="text-[10px] text-slate-400 mt-1">Converte automaticamente em Base64 para sincronizar custos e prazos.</p>
              </div>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv,.pdf" 
                className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white hover:file:bg-brand-600 cursor-pointer"
              />
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSimularImportacao}
                disabled={!!importStatus}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 shadow-glow disabled:opacity-50"
              >
                Processar & Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ITEM MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white">Adicionar Item ao Orçamento</h3>

            <form onSubmit={handleSalvarNovoItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Categoria / Disciplina</label>
                <select
                  value={novoItem.categoria}
                  onChange={e => setNovoItem({ ...novoItem, categoria: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white focus:outline-none focus:border-brand-400"
                >
                  <option value="Terraplanagem">Terraplanagem</option>
                  <option value="Drenagem Pluvial">Drenagem Pluvial</option>
                  <option value="Pavimentação Asfáltica">Pavimentação Asfáltica</option>
                  <option value="Rede de Água">Rede de Água</option>
                  <option value="Rede de Esgoto">Rede de Esgoto</option>
                  <option value="Rede Elétrica e Iluminação">Rede Elétrica e Iluminação</option>
                  <option value="Muros e Portaria">Muros e Portaria</option>
                  <option value="Paisagismo e Urbanismo">Paisagismo e Urbanismo</option>
                  <option value="Serviços Preliminares">Serviços Preliminares</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição do Serviço / Insumo</label>
                <textarea
                  rows={2}
                  required
                  value={novoItem.descricao}
                  onChange={e => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  placeholder="Ex: Escavação mecânica de valas para drenagem pluvial..."
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unidade</label>
                  <input
                    type="text"
                    value={novoItem.unidade}
                    onChange={e => setNovoItem({ ...novoItem, unidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={novoItem.quantidade}
                    onChange={e => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Preço Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoItem.valor_unitario}
                    onChange={e => setNovoItem({ ...novoItem, valor_unitario: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código SINAPI / Referência</label>
                <input
                  type="text"
                  placeholder="Ex: SINAPI 93402"
                  value={novoItem.codigo_sinapi || ''}
                  onChange={e => setNovoItem({ ...novoItem, codigo_sinapi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
