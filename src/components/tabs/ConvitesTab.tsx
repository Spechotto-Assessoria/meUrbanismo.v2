import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Send,
    Mail,
    User as UserIcon,
    Building2,
    Phone,
    Copy,
    Check,
    Trash2,
    Share2,
    MessageCircle,
    Filter,
    ShieldCheck,
    Lock,
    Unlock
} from 'lucide-react';
import { UserRole } from '../../types';

interface Convite {
    id: string;
    email: string;
    nome?: string;
    telefone?: string;
    obraId: string;
    obraNome: string;
    role: UserRole;
    ativo: boolean;
    dataCriacao: string;
    linkAcceso: string;
}

export const ConvitesTab: React.FC = () => {
    const { obras } = useAuth();

    // Formulário
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [obraId, setObraId] = useState(obras[0]?.id || '');
    const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');

    // Estados da Lista de Convites e Filtros
    const [convites, setConvites] = useState<Convite[]>([
        {
            id: '1',
            email: 'rennan_seidl@hotmail.com',
            nome: 'Rennan Spechotto',
            telefone: '(17) 99999-8888',
            obraId: obras[0]?.id || '1',
            obraNome: obras[0]?.nome || 'Residencial Reserva dos Ipês',
            role: 'PROPRIETARIO_INVESTIDOR',
            ativo: true,
            dataCriacao: '01/08/2026',
            linkAcceso: 'https://meurbanismo.app/convite?token=abc123xyz'
        }
    ]);

    const [filtroRole, setFiltroRole] = useState<string>('TODOS');
    const [filtroObra, setFiltroObra] = useState<string>('TODAS');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Mapeamento visual das abas que cada perfil ganha acesso
    const getAbasPreview = (r: UserRole) => {
        switch (r) {
            case 'CLIENTE_COMPRADOR':
                return ['Andamento da Obra', 'Acompanhamento', 'Projetos e Documentos', 'Mapa de Disponibilidade'];
            case 'CORRETOR':
                return ['Andamento da Obra', 'Acompanhamento', 'Projetos e Documentos', 'Mapa de Disponibilidade', 'Vendas'];
            case 'PROPRIETARIO_INVESTIDOR':
                return ['Orçamento', 'Cronograma', 'Andamento da Obra', 'Viabilidade', 'Acompanhamento', 'Projetos e Documentos', 'Relatórios', 'Mapa de Disponibilidade', 'Vendas'];
            case 'ADMINISTRADOR':
                return ['Acesso Total Irrestrito + Módulo de Convites & Gestão'];
        }
    };

    const handleCreateConvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            alert('Por favor, informe o e-mail do convidado.');
            return;
        }

        const obraSelecionada = obras.find(o => o.id === obraId) || obras[0];
        const newConvite: Convite = {
            id: Date.now().toString(),
            email,
            nome,
            telefone,
            obraId: obraSelecionada?.id || '1',
            obraNome: obraSelecionada?.nome || 'Empreendimento',
            role,
            ativo: true,
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
            linkAcceso: `https://meurbanismo.app/convite?email=${encodeURIComponent(email)}&obra=${obraSelecionada?.id}`
        };

        setConvites([newConvite, ...convites]);
        setEmail('');
        setNome('');
        setTelefone('');
        alert('Convite gerado com sucesso!');
    };

    const handleToggleAtivo = (id: string) => {
        setConvites(convites.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
    };

    const handleChangeRole = (id: string, newRole: UserRole) => {
        setConvites(convites.map(c => c.id === id ? { ...c, role: newRole } : c));
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja realmente excluir este convite/acesso?')) {
            setConvites(convites.filter(c => c.id !== id));
        }
    };

    const handleCopyLink = (c: Convite) => {
        navigator.clipboard.writeText(c.linkAcceso);
        setCopiedId(c.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSendWhatsApp = (c: Convite) => {
        const mensagem = encodeURIComponent(
            `Olá ${c.nome || ''}!\n\nVocê está recebendo o acesso à plataforma *meUrbanismo* para acompanhar o empreendimento *${c.obraNome}*.\n\nAcesse o link abaixo, crie seu acesso com este e-mail (${c.email}) e cadastre sua nova senha:\n${c.linkAcceso}`
        );
        const num = c.telefone ? c.telefone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${num}?text=${mensagem}`, '_blank');
    };

    const handleSendEmail = (c: Convite) => {
        const assunto = encodeURIComponent(`Acesso à plataforma meUrbanismo - ${c.obraNome}`);
        const corpo = encodeURIComponent(
            `Olá ${c.nome || ''}!\n\nVocê foi convidado para acessar a plataforma meUrbanismo no empreendimento ${c.obraNome}.\n\nClique no link para criar sua senha com o e-mail (${c.email}):\n${c.linkAcceso}`
        );
        window.open(`mailto:${c.email}?subject=${assunto}&body=${corpo}`, '_blank');
    };

    // Filtros
    const convitesFiltrados = convites.filter(c => {
        const matchRole = filtroRole === 'TODOS' || c.role === filtroRole;
        const matchObra = filtroObra === 'TODAS' || c.obraId === filtroObra;
        return matchRole && matchObra;
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">

            {/* CABEÇALHO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3 text-blue-600 mb-1">
                    <Send className="w-6 h-6" />
                    <h1 className="text-xl font-bold text-slate-900">Gestão de Convites & Acessos</h1>
                </div>
                <p className="text-xs text-slate-500">
                    Crie links de acesso personalizados, vincule a uma obra e controle as permissões exatas de cada perfil convidado.
                </p>
            </div>

            {/* FORMULÁRIO DE NOVO CONVITE */}
            <form onSubmit={handleCreateConvite} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" /> Gerar Novo Convite
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail do Convidado *</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="exemplo@email.com"
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo (Opcional)</label>
                        <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                placeholder="Nome do cliente/corretor"
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / WhatsApp (Opcional)</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={telefone}
                                onChange={e => setTelefone(e.target.value)}
                                placeholder="(17) 99999-8888"
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Empreendimento / Obra *</label>
                        <div className="relative">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <select
                                value={obraId}
                                onChange={e => setObraId(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden bg-white"
                            >
                                {obras.map(o => (
                                    <option key={o.id} value={o.id}>{o.nome} ({o.cidade})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Perfil do Convidado *</label>
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden bg-white font-medium text-slate-800"
                    >
                        <option value="CLIENTE_COMPRADOR">Comprador / Adquirente (Cliente)</option>
                        <option value="CORRETOR">Corretor de Imóveis</option>
                        <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor</option>
                    </select>
                </div>

                {/* PREVIEW DAS ABAS LIBERADAS */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-600 mb-2">Abas liberadas para este perfil:</div>
                    <div className="flex flex-wrap gap-1.5">
                        {getAbasPreview(role).map((aba, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                {aba}
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                    <Send className="w-4 h-4" /> Criar e Gerar Link de Convite
                </button>
            </form>

            {/* PAINEL DE CONVITES CADASTRADOS & FILTROS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Convites & Acessos Gerados ({convitesFiltrados.length})
                    </h2>

                    {/* FILTROS GRUPAIS */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={filtroRole}
                            onChange={e => setFiltroRole(e.target.value)}
                            className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                        >
                            <option value="TODOS">Todos os Perfis</option>
                            <option value="CLIENTE_COMPRADOR">Clientes</option>
                            <option value="CORRETOR">Corretores</option>
                            <option value="PROPRIETARIO_INVESTIDOR">Investidores</option>
                        </select>

                        <select
                            value={filtroObra}
                            onChange={e => setFiltroObra(e.target.value)}
                            className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium max-w-[140px] truncate"
                        >
                            <option value="TODAS">Todas Obras</option>
                            {obras.map(o => (
                                <option key={o.id} value={o.id}>{o.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* LISTA DE CARDS DE CONVITE */}
                <div className="space-y-3">
                    {convitesFiltrados.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Nenhum convite encontrado com os filtros selecionados.</p>
                    ) : (
                        convitesFiltrados.map(c => (
                            <div key={c.id} className={`p-4 rounded-xl border transition-all ${c.ativo ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            {c.email}
                                            {!c.ativo && (
                                                <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <Lock className="w-3 h-3" /> Acesso Bloqueado
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {c.nome ? `${c.nome} • ` : ''} Empreendimento: <strong className="text-slate-700">{c.obraNome}</strong>
                                        </div>
                                    </div>

                                    {/* CHAVE TOGGLE PARA ATIVAR / BLOQUEAR */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-semibold text-slate-600">
                                            {c.ativo ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAtivo(c.id)}
                                            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${c.ativo ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-3 space-y-3">
                                    {/* SELETOR DE MUDANÇA RÁPIDA DE PERFIL */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">Perfil de Acesso:</span>
                                            <select
                                                value={c.role}
                                                onChange={e => handleChangeRole(c.id, e.target.value as UserRole)}
                                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 font-bold bg-slate-50 text-slate-800"
                                            >
                                                <option value="CLIENTE_COMPRADOR">Comprador / Adquirente</option>
                                                <option value="CORRETOR">Corretor de Imóveis</option>
                                                <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor</option>
                                            </select>
                                        </div>

                                        <span className="text-[10px] text-slate-400">Criado em: {c.dataCriacao}</span>
                                    </div>

                                    {/* PREVIEW DAS ABAS DO CONVITADO */}
                                    <div className="flex flex-wrap gap-1">
                                        {getAbasPreview(c.role).map((aba, i) => (
                                            <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                                {aba}
                                            </span>
                                        ))}
                                    </div>

                                    {/* BOTÕES DE ENVIO E AÇÃO RÁPIDA */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handleSendWhatsApp(c)}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Enviar por WhatsApp
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSendEmail(c)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
                                        >
                                            <Mail className="w-3.5 h-3.5 text-blue-600" /> Enviar por E-mail
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(c)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                                        >
                                            {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                            {copiedId === c.id ? 'Copiado!' : 'Copiar Link'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(c.id)}
                                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer ml-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Excluir
                                        </button>
                                    </div>

                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>

        </div>
    );
};