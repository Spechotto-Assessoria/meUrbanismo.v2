import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/supabase';
import { supabase } from '../../lib/supabaseClient';
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
    MapPin,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { UserRole, Convite } from '../../types';

export const ConvitesTab: React.FC = () => {
    const { obras } = useAuth();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const defaultObraId = obras && obras.length > 0 ? obras[0].id : '';
    const defaultObraNome = obras && obras.length > 0 ? obras[0].nome : '';

    // Estados do Formulário
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [quadraLote, setQuadraLote] = useState('');
    const [obraId, setObraId] = useState(defaultObraId);
    const [role, setRole] = useState<UserRole>('CLIENTE_COMPRADOR');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Estado de Edição
    const [editingConvite, setEditingConvite] = useState<Convite | null>(null);
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);

    const [convites, setConvites] = useState<Convite[]>([]);
    const [carregando, setCarregando] = useState(true);

    const carregarConvites = async () => {
        setCarregando(true);
        const data = await dataService.getConvites();
        setConvites(data);
        setCarregando(false);
    };

    useEffect(() => {
        void carregarConvites();
    }, []);

    useEffect(() => {
        if (!obraId && defaultObraId) {
            setObraId(defaultObraId);
        }
    }, [defaultObraId, obraId]);

    const [filtroRole, setFiltroRole] = useState<string>('TODOS');
    const [filtroObra, setFiltroObra] = useState<string>('TODAS');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Envio automático de WhatsApp (via Edge Function + Z-API) — dispara a
    // mensagem a partir do número comercial conectado, sem usar o WhatsApp
    // pessoal do administrador.
    const [whatsappSendingId, setWhatsappSendingId] = useState<string | null>(null);
    const [whatsappFeedback, setWhatsappFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

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
            default:
                return [];
        }
    };

    const handleCreateConvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            alert('Por favor, informe o e-mail do convidado.');
            return;
        }

        if (!obraId) {
            alert('Selecione um empreendimento / obra antes de continuar.');
            return;
        }

        const jaExiste = convites.some(c => (c.email || '').toLowerCase() === cleanEmail && c.obra_id === obraId);
        if (jaExiste) {
            alert(`O e-mail "${cleanEmail}" já possui um convite gerado para esta obra! Você pode editá-lo ou reenviá-lo na lista abaixo.`);
            return;
        }

        const baseUrl = window.location.origin;
        const obraSelecionada = (obras || []).find(o => o.id === obraId);
        const linkSeguro = `${baseUrl}/?email=${encodeURIComponent(cleanEmail)}&obra=${obraId}#/convite`;

        setEnviando(true);
        try {
            const novoConvite = await dataService.saveConvite({
                obra_id: obraId,
                email: cleanEmail,
                nome: nome.trim(),
                telefone: telefone.trim(),
                role,
                quadraLote: role === 'CLIENTE_COMPRADOR' ? quadraLote.trim() : '',
                ativo: true,
                link_acesso: linkSeguro,
                statusCadastro: 'PENDENTE'
            } as any);

            setConvites(prev => [{ ...novoConvite, obraNome: obraSelecionada?.nome }, ...prev]);
            setEmail('');
            setNome('');
            setTelefone('');
            setQuadraLote('');
        } catch (err: any) {
            setErro(err?.message || 'Não foi possível gerar o convite. Verifique suas permissões.');
        } finally {
            setEnviando(false);
        }
    };

    const handleToggleAtivo = async (c: Convite) => {
        const atualizado = await dataService.saveConvite({ ...(c as any), ativo: !c.ativo });
        setConvites(prev => prev.map(item => item.id === c.id ? { ...item, ...atualizado } : item));
    };

    const handleChangeRole = async (c: Convite, newRole: UserRole) => {
        const atualizado = await dataService.saveConvite({
            ...(c as any),
            role: newRole,
            quadraLote: newRole === 'CLIENTE_COMPRADOR' ? (c as any).quadraLote : ''
        });
        setConvites(prev => prev.map(item => item.id === c.id ? { ...item, ...atualizado } : item));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este convite/acesso?')) return;
        try {
            await dataService.deleteConvite(id);
            setConvites(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err?.message || 'Não foi possível excluir o convite.');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConvite) return;
        setSalvandoEdicao(true);
        try {
            const atualizado = await dataService.saveConvite(editingConvite as any);
            setConvites(prev => prev.map(c => c.id === editingConvite.id ? { ...c, ...atualizado } : c));
            setEditingConvite(null);
        } catch (err: any) {
            alert(err?.message || 'Não foi possível salvar as alterações do convite.');
        } finally {
            setSalvandoEdicao(false);
        }
    };

    const handleCopyLink = (c: Convite) => {
        navigator.clipboard.writeText(c.link_acesso || '');
        setCopiedId(c.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const nomeObraDoConvite = (c: Convite) => obras?.find(o => o.id === c.obra_id)?.nome || (c as any).obraNome || 'Empreendimento';

    const handleSendWhatsApp = async (c: Convite) => {
        setWhatsappFeedback(null);

        if (!c.telefone || !c.telefone.replace(/\D/g, '')) {
            setWhatsappFeedback({ id: c.id, type: 'error', message: 'Este convite não tem um telefone/WhatsApp cadastrado. Edite o convite para adicionar um número.' });
            return;
        }

        const mensagem = `Olá ${c.nome || ''}!\n\nVocê está recebendo o acesso à plataforma *meUrbanismo* para acompanhar o empreendimento *${nomeObraDoConvite(c)}*.\n\nAcesse o link abaixo, crie seu acesso com este e-mail (${c.email}) e cadastre sua nova senha:\n${c.link_acesso}`;

        setWhatsappSendingId(c.id);
        try {
            const { data, error } = await supabase.functions.invoke('send-whatsapp-invite', {
                body: { telefone: c.telefone, mensagem }
            });

            // O supabase-js só popula "error" para falhas de rede/infra; erros de
            // negócio (ex.: Z-API não configurada) vêm no corpo com "data.error".
            if (error || data?.error) {
                throw new Error(data?.error || error?.message || 'Não foi possível enviar a mensagem pelo WhatsApp.');
            }

            setWhatsappFeedback({ id: c.id, type: 'success', message: 'Convite enviado por WhatsApp automaticamente!' });
        } catch (err: any) {
            setWhatsappFeedback({
                id: c.id,
                type: 'error',
                message: err?.message || 'Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente em instantes.'
            });
        } finally {
            setWhatsappSendingId(null);
        }
    };

    const handleSendEmail = (c: Convite) => {
        const assunto = encodeURIComponent(`Acesso à plataforma meUrbanismo - ${nomeObraDoConvite(c)}`);
        const corpo = encodeURIComponent(
            `Olá ${c.nome || ''}!\n\nVocê foi convidado para acessar a plataforma meUrbanismo no empreendimento ${nomeObraDoConvite(c)}.\n\nClique no link para criar sua senha com o e-mail (${c.email}):\n${c.link_acesso}`
        );
        window.open(`mailto:${c.email}?subject=${assunto}&body=${corpo}`, '_blank');
    };

    const convitesFiltrados = convites.filter(c => {
        const matchRole = filtroRole === 'TODOS' || c.role === filtroRole;
        const matchObra = filtroObra === 'TODAS' || c.obra_id === filtroObra;
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
                    Estes convites são a fonte real de permissão no banco de dados (RLS) — sem um convite ativo, o usuário não recebe nenhum dado da obra.
                </p>
            </div>

            {/* FORMULÁRIO DE NOVO CONVITE */}
            <form onSubmit={handleCreateConvite} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" /> Gerar Novo Convite
                </h2>

                {erro && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                        {erro}
                    </div>
                )}

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
                                {(!obras || obras.length === 0) && <option value="">Nenhuma obra cadastrada</option>}
                                {obras && obras.map(o => (
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

                {role === 'CLIENTE_COMPRADOR' && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 animate-fadeIn">
                        <label className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
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
                    disabled={enviando}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                    {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {enviando ? 'Gerando...' : 'Criar e Gerar Link de Convite'}
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
                            {obras && obras.map(o => (
                                <option key={o.id} value={o.id}>{o.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {carregando ? (
                        <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-xs font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" /> Carregando convites...
                        </div>
                    ) : convitesFiltrados.length === 0 ? (
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
                                            {c.nome ? `${c.nome} • ` : ''} Empreendimento: <strong className="text-slate-700">{nomeObraDoConvite(c)}</strong>
                                            {c.role === 'CLIENTE_COMPRADOR' && (c as any).quadraLote && (
                                                <span className="ml-2 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                    {(c as any).quadraLote}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-semibold text-slate-600">
                                            {c.ativo ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAtivo(c)}
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
                                                onChange={e => handleChangeRole(c, e.target.value as UserRole)}
                                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 font-bold bg-slate-50 text-slate-800"
                                            >
                                                <option value="CLIENTE_COMPRADOR">Comprador / Adquirente</option>
                                                <option value="CORRETOR">Corretor de Imóveis</option>
                                                <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor</option>
                                            </select>
                                        </div>

                                        <span className="text-[10px] text-slate-400">
                                            Criado em: {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {getAbasPreview(c.role as UserRole).map((aba, i) => (
                                            <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                                {aba}
                                            </span>
                                        ))}
                                    </div>

                                    {whatsappFeedback && whatsappFeedback.id === c.id && (
                                        <div
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                                                whatsappFeedback.type === 'success'
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                                            }`}
                                        >
                                            {whatsappFeedback.type === 'success' ? (
                                                <Check className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                            {whatsappFeedback.message}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handleSendWhatsApp(c)}
                                            disabled={whatsappSendingId === c.id}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {whatsappSendingId === c.id ? (
                                                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                                            ) : (
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            )}
                                            {whatsappSendingId === c.id ? 'Enviando...' : 'Enviar por WhatsApp'}
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

            {/* MODAL DE EDIÇÃO */}
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

                            {editingConvite.role === 'CLIENTE_COMPRADOR' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quadra / Lote (Ex: Quadra C - Lote 05)</label>
                                    <input
                                        type="text"
                                        value={(editingConvite as any).quadra_lote || ''}
                                        onChange={e => setEditingConvite({ ...editingConvite, quadra_lote: e.target.value } as any)}
                                        placeholder="Quadra e Lote do cliente"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Status do Cadastro</label>
                                <select
                                    value={(editingConvite as any).statusCadastro || 'PENDENTE'}
                                    onChange={e => setEditingConvite({ ...editingConvite, statusCadastro: e.target.value as any } as any)}
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
                                    disabled={salvandoEdicao}
                                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvandoEdicao}
                                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                                >
                                    {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
