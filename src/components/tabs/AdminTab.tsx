import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Send,
  Mail,
  Phone,
  Building2,
  UserPlus,
  Trash2,
  Copy,
  MessageSquare,
  Check,
  Search,
  Lock,
  Unlock,
  Shield,
  Users
} from 'lucide-react';
import { UserRole } from '../../types';

interface ConviteItem {
  id: string;
  email: string;
  nome?: string;
  telefone?: string;
  obraId: string;
  obraNome: string;
  role: UserRole;
  ativo: boolean;
  dataCriacao: string;
  token: string;
}

export const AdminTab: React.FC = () => {
  const { obras } = useAuth();

  // Campos do formulário
  const [emailInput, setEmailInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [selectedObraId, setSelectedObraId] = useState(obras[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CLIENTE_COMPRADOR');

  // Filtros da lista
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('TODOS');
  const [filterObra, setFilterObra] = useState<string>('TODOS');

  // Feedback de cópia
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lista Mock de Convites
  const [convites, setConvites] = useState<ConviteItem[]>([
    {
      id: '1',
      email: 'rennan_seidl@hotmail.com',
      nome: 'Rennan Seidl',
      telefone: '(17) 99999-8888',
      obraId: obras[0]?.id || '1',
      obraNome: obras[0]?.nome || 'Residencial Reserva dos Ipês',
      role: 'PROPRIETARIO_INVESTIDOR',
      ativo: true,
      dataCriacao: '01/08/2026',
      token: 'conv-8921-xyz'
    },
    {
      id: '2',
      email: 'corretor.parceiro@gmail.com',
      nome: 'Marcos Vinicius',
      telefone: '(17) 98888-7777',
      obraId: obras[1]?.id || '2',
      obraNome: obras[1]?.nome || 'Villa Bella Urban Park',
      role: 'CORRETOR',
      ativo: true,
      dataCriacao: '15/08/2026',
      token: 'conv-3341-abc'
    }
  ]);

  // Abas visualizadas por perfil
  const getAbasPermitidas = (r: UserRole) => {
    switch (r) {
      case 'PROPRIETARIO_INVESTIDOR':
        return ['Orçamento', 'Cronograma', 'Andamento', 'Viabilidade', 'Acompanhamento', 'Projetos/Docs', 'Relatórios', 'Mapa Disponibilidade', 'Vendas'];
      case 'CORRETOR':
        return ['Andamento', 'Acompanhamento', 'Projetos/Docs', 'Mapa Disponibilidade', 'Vendas'];
      case 'CLIENTE_COMPRADOR':
        return ['Andamento', 'Acompanhamento', 'Projetos/Docs', 'Mapa Disponibilidade'];
      case 'ADMINISTRADOR':
        return ['Todas as Abas do Sistema'];
    }
  };

  // Criar novo convite
  const handleCreateConvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      alert('Por favor, informe ao menos o e-mail do convidado.');
      return;
    }

    const obra = obras.find(o => o.id === selectedObraId);
    const novo: ConviteItem = {
      id: Date.now().toString(),
      email: emailInput.trim(),
      nome: nomeInput.trim() || undefined,
      telefone: telefoneInput.trim() || undefined,
      obraId: selectedObraId,
      obraNome: obra ? obra.nome : 'Empreendimento Selecionado',
      role: selectedRole,
      ativo: true,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      token: `conv-${Math.floor(Math.random() * 90000) + 10000}`
    };

    setConvites([novo, ...convites]);
    setEmailInput('');
    setNomeInput('');
    setTelefoneInput('');
    alert('Convite gerado com sucesso!');
  };

  // Alternar Status (Bloquear / Ativar)
  const toggleStatus = (id: string) => {
    setConvites(convites.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
  };

  // Alterar Perfil do Usuário
  const handleChangeRole = (id: string, newRole: UserRole) => {
    setConvites(convites.map(c => c.id === id ? { ...c, role: newRole } : c));
  };

  // Excluir Convite
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este acesso?')) {
      setConvites(convites.filter(c => c.id !== id));
    }
  };

  // Gerar Link do Convite
  const getInviteLink = (c: ConviteItem) => {
    return `https://app.meurbanismo.com.br/autenticacao?invite_token=${c.token}&email=${encodeURIComponent(c.email)}&obra=${c.obraId}`;
  };

  // Copiar Link
  const handleCopyLink = (c: ConviteItem) => {
    navigator.clipboard.writeText(getInviteLink(c));
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Disparar WhatsApp
  const handleSendWhatsapp = (c: ConviteItem) => {
    const nomePessoa = c.nome ? c.nome : 'Olá';
    const link = getInviteLink(c);
    const mensagem = `${nomePessoa}! Você está recebendo o acesso à plataforma meUrbanismo, nela você poderá acessar todos os dados do *${c.obraNome}*!\n\nCrie seu login com o mesmo e-mail cadastrado (*${c.email}*) e crie sua nova senha no link abaixo:\n${link}`;

    const phoneClean = c.telefone ? c.telefone.replace(/\D/g, '') : '';
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=55${phoneClean}&text=${encodeURIComponent(mensagem)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
  };

  // Disparar E-mail
  const handleSendEmail = (c: ConviteItem) => {
    const assunto = `Acesso à Plataforma meUrbanismo - ${c.obraNome}`;
    const link = getInviteLink(c);
    const corpo = `Olá!\n\nVocê recebeu o acesso à plataforma meUrbanismo para acompanhar o empreendimento: ${c.obraNome}.\n\nPara acessar, crie sua senha utilizando o e-mail: ${c.email}\n\nClique no link para ativar sua conta: ${link}`;

    window.open(`mailto:${c.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  };

  // Filtragem
  const convitesFiltrados = convites.filter(c => {
    const matchSearch = c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = filterRole === 'TODOS' || c.role === filterRole;
    const matchObra = filterObra === 'TODOS' || c.obraId === filterObra;
    return matchSearch && matchRole && matchObra;
  });

  return (
    <div className="p-3.5 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">

      {/* CABEÇALHO */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestão de Convites & Acessos</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Crie links de acesso, vincule a uma empresa/obra e controle as abas de cada perfil.
            </p>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE NOVO CONVITE */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" /> Novo Convite
        </h2>

        <form onSubmit={handleCreateConvite} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail do Convidado *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo (Opcional)</label>
              <input
                type="text"
                placeholder="Nome do cliente/corretor"
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone (Opcional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="(17) 99999-9999"
                  value={telefoneInput}
                  onChange={(e) => setTelefoneInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa / Obra *</label>
              <select
                value={selectedObraId}
                onChange={(e) => setSelectedObraId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              >
                {obras.map(o => (
                  <option key={o.id} value={o.id}>{o.nome} ({o.cidade}-{o.uf})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Perfil de Acesso *</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white font-semibold"
              >
                <option value="CLIENTE_COMPRADOR">Comprador / Adquirente</option>
                <option value="CORRETOR">Corretor de Imóveis</option>
                <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 mt-2">
            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" /> Abas que ficarão visíveis para este perfil:
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {getAbasPermitidas(selectedRole).map((aba, idx) => (
                <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  {aba}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" /> Criar e Gerar Link de Convite
          </button>
        </form>
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" /> Convites Gerados ({convitesFiltrados.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por e-mail ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <select
              value={filterObra}
              onChange={(e) => setFilterObra(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="TODOS">Todas as Obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="TODOS">Todos os Perfis</option>
              <option value="CLIENTE_COMPRADOR">Compradores</option>
              <option value="CORRETOR">Corretores</option>
              <option value="PROPRIETARIO_INVESTIDOR">Investidores</option>
            </select>
          </div>
        </div>

        {/* LISTA DE CONVITES */}
        <div className="space-y-3">
          {convitesFiltrados.map((c) => (
            <div key={c.id} className={`p-4 rounded-2xl bg-white border transition-all ${c.ativo ? 'border-slate-200 shadow-xs' : 'border-red-200 bg-red-50/20 opacity-75'
              }`}>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{c.email}</span>
                    {c.nome && <span className="text-xs text-slate-500">({c.nome})</span>}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {c.ativo ? 'Acesso Ativo' : 'Bloqueado'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-600" /> {c.obraNome}
                    </span>
                    <span>• Criado em: {c.dataCriacao}</span>
                    {c.telefone && (
                      <span className="flex items-center gap-1">
                        • <Phone className="w-3 h-3 text-emerald-600" /> {c.telefone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={c.role}
                    onChange={(e) => handleChangeRole(c.id, e.target.value as UserRole)}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="CLIENTE_COMPRADOR">Comprador</option>
                    <option value="CORRETOR">Corretor</option>
                    <option value="PROPRIETARIO_INVESTIDOR">Investidor</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => toggleStatus(c.id)}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${c.ativo
                        ? 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    title={c.ativo ? 'Bloquear Acesso' : 'Ativar Acesso'}
                  >
                    {c.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="py-2.5 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Abas Ativas no Perfil:
                </div>
                <div className="flex flex-wrap gap-1">
                  {getAbasPermitidas(c.role).map((aba, idx) => (
                    <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {aba}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsapp(c)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Enviar por WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendEmail(c)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Enviar E-mail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(c)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedId === c.id ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Excluir Convite"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}

          {convitesFiltrados.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Nenhum convite encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};