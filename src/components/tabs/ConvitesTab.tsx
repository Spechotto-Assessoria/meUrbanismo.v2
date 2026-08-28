import React, { useState, useEffect } from 'react';
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
    Edit3,
    X,
    Save,
    ArrowLeft,
    MapPin
} from 'lucide-react';
import { UserRole } from '../../types';

export interface Convite {
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
    quadraLote?: string;
    statusCadastro?: 'PENDENTE' | 'COMPLETO';
}

interface ConvitesTabProps {
    onBackToDashboard?: () => void;
}

const STORAGE_KEY = 'meurbanismo_convites_v1';

export const ConvitesTab: React.FC<ConvitesTabProps> = ({ onBackToDashboard }) => {
    const { obras } = useAuth();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Estados do Formulário
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [quadraLote, setQuadraLote] = useState('');
    const [obraId, setObraId] = useState(obras[0]?.id || '1');
    const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');

    // Estado de Edição de Convite
    const [editingConvite, setEditingConvite] = useState<Convite | null>(null);

    // Carrega do localStorage ou inicializa
    const [convites, setConvites] = useState<Convite[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao ler convites salvos:', e);
            }
        }
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return [
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
                linkAcceso: `${baseUrl}/?email=rennan_seidl%40hotmail.com&obra=1#/convite`,
                statusCadastro: 'COMPLETO',
                quadraLote: ''
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(convites));
    }, [convites]);

    const [filtroRole, setFiltroRole] = useState<string>('TODOS');
    const [filtroObra, setFiltroObra] = useState<string>('TODAS');
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            alert('Por favor, informe o e-mail do convidado.');
            return;
        }

        const jaExiste = convites.some(c => c.email.toLowerCase() === cleanEmail);
        if (jaExiste) {
            alert(`O e-mail "${cleanEmail}" já possui um convite gerado! Você pode editá-lo ou reenviá-lo na lista abaixo.`);
            return;
        }

        const baseUrl = window.location.origin;
        const obraSelecionada = obras.find(o => o.id === obraId) || obras[0];

        // Gera o link usando parâmetro seguro que não quebra o roteamento da Vercel
        const linkSeguro = `${baseUrl}/?email=${encodeURIComponent(cleanEmail)}&obra=${obraSelecionada?.id}#/convite`;

        const newConvite: Convite = {
            id: Date.now().toString(),
            email: cleanEmail,
            nome: nome.trim(),
            telefone: telefone.trim(),
            quadraLote: role === 'CLIENTE_COMPRADOR' ? quadraLote.trim() : '',
            obraId: obraSelecionada?.id || '1',
            obraNome: obraSelecionada?.nome || 'Empreendimento',
            role,
            ativo: true,
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
            linkAcceso: linkSeguro,
            statusCadastro: 'PENDENTE'
        };

        setConvites([newConvite, ...convites]);
        setEmail('');
        setNome('');
        setTelefone('');
        setQuadraLote('');
        alert('Convite gerado e salvo com sucesso!');
    };

    const handleToggleAtivo = (id: string) => {
        setConvites(convites.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
    };

    const handleChangeRole = (id: string, newRole: UserRole) => {
        setConvites(convites.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    role: newRole,
                    quadraLote: newRole === 'CLIENTE_COMPRADOR' ? c.quadraLote : ''
                };
            }
            return c;
        }));
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja realmente excluir este convite/acesso?')) {
            setConvites(convites.filter(c => c.id !== id));
        }
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConvite) return;

        setConvites(convites.map(c => c.id === editingConvite.id ? editingConvite : c));
        setEditingConvite(null);
        alert('Convite atualizado com sucesso!');
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

    const convitesFiltrados = convites.filter(c => {
        const matchRole = filtroRole === 'TODOS' || c.role === filtroRole;
        const matchObra = filtroObra === 'TODAS' || c.obraId === filtroObra;
        return matchRole && matchObra;
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">

            {/* BOTÃO VOLTAR AO DASHBOARD E CABEÇALHO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                {onBackToDashboard && (
                    <button
                        type="button"
                        onClick={onBackToDashboard}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
                    </button>
                )}

                <div className="flex items-center gap-3 text-blue-600">
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

                {/* EXIBE QUADRA E LOTE APENAS SE FOR CLIENTE / COMPRADOR */}
                {role === 'CLIENTE_COMPRADOR' && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 animate-fadeIn">
                        <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Quadra e Lote Adquirido (Opcional)
                        </label>
                        <input
                            type="text"
                            value={quadraLote}
                            onChange={e => setQuadraLote(e.target.value)}
                            placeholder="Ex: Quadra B - Lote 14"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white focus:outline-hidden"
                        />
                    </div>
                )}

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

            {/* PAINEL DE CONVITES CADASTRADOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Convites & Acessos Gerados ({convitesFiltrados.length})
                    </h2>

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

                {/* LISTA DE CARDS */}
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
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${c.statusCadastro === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {c.statusCadastro === 'COMPLETO' ? 'Cadastro Completo' : 'Cadastro Pendente'}
                                            </span>
                                            {!c.ativo && (
                                                <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <Lock className="w-3 h-3" /> Bloqueado
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {c.nome ? `${c.nome} • ` : ''} Empreendimento: <strong className="text-slate-700">{c.obraNome}</strong>
                                            {c.role === 'CLIENTE_COMPRADOR' && c.quadraLote && (
                                                <span className="ml-2 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                    {c.quadraLote}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* TOGGLE ATIVO / BLOQUEADO */}
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
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">Perfil:</span>
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

                                    {/* ABAS LIBERADAS */}
                                    <div className="flex flex-wrap gap-1">
                                        {getAbasPreview(c.role).map((aba, i) => (
                                            <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                                {aba}
                                            </span>
                                        ))}
                                    </div>

                                    {/* BOTÕES DE AÇÃO */}
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
                                            onClick={() => setEditingConvite(c)}
                                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200 transition-colors cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Editar
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

            {/* MODAL DE EDIÇÃO DE CONVITE */}
            {editingConvite && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative my-auto">
                        <button
                            type="button"
                            onClick={() => setEditingConvite(null)}
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-amber-600" /> Editar Cadastro do Convidado
                        </h3>

                        <form onSubmit={handleSaveEdit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                                <input
                                    type="email"
                                    value={editingConvite.email}
                                    onChange={e => setEditingConvite({ ...editingConvite, email: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={editingConvite.nome || ''}
                                    onChange={e => setEditingConvite({ ...editingConvite, nome: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    value={editingConvite.telefone || ''}
                                    onChange={e => setEditingConvite({ ...editingConvite, telefone: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                />
                            </div>

                            {/* EXIBE CAMPO DE QUADRA E LOTE APENAS PARA CLIENTES */}
                            {editingConvite.role === 'CLIENTE_COMPRADOR' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quadra / Lote (Ex: Quadra C - Lote 05)</label>
                                    <input
                                        type="text"
                                        value={editingConvite.quadraLote || ''}
                                        onChange={e => setEditingConvite({ ...editingConvite, quadraLote: e.target.value })}
                                        placeholder="Quadra e Lote do cliente"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Status do Cadastro</label>
                                <select
                                    value={editingConvite.statusCadastro || 'PENDENTE'}
                                    onChange={e => setEditingConvite({ ...editingConvite, statusCadastro: e.target.value as any })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                                >
                                    <option value="PENDENTE">Pendente (Aguardando conclusão do cliente)</option>
                                    <option value="COMPLETO">Completo (Dados preenchidos)</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingConvite(null)}
                                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" /> Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};