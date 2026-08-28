import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Save, ArrowLeft } from 'lucide-react';

interface NovaEmpresaTabProps {
    onSuccess?: (empresaId?: string) => void;
}

export const NovaEmpresaTab: React.FC<NovaEmpresaTabProps> = ({ onSuccess }) => {
    const { addEmpresa } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        responsavel_tecnico: '',
        crea_cau: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome) return;

        setLoading(true);
        try {
            const criada = await addEmpresa(formData);
            if (onSuccess) {
                onSuccess(criada.id);
            }
        } catch (error) {
            console.error('Erro ao cadastrar empresa:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-brand-400" />
                    Cadastrar Nova Empresa Urbanizadora
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Registre a razão social ou SPE responsável pelos novos loteamentos.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Empresa / SPE *</label>
                    <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Conecta Urbanismo SPE Ltda"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">CNPJ</label>
                        <input
                            type="text"
                            value={formData.cnpj}
                            onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                            placeholder="00.000.000/0001-00"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Comercial</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contato@empresa.com.br"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                        <input
                            type="text"
                            value={formData.telefone}
                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                            placeholder="(17) 99999-9999"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Responsável Técnico</label>
                        <input
                            type="text"
                            value={formData.responsavel_tecnico}
                            onChange={e => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                            placeholder="Eng. Responsável"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">CREA / CAU</label>
                    <input
                        type="text"
                        value={formData.crea_cau}
                        onChange={e => setFormData({ ...formData, crea_cau: e.target.value })}
                        placeholder="CREA-SP 5069248190"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-brand-500"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-brand-500/10"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Salvando...' : 'Salvar Empresa'}
                    </button>
                </div>
            </form>
        </div>
    );
};