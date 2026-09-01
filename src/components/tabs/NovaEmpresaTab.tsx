import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Save, Upload, ArrowLeft, Loader2 } from 'lucide-react';

interface NovaEmpresaTabProps {
    onBack?: () => void;
    onSuccess?: (empresaId: string) => void;
}

export const NovaEmpresaTab: React.FC<NovaEmpresaTabProps> = ({ onBack, onSuccess }) => {
    const { addEmpresa } = useAuth();

    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [contato, setContato] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        if (!nome.trim()) {
            alert('Por favor, preencha o Nome / Razão Social da empresa.');
            return;
        }

        setSalvando(true);
        try {
            const criada = await addEmpresa({
                nome: nome.trim(),
                cnpj: cnpj.trim(),
                contato: contato.trim(),
                email: email.trim(),
                telefone: telefone.trim()
            });

            if (onSuccess) {
                onSuccess(criada.id);
            } else if (onBack) {
                onBack();
            }
        } catch (err: any) {
            setErro(err?.message || 'Não foi possível salvar a empresa. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
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
                            <Building2 className="w-6 h-6 text-blue-600" /> Nova Empresa
                        </h1>
                        <p className="text-xs text-slate-500">Dados da empresa e logo para exibir nas obras.</p>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome / Razão social *</label>
                    <input
                        type="text"
                        required
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Ex: Conecta Urbanismo Ltda"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ</label>
                        <input
                            type="text"
                            value={cnpj}
                            onChange={e => setCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Contato Responsável</label>
                        <input
                            type="text"
                            value={contato}
                            onChange={e => setContato(e.target.value)}
                            placeholder="Nome do contato principal"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="contato@empresa.com.br"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                        <input
                            type="text"
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                            placeholder="(17) 99999-8888"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Logo da Empresa</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <button
                            type="button"
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50"
                        >
                            Escolher imagem
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2">PNG, JPG ou SVG. Recomendado: quadrada, fundo transparente.</p>
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
                        {salvando ? 'Salvando...' : 'Cadastrar Empresa'}
                    </button>
                </div>
            </form>
        </div>
    );
};