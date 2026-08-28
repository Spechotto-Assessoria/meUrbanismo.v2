import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building, Save } from 'lucide-react';

interface NovaObraTabProps {
    onSuccess?: () => void;
}

export const NovaObraTab: React.FC<NovaObraTabProps> = ({ onSuccess }) => {
    const { empresas, addObra, setActiveObra } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        empresa_id: empresas[0]?.id || '',
        cidade: '',
        uf: 'SP',
        tipo: 'Loteamento Fechado',
        status: 'Em Andamento',
        area_total_m2: 85000,
        valor_vgv: 25000000,
        total_lotes: 150,
        custo_orcado: 10000000,
        data_inicio: new Date().toISOString().split('T')[0],
        data_previsao: '2026-12-31'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome) return;

        setLoading(true);
        try {
            const selecionadaEmpresa = empresas.find(e => e.id === formData.empresa_id);

            const nova = await addObra({
                ...formData,
                empresaId: formData.empresa_id,
                empresa_nome: selecionadaEmpresa?.nome || 'Empresa Urbanizadora',
                empresaNome: selecionadaEmpresa?.nome || 'Empresa Urbanizadora',
                areaM2: Number(formData.area_total_m2),
                valorGlobal: Number(formData.valor_vgv),
                qtdLotes: Number(formData.total_lotes),
                lotes_vendidos: 0,
                lotes_disponiveis: Number(formData.total_lotes),
                percentual_concluido: 0,
                custo_realizado: 0,
                foto_capa: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
            });

            setActiveObra(nova);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Erro ao cadastrar obra:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building className="w-6 h-6 text-brand-400" />
                    Cadastrar Novo Empreendimento
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Adicione um novo loteamento ou obra de infraestrutura urbana ao sistema.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Empreendimento *</label>
                    <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Residencial Parque dos Ipês"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa / SPE</label>
                        <select
                            value={formData.empresa_id}
                            onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        >
                            {empresas.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Empreendimento</label>
                        <select
                            value={formData.tipo}
                            onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        >
                            <option value="Loteamento Fechado">Loteamento Fechado</option>
                            <option value="Loteamento Aberto">Loteamento Aberto</option>
                            <option value="Condomínio de Casas">Condomínio de Casas</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade</label>
                        <input
                            type="text"
                            required
                            value={formData.cidade}
                            onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                            placeholder="Ex: Mirassol"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">UF</label>
                        <input
                            type="text"
                            required
                            value={formData.uf}
                            onChange={e => setFormData({ ...formData, uf: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Área Total (m²)</label>
                        <input
                            type="number"
                            value={formData.area_total_m2}
                            onChange={e => setFormData({ ...formData, area_total_m2: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Total de Lotes</label>
                        <input
                            type="number"
                            value={formData.total_lotes}
                            onChange={e => setFormData({ ...formData, total_lotes: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">VGV Previsto (R$)</label>
                        <input
                            type="number"
                            value={formData.valor_vgv}
                            onChange={e => setFormData({ ...formData, valor_vgv: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-brand-500/10"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Cadastrando...' : 'Cadastrar Empreendimento'}
                    </button>
                </div>
            </form>
        </div>
    );
};