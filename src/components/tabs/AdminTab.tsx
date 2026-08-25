import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Convite, Empresa, Obra, UserRole } from '../../types';
import { apiService } from '../../services/supabase';
import { 
  Settings, 
  UserPlus, 
  Building2, 
  Send, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  Plus, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  X
} from 'lucide-react';

export const AdminTab: React.FC = () => {
  const { activeObra, obras, refreshObras } = useAuth();
  const [convites, setConvites] = useState<Convite[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Estados dos formulários de criação
  const [showNovoConviteModal, setShowNovoConviteModal] = useState(false);
  const [showNovaObraModal, setShowNovaObraModal] = useState(false);

  const [novoConvite, setNovoConvite] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'CORRETOR' as UserRole,
    obra_id: activeObra?.id || ''
  });

  const [novaObra, setNovaObra] = useState<Partial<Obra>>({
    nome: '',
    tipo: 'Loteamento Fechado',
    cidade: 'São José do Rio Preto',
    uf: 'SP',
    data_inicio: '2025-01-01',
    data_previsao: '2026-12-31',
    area_total_m2: 200000,
    total_lotes: 250,
    vgv_total: 35000000,
    custo_orcado: 12000000,
    custo_realizado: 0,
    percentual_concluido: 0,
    status: 'Planejamento'
  });

  const loadData = async () => {
    setLoading(true);
    const [emp, convs] = await Promise.all([
      apiService.getEmpresa(),
      apiService.getConvites(activeObra?.id || '')
    ]);
    setEmpresa(emp);
    setConvites(convs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeObra?.id]);

  const handleGerarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoConvite.nome || !novoConvite.email) return;

    const token = `tok_${Math.random().toString(36).substring(2, 10)}`;
    const conviteCriado: Convite = {
      id: `conv-${Date.now()}`,
      obra_id: novoConvite.obra_id || activeObra?.id || 'obra-001',
      nome: novoConvite.nome,
      email: novoConvite.email,
      telefone: novoConvite.telefone,
      role: novoConvite.role,
      token: token,
      status: 'Pendente',
      link_acesso: `https://meurbanismo.com.br/acesso?token=${token}`,
      created_at: new Date().toISOString(),
      expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    await apiService.createConvite(conviteCriado);
    await loadData();
    setShowNovoConviteModal(false);
    setNovoConvite({
      nome: '',
      email: '',
      telefone: '',
      role: 'CORRETOR',
      obra_id: activeObra?.id || ''
    });
  };

  const handleSalvarNovaObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaObra.nome || !novaObra.cidade) return;

    const obraCriada: Obra = {
      id: `obra-${Date.now()}`,
      empresa_id: empresa?.id || 'emp-001',
      nome: novaObra.nome,
      tipo: novaObra.tipo as any || 'Loteamento Fechado',
      cidade: novaObra.cidade,
      uf: novaObra.uf || 'SP',
      status: 'Planejamento',
      data_inicio: novaObra.data_inicio || '2025-01-01',
      data_previsao: novaObra.data_previsao || '2026-12-31',
      percentual_concluido: 0,
      area_total_m2: Number(novaObra.area_total_m2) || 100000,
      total_lotes: Number(novaObra.total_lotes) || 150,
      lotes_disponiveis: Number(novaObra.total_lotes) || 150,
      lotes_reservados: 0,
      lotes_vendidos: 0,
      vgv_total: Number(novaObra.vgv_total) || 20000000,
      custo_orcado: Number(novaObra.custo_orcado) || 8000000,
      custo_realizado: 0,
      imagem_capa: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
      endereco_completo: `${novaObra.cidade} - ${novaObra.uf}`
    };

    await apiService.saveObra(obraCriada);
    await refreshObras();
    await loadData();
    setShowNovaObraModal(false);
  };

  const handleCopiarLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* HEADER DA ABA ADMIN */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" />
            Painel Geral de Administração
          </h3>
          <p className="text-xs text-slate-400">
            Gerenciamento de convites inteligentes, empresa construtora e obras cadastradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNovaObraModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-brand-400" />
            Cadastrar Obra
          </button>

          <button
            onClick={() => setShowNovoConviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-xs font-semibold text-white shadow-glow transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Novo Convite Inteligente
          </button>
        </div>
      </div>

      {/* SEÇÃO: MÓDULO DE CONVITES INTELIGENTES */}
      <div className="p-5 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-4 shadow-glass">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-400" />
            <h4 className="text-sm font-bold text-white">Convites Emitidos & Acessos</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {convites.length} convite(s) gerado(s)
          </span>
        </div>

        <div className="space-y-3">
          {convites.map((conv) => {
            const mensagemWhats = `Olá ${conv.nome}! Você recebeu um convite de acesso para o sistema meUrbanismo (${activeObra?.nome}) com perfil de ${conv.role}.\n\nAcesse seu painel pelo link seguro:\n${conv.link_acesso}`;
            const linkWhats = `https://wa.me/${conv.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(mensagemWhats)}`;

            return (
              <div
                key={conv.id}
                className="p-4 rounded-2xl bg-navy-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      {conv.nome}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {conv.role}
                      </span>
                    </h5>
                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-brand-400" /> {conv.email}</span>
                      {conv.telefone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" /> {conv.telefone}</span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    conv.status === 'Aceito'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {conv.status}
                  </span>
                </div>

                {/* BOTÕES DE ENVIO RÁPIDO DO CONVITE (WHATSAPP, E-MAIL, COPIAR) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Token: {conv.token}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopiarLink(conv.link_acesso, conv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedToken === conv.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedToken === conv.id ? 'Copiado!' : 'Copiar Link'}
                    </button>

                    {conv.telefone && (
                      <a
                        href={linkWhats}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => alert(`Convite disparado para o e-mail: ${conv.email}`)}
                      className="px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Reenviar E-mail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO: DADOS DA EMPRESA CONSTRUTORA */}
      {empresa && (
        <div className="p-5 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              Empresa / Construtora Responsável
            </h4>
            <span className="text-xs text-brand-300 font-semibold">{empresa.crea_cau}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Razão Social / Nome Fantasia</span>
              <strong className="text-white text-sm">{empresa.nome}</strong>
              <span className="block text-slate-400">CNPJ: {empresa.cnpj}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Responsável Técnico Principal</span>
              <strong className="text-slate-200">{empresa.responsavel_tecnico}</strong>
              <span className="block text-slate-400">{empresa.email} • {empresa.telefone}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO CONVITE INTELIGENTE */}
      {showNovoConviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowNovoConviteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Criar Convite Inteligente</h3>
                <p className="text-xs text-slate-400">Gera token com envio via WhatsApp e E-mail</p>
              </div>
            </div>

            <form onSubmit={handleGerarConvite} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Fontes"
                  value={novoConvite.nome}
                  onChange={e => setNovoConvite({ ...novoConvite, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">E-mail do Usuário</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: carlos.investidor@gmail.com"
                  value={novoConvite.email}
                  onChange={e => setNovoConvite({ ...novoConvite, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Telefone / WhatsApp (com DDD)</label>
                <input
                  type="text"
                  placeholder="Ex: (17) 99123-4567"
                  value={novoConvite.telefone}
                  onChange={e => setNovoConvite({ ...novoConvite, telefone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Perfil de Acesso (RBAC)</label>
                <select
                  value={novoConvite.role}
                  onChange={e => setNovoConvite({ ...novoConvite, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                >
                  <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor (Orçamento, Cronograma e Viabilidade)</option>
                  <option value="CORRETOR">Corretor de Imóveis (Vendas, Mapa e Andamento)</option>
                  <option value="CLIENTE_COMPRADOR">Cliente / Comprador (Andamento e Fotos Públicas)</option>
                  <option value="ADMINISTRADOR">Administrador Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Empreendimento Vinculado</label>
                <select
                  value={novoConvite.obra_id}
                  onChange={e => setNovoConvite({ ...novoConvite, obra_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                >
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome} ({o.cidade} - {o.uf})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovoConviteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Gerar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA OBRA */}
      {showNovaObraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowNovaObraModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white">Cadastrar Novo Empreendimento</h3>

            <form onSubmit={handleSalvarNovaObra} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Loteamento / Obra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Residencial Quinta do Golfe"
                  value={novaObra.nome}
                  onChange={e => setNovaObra({ ...novaObra, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo de Empreendimento</label>
                  <select
                    value={novaObra.tipo}
                    onChange={e => setNovaObra({ ...novaObra, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="Loteamento Fechado">Loteamento Fechado</option>
                    <option value="Loteamento Aberto">Loteamento Aberto</option>
                    <option value="Condomínio de Chácaras">Condomínio de Chácaras</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cidade - UF</label>
                  <input
                    type="text"
                    value={novaObra.cidade}
                    onChange={e => setNovaObra({ ...novaObra, cidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total de Lotes</label>
                  <input
                    type="number"
                    value={novaObra.total_lotes}
                    onChange={e => setNovaObra({ ...novaObra, total_lotes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">VGV Total Previsto (R$)</label>
                  <input
                    type="number"
                    value={novaObra.vgv_total}
                    onChange={e => setNovaObra({ ...novaObra, vgv_total: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovaObraModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Salvar Empreendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
