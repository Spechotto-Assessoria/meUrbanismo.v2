import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building, PlusCircle, Save, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import type { Obra } from '../../types';

interface NovaObraTabProps {
    onBack?: () => void;
    onGoToNovaEmpresa?: () => void;
    preSelectedEmpresaId?: string;
}

export const NovaObraTab: React.FC<NovaObraTabProps> = ({ onBack, onGoToNovaEmpresa, preSelectedEmpresaId }) => {
    const { empresas, addObra, setActiveObra } = useAuth();

    const [nome, setNome] = useState('');
    const [empresaId, setEmpresaId] = useState(preSelectedEmpresaId || (empresas[0]?.id || ''));
    const [status, setStatus] = useState('Planejamento');
    const [tipo, setTipo] = useState('Loteamento Fechado');
    const [descricao, setDescricao] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [uf, setUf] = useState('SP');
    const [areaM2, setAreaM2] = useState('');
    const [valorGlobal, setValorGlobal] = useState('');
    const [qtdLotes, setQtdLotes] = useState('');
    const [metragemPadraoLote, setMetragemPadraoLote] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleEmpresaSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'NOVA_EMPRESA') {
            if (onGoToNovaEmpresa) {
                onGoToNovaEmpresa();
            }
        } else {
            setEmpresaId(val);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        if (!nome.trim()) {
            alert('Informe o Nome da Obra.');
            return;
        }

        if (!empresaId) {
            alert('Selecione uma Empresa ou crie uma nova antes de continuar.');
            return;
        }

        const emp = empresas.find(e => e.id === empresaId);

        setSalvando(true);
        try {
            const nova = await addObra({
                nome: nome.trim(),
                empresaId,
                empresaNome: emp?.nome || 'Empresa',
                cidade: cidade.trim() || 'Chapada dos Guimarães',
                uf: uf.trim() || 'MT',
                tipo,
                status,
                descricao,
                endereco,
                areaM2: parseFloat(areaM2) || 0,
                valorGlobal: parseFloat(valorGlobal) || 0,
                qtdLotes: parseInt(qtdLotes) || 0,
                metragemPadraoLote: parseFloat(metragemPadraoLote) || 0,
                dataInicio,
                dataEntrega,
                foto_capa: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
            } as Omit<Obra, 'id'>);

            setActiveObra(nova);

            if (onBack) {
                onBack();
            }
        } catch (err: any) {
            setErro(err?.message || 'Não foi possível salvar a obra. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Building className="w-6 h-6 text-blue-600" /> Nova Obra
                        </h1>
                        <p className="text-xs text-slate-500">Informações principais da obra e vínculo com a empresa.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {erro && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                        {erro}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Obra *</label>
                    <input
                        type="text"
                        required
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Ex: Condomínio Reserva dos Ipês"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                    />
                </div>

                {/* SELETOR DE EMPRESA COM ATALHO DE CRIAR NOVA */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">Empresa / Incorporadora *</label>
                        {onGoToNovaEmpresa && (
                            <button
                                type="button"
                                onClick={onGoToNovaEmpresa}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                                <PlusCircle className="w-3.5 h-3.5" /> + Criar Nova Empresa
                            </button>
                        )}
                    </div>
                    <select
                        value={empresaId}
                        onChange={handleEmpresaSelectChange}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden bg-white font-medium text-slate-800"
                        required
                    >
                        {empresas.length === 0 && <option value="">Nenhuma empresa cadastrada</option>}
                        {empresas.map(e => (
                            <option key={e.id} value={e.id}>{e.nome}</option>
                        ))}
                        <option value="NOVA_EMPRESA" className="font-bold text-blue-600">
                            ➕ Cadastrar nova empresa...
                        </option>
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Empreendimento</label>
                        <select
                            value={tipo}
                            onChange={e => setTipo(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="Loteamento Fechado">Loteamento Fechado</option>
                            <option value="Loteamento Aberto">Loteamento Aberto</option>
                            <option value="Condomínio de Casas">Condomínio de Casas</option>
                            <option value="Edifício Residencial">Edifício Residencial</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="Planejamento">Planejamento</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluída">Concluída</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                    <textarea
                        rows={2}
                        value={descricao}
                        onChange={e => setDescricao(e.target.value)}
                        placeholder="Breve resumo sobre o empreendimento"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
                        <input
                            type="text"
                            value={endereco}
                            onChange={e => setEndereco(e.target.value)}
                            placeholder="Rua, Av, Rodovia..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                        <input
                            type="text"
                            value={cidade}
                            onChange={e => setCidade(e.target.value)}
                            placeholder="Ex: Mirassol"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Estado (UF)</label>
                        <input
                            type="text"
                            value={uf}
                            onChange={e => setUf(e.target.value)}
                            placeholder="SP"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Área Total (m²)</label>
                        <input
                            type="number"
                            value={areaM2}
                            onChange={e => setAreaM2(e.target.value)}
                            placeholder="Ex: 50000"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Global / VGV (R$)</label>
                        <input
                            type="number"
                            value={valorGlobal}
                            onChange={e => setValorGlobal(e.target.value)}
                            placeholder="Ex: 20000000"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade de Lotes</label>
                        <input
                            type="number"
                            value={qtdLotes}
                            onChange={e => setQtdLotes(e.target.value)}
                            placeholder="Ex: 186"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Metragem Padrão do Lote (m²)</label>
                        <input
                            type="number"
                            value={metragemPadraoLote}
                            onChange={e => setMetragemPadraoLote(e.target.value)}
                            placeholder="Ex: 300"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Entrega Prevista</label>
                        <input
                            type="date"
                            value={dataEntrega}
                            onChange={e => setDataEntrega(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Imagem / Logo Específica da Obra</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50"
                        >
                            Escolher imagem
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={salvando}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={salvando}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                    >
                        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {salvando ? 'Salvando...' : 'Cadastrar Obra'}
                    </button>
                </div>
            </form>
        </div>
    );
};