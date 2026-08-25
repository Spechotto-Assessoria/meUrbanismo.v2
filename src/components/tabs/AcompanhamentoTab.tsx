import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FotoObra, DiarioObra, MedicaoItem } from '../../types';
import { apiService } from '../../services/supabase';
import { SkeletonCard } from '../common/SkeletonLoader';
import { 
  Camera, 
  BookOpen, 
  Ruler, 
  Sun, 
  CloudSun, 
  Users, 
  Truck, 
  Eye, 
  EyeOff, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X,
  Sparkles
} from 'lucide-react';

export const AcompanhamentoTab: React.FC = () => {
  const { activeObra, role, isAdmin, canViewFinancials } = useAuth();
  
  // Sub-abas dentro de Acompanhamento
  const [subAba, setSubAba] = useState<'fotos' | 'diario' | 'medicoes'>('fotos');
  
  const [fotos, setFotos] = useState<FotoObra[]>([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de modais
  const [selectedFoto, setSelectedFoto] = useState<FotoObra | null>(null);
  const [showAddFotoModal, setShowAddFotoModal] = useState(false);
  const [showAddDiarioModal, setShowAddDiarioModal] = useState(false);
  const [filtroCategoriaFoto, setFiltroCategoriaFoto] = useState<string>('TODAS');

  // Form states
  const [novaFoto, setNovaFoto] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Evolução Geral' as any,
    url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1000&q=80',
    visivel_convidados: true
  });

  const [novoDiario, setNovoDiario] = useState({
    clima_manha: 'Ensolarado' as any,
    clima_tarde: 'Ensolarado' as any,
    condicao_solo: 'Praticável' as any,
    efetivo_proprio: 4,
    efetivo_terceirizado: 25,
    equipamentos: '2x Caminhões Basculantes, 1x Escavadeira CAT',
    atividades_realizadas: '',
    ocorrencias: ''
  });

  const loadData = async () => {
    if (!activeObra) return;
    setLoading(true);
    // Para corretores e clientes, buscar apenas fotos públicas
    const apenasConvidados = !canViewFinancials;
    const [f, d, m] = await Promise.all([
      apiService.getFotos(activeObra.id, apenasConvidados),
      apiService.getDiarios(activeObra.id),
      apiService.getMedicoes(activeObra.id)
    ]);
    setFotos(f);
    setDiarios(d);
    setMedicoes(m);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id, role]);

  const handleToggleVisibilidadeFoto = async (foto: FotoObra) => {
    if (!isAdmin) return;
    const atualizada = { ...foto, visivel_convidados: !foto.visivel_convidados };
    await apiService.saveFoto(atualizada);
    await loadData();
  };

  const handleSalvarFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObra || !novaFoto.titulo) return;

    const item: FotoObra = {
      id: `ft-${Date.now()}`,
      obra_id: activeObra.id,
      url: novaFoto.url,
      titulo: novaFoto.titulo,
      descricao: novaFoto.descricao,
      categoria: novaFoto.categoria,
      data_registro: new Date().toISOString().split('T')[0],
      visivel_convidados: novaFoto.visivel_convidados,
      autor_nome: 'Eng. Rennan Spechotto'
    };

    await apiService.saveFoto(item);
    await loadData();
    setShowAddFotoModal(false);
    setNovaFoto({
      titulo: '',
      descricao: '',
      categoria: 'Evolução Geral',
      url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1000&q=80',
      visivel_convidados: true
    });
  };

  const handleSalvarDiario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObra || !novoDiario.atividades_realizadas) return;

    const item: DiarioObra = {
      id: `diario-${Date.now()}`,
      obra_id: activeObra.id,
      data: new Date().toISOString().split('T')[0],
      clima_manha: novoDiario.clima_manha,
      clima_tarde: novoDiario.clima_tarde,
      condicao_solo: novoDiario.condicao_solo,
      efetivo_proprio: Number(novoDiario.efetivo_proprio) || 0,
      efetivo_terceirizado: Number(novoDiario.efetivo_terceirizado) || 0,
      equipamentos_ativos: novoDiario.equipamentos.split(',').map(s => s.trim()),
      atividades_realizadas: novoDiario.atividades_realizadas,
      ocorrencias: novoDiario.ocorrencias,
      responsavel_nome: 'Eng. Rennan Spechotto',
      created_at: new Date().toISOString()
    };

    await apiService.saveDiario(item);
    await loadData();
    setShowAddDiarioModal(false);
  };

  const fotosFiltradas = filtroCategoriaFoto === 'TODAS'
    ? fotos
    : fotos.filter(f => f.categoria === filtroCategoriaFoto);

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* SELETOR DE SUB-ABAS (FOTOS, DIÁRIO, MEDIÇÕES) */}
      <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => setSubAba('fotos')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            subAba === 'fotos'
              ? 'bg-brand-500 text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          Galeria de Fotos
        </button>

        {canViewFinancials && (
          <button
            onClick={() => setSubAba('diario')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              subAba === 'diario'
                ? 'bg-brand-500 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Diário de Obra
          </button>
        )}

        {canViewFinancials && (
          <button
            onClick={() => setSubAba('medicoes')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              subAba === 'medicoes'
                ? 'bg-brand-500 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Medições
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonCard className="h-64" />
      ) : subAba === 'fotos' ? (
        /* ================= 1. GALERIA DE FOTOS ================= */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['TODAS', 'Evolução Geral', 'Terraplanagem', 'Drenagem', 'Pavimentação', 'Aéreo / Drone'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoriaFoto(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    filtroCategoriaFoto === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-navy-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddFotoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-glow"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Foto
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotosFiltradas.map((foto) => (
              <div
                key={foto.id}
                className="group relative rounded-3xl overflow-hidden bg-navy-900 border border-slate-800 shadow-md hover:border-brand-500/40 transition-all"
              >
                <div 
                  className="aspect-video w-full overflow-hidden cursor-pointer relative"
                  onClick={() => setSelectedFoto(foto)}
                >
                  <img
                    src={foto.url}
                    alt={foto.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Badge Categoria */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-navy-950/80 backdrop-blur-md text-[10px] font-bold text-brand-300 border border-slate-700">
                    {foto.categoria}
                  </span>

                  {/* Badge de Visibilidade para Convidados */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibilidadeFoto(foto);
                      }}
                      className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-colors ${
                        foto.visivel_convidados
                          ? 'bg-emerald-500/80 text-white border border-emerald-400'
                          : 'bg-amber-500/80 text-navy-950 border border-amber-400'
                      }`}
                      title="Clique para alternar visibilidade para convidados"
                    >
                      {foto.visivel_convidados ? (
                        <>
                          <Eye className="w-3 h-3" /> 🌐 Convidados
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> 🔒 Admin
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="text-sm font-bold text-white leading-tight">{foto.titulo}</h4>
                  {foto.descricao && (
                    <p className="text-xs text-slate-400 line-clamp-2">{foto.descricao}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>{new Date(foto.data_registro).toLocaleDateString('pt-BR')}</span>
                    <span>{foto.autor_nome}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LIGHTBOX MODAL PARA VISUALIZAÇÃO AMPLIADA */}
          {selectedFoto && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
              onClick={() => setSelectedFoto(null)}
            >
              <div 
                className="relative max-w-3xl w-full bg-navy-900 rounded-3xl overflow-hidden border border-slate-700 p-4 space-y-3"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedFoto(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-navy-950/80 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedFoto.url}
                  alt={selectedFoto.titulo}
                  className="w-full max-h-[70vh] object-contain rounded-2xl"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedFoto.titulo}</h3>
                  <p className="text-xs text-slate-300 mt-1">{selectedFoto.descricao}</p>
                  <div className="flex items-center justify-between text-[11px] text-brand-400 mt-2">
                    <span>Data: {new Date(selectedFoto.data_registro).toLocaleDateString('pt-BR')}</span>
                    <span>Registrado por: {selectedFoto.autor_nome}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : subAba === 'diario' ? (
        /* ================= 2. DIÁRIO DE OBRA ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Livro Diário de Obras</h3>
              <p className="text-xs text-slate-400">Registros diários de clima, mão de obra e equipamentos</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddDiarioModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-glow"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Registro Diário
              </button>
            )}
          </div>

          <div className="space-y-3">
            {diarios.map((d) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {new Date(d.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-brand-400">
                    {d.responsavel_nome}
                  </span>
                </div>

                {/* Condições Climáticas e Mão de Obra */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Manhã / Tarde</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> {d.clima_manha} / {d.clima_tarde}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Condição Solo</span>
                    <span className="font-semibold text-emerald-400 mt-0.5 block">
                      {d.condicao_solo}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Efetivo Operacional</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-brand-400" /> {d.efetivo_proprio} próprios + {d.efetivo_terceirizado} terc.
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Equipamentos</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" /> {d.equipamentos_ativos.length} máquinas
                    </span>
                  </div>
                </div>

                {/* Atividades Realizadas */}
                <div>
                  <h5 className="text-xs font-bold text-slate-300">Atividades do Dia:</h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-navy-950/60 p-2.5 rounded-xl border border-slate-800">
                    {d.atividades_realizadas}
                  </p>
                </div>

                {d.ocorrencias && (
                  <div>
                    <h5 className="text-xs font-bold text-amber-400">Ocorrências / Observações:</h5>
                    <p className="text-xs text-slate-400 mt-0.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {d.ocorrencias}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= 3. MEDIÇÕES DE EMPREITEIROS ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Boletins de Medição de Empreiteiros</h3>
              <p className="text-xs text-slate-400">Controle financeiro acumulado por fornecedor de serviços</p>
            </div>
          </div>

          <div className="space-y-3">
            {medicoes.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                      Medição nº {m.numero_medicao}
                    </span>
                    <span className="font-bold text-white">{m.fornecedor_empreiteiro}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.status === 'Aprovada'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  {m.servico_executado}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Valor Medido no Período</span>
                    <span className="font-bold text-brand-300">
                      R$ {m.valor_medicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Acumulado</span>
                    <span className="font-bold text-white">
                      R$ {m.valor_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({m.percentual_medido_acumulado}%)
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">Período</span>
                    <span className="text-slate-300 font-medium">
                      {new Date(m.periodo_inicio).toLocaleDateString('pt-BR')} a {new Date(m.periodo_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR FOTO */}
      {showAddFotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setShowAddFotoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white">Cadastrar Foto da Obra</h3>

            <form onSubmit={handleSalvarFoto} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título do Registro</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conclusão da pavimentação da Rua 03"
                  value={novaFoto.titulo}
                  onChange={e => setNovaFoto({ ...novaFoto, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Categoria</label>
                <select
                  value={novaFoto.categoria}
                  onChange={e => setNovaFoto({ ...novaFoto, categoria: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                >
                  <option value="Evolução Geral">Evolução Geral</option>
                  <option value="Terraplanagem">Terraplanagem</option>
                  <option value="Drenagem">Drenagem</option>
                  <option value="Pavimentação">Pavimentação</option>
                  <option value="Portaria">Portaria</option>
                  <option value="Aéreo / Drone">Aéreo / Drone</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">URL da Imagem / Upload Storage</label>
                <input
                  type="text"
                  value={novaFoto.url}
                  onChange={e => setNovaFoto({ ...novaFoto, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-navy-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="visivelCheck"
                  checked={novaFoto.visivel_convidados}
                  onChange={e => setNovaFoto({ ...novaFoto, visivel_convidados: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-500"
                />
                <label htmlFor="visivelCheck" className="text-xs text-slate-300 font-semibold">
                  Visível para Convidados e Clientes Compradores
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFotoModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Salvar Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR DIÁRIO */}
      {showAddDiarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setShowAddDiarioModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white">Novo Relatório Diário de Obra</h3>

            <form onSubmit={handleSalvarDiario} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Clima Manhã</label>
                  <select
                    value={novoDiario.clima_manha}
                    onChange={e => setNovoDiario({ ...novoDiario, clima_manha: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="Ensolarado">Ensolarado</option>
                    <option value="Nublado">Nublado</option>
                    <option value="Chuvoso">Chuvoso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Clima Tarde</label>
                  <select
                    value={novoDiario.clima_tarde}
                    onChange={e => setNovoDiario({ ...novoDiario, clima_tarde: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="Ensolarado">Ensolarado</option>
                    <option value="Nublado">Nublado</option>
                    <option value="Chuvoso">Chuvoso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Efetivo Próprio</label>
                  <input
                    type="number"
                    value={novoDiario.efetivo_proprio}
                    onChange={e => setNovoDiario({ ...novoDiario, efetivo_proprio: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Efetivo Terceirizado</label>
                  <input
                    type="number"
                    value={novoDiario.efetivo_terceirizado}
                    onChange={e => setNovoDiario({ ...novoDiario, efetivo_terceirizado: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Equipamentos em Operação</label>
                <input
                  type="text"
                  value={novoDiario.equipamentos}
                  onChange={e => setNovoDiario({ ...novoDiario, equipamentos: e.target.value })}
                  placeholder="Ex: 2x Caminhão Basculante, 1x Rolo Compactador"
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Atividades Realizadas</label>
                <textarea
                  rows={3}
                  required
                  value={novoDiario.atividades_realizadas}
                  onChange={e => setNovoDiario({ ...novoDiario, atividades_realizadas: e.target.value })}
                  placeholder="Descreva o andamento dos serviços do dia..."
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDiarioModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Salvar Diário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
