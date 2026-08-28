import React, { useState } from 'react';
import {
    Calculator, Layers, ArrowLeft
} from 'lucide-react';
import {
    PRESETS_AREAS, NOTA_TECNICA, calcViabilidadeInicial,
    TipoEmpreendimento, ViabilidadeInicialInput
} from '../../lib/viabilidade-inicial';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';

interface Props {
    onBack: () => void;
}

export const EstudoViabilidadeTab: React.FC<Props> = ({ onBack }) => {
    const [viewMode, setViewMode] = useState<'pipeline' | 'form'>('form');

    const [obraNome, setObraNome] = useState('Condomínio Parque Ohara');
    const [empresaNome, setEmpresaNome] = useState('Spechotto Assessoria');
    const [destinatario, setDestinatario] = useState('Pablo / Thiago');
    const [cnpj, setCnpj] = useState('00.000.000/0001-00');
    const [localizacao, setLocalizacao] = useState('Cuiabá - MT');
    const [tipo, setTipo] = useState<TipoEmpreendimento>('condominio');

    const [areaTerreno, setAreaTerreno] = useState(100000);
    const [areaApp, setAreaApp] = useState(10000);
    const [percentualViario, setPercentualViario] = useState(18);
    const [percentualVerde, setPercentualVerde] = useState(12);
    const [percentualInstitucional, setPercentualInstitucional] = useState(5);
    const [loteMedio, setLoteMedio] = useState(250);

    const [custoM2, setCustoM2] = useState(150);
    const [prazoObra, setPrazoObra] = useState(24);
    const [prazoVendas, setPrazoVendas] = useState(36);
    const [tma, setTma] = useState(12);

    const input: ViabilidadeInicialInput = {
        obraNome, empresaNome, cnpj, localizacao, destinatario, tipo,
        areaTerreno, areaApp,
        percentuais: { viario: percentualViario, verde: percentualVerde, institucional: percentualInstitucional },
        loteMedio, custoM2Privativo: custoM2, taxaDescontoAA: tma,
        prazoObraMeses: prazoObra, prazoVendasMeses: prazoVendas
    };

    const result = calcViabilidadeInicial(input);

    const formatBRL = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                        title="Voltar ao Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-purple-600" />
                            Estudo de Viabilidade Inicial
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Acompanhe o pipeline ou monte uma nova simulação
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setViewMode('pipeline')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'pipeline'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Pipeline</span>
                    </button>
                    <button
                        onClick={() => setViewMode('form')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'form'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <Calculator className="w-4 h-4" />
                        <span>Novo Estudo / Simulador</span>
                    </button>
                </div>
            </div>

            {viewMode === 'form' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Identificação</h2>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Nome do Empreendimento *</label>
                                <input
                                    type="text"
                                    value={obraNome}
                                    onChange={(e) => setObraNome(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Empresa</label>
                                    <input
                                        type="text"
                                        value={empresaNome}
                                        onChange={(e) => setEmpresaNome(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Destinatário</label>
                                    <input
                                        type="text"
                                        value={destinatario}
                                        onChange={(e) => setDestinatario(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Localização / Cidade</label>
                                <CidadeAutocomplete value={localizacao} onChange={setLocalizacao} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Tipo de Empreendimento</h2>

                            {(['loteamento', 'condominio'] as TipoEmpreendimento[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        setTipo(t);
                                        setCustoM2(PRESETS_AREAS[t].custoM2);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${tipo === t
                                            ? 'border-purple-500 bg-purple-50 font-bold text-purple-900'
                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200'
                                        }`}
                                >
                                    <div className="text-xs font-bold">{PRESETS_AREAS[t].label}</div>
                                    <div className="text-[11px] font-normal mt-0.5 opacity-80">
                                        {PRESETS_AREAS[t].lei} • Custo padrão {formatBRL(PRESETS_AREAS[t].custoM2)}/m²
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Quadro de Áreas</h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Área do Terreno (m²)</label>
                                    <input
                                        type="number"
                                        value={areaTerreno}
                                        onChange={(e) => setAreaTerreno(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 text-right"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Área de APP (m²)</label>
                                    <input
                                        type="number"
                                        value={areaApp}
                                        onChange={(e) => setAreaApp(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 text-right"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                                <span className="text-slate-600">Área Útil Pós-APP:</span>
                                <span className="font-bold text-slate-900">{result.areaBase.toLocaleString('pt-BR')} m²</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">Sistema Viário (%)</span>
                                    <input
                                        type="number"
                                        value={percentualViario}
                                        onChange={(e) => setPercentualViario(Number(e.target.value))}
                                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-right"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">Áreas Verdes (%)</span>
                                    <input
                                        type="number"
                                        value={percentualVerde}
                                        onChange={(e) => setPercentualVerde(Number(e.target.value))}
                                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-right"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">Institucional (%)</span>
                                    <input
                                        type="number"
                                        value={percentualInstitucional}
                                        onChange={(e) => setPercentualInstitucional(Number(e.target.value))}
                                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-right"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-medium text-slate-500">Metragem Média dos Lotes (m²)</label>
                                <input
                                    type="number"
                                    value={loteMedio}
                                    onChange={(e) => setLoteMedio(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 text-right"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VGV Estimado</p>
                                <p className="text-base font-black text-purple-600 mt-1">{formatBRL(result.vgvTotal)}</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custo Total</p>
                                <p className="text-base font-black text-red-500 mt-1">{formatBRL(result.custoTotal)}</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qtd. Lotes</p>
                                <p className="text-base font-black text-slate-900 mt-1">{result.qtdLotes}</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ROI Inicial</p>
                                <p className="text-base font-black text-emerald-500 mt-1">{result.roi.toFixed(2)}%</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Resumo dos Resultados</h3>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-slate-600">Área Vendável:</span>
                                    <span className="font-bold text-slate-900">{result.areaVendavel.toLocaleString('pt-BR')} m²</span>
                                </div>
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-slate-600">Aproveitamento:</span>
                                    <span className="font-bold text-slate-900">{result.aproveitamentoPct.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-slate-600">Venda por Lote:</span>
                                    <span className="font-bold text-emerald-600">{formatBRL(result.valorVendaLote)}</span>
                                </div>
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-slate-600">Custo por Lote:</span>
                                    <span className="font-bold text-red-500">{formatBRL(result.custoPorLote)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Nota Técnica</h3>
                            {NOTA_TECNICA.map((note, idx) => (
                                <div key={idx} className="space-y-1">
                                    <h4 className="text-xs font-bold text-purple-700">{note.titulo}</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">{note.paragrafos[0]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
                    <Layers className="w-12 h-12 text-purple-400 mx-auto" />
                    <h2 className="text-lg font-bold text-slate-900">Pipeline de Estudos</h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Os estudos salvos aparecem organizados por colunas Kanban. (Em breve integração com Banco de Dados).
                    </p>
                </div>
            )}
        </div>
    );
};