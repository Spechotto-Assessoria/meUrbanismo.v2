import React, { useState, useEffect, useMemo } from 'react';
import {
    Calculator, Layers, ArrowLeft, Save, FilePlus2, FileDown, Sheet, Loader2, Trash2, Pencil, X
} from 'lucide-react';

// IMPORTAÇÃO CORINGA UNIVERSAL PARA SUPABASE (Funciona com qualquer formato de exportação)
import * as SupabaseModule from '../../services/supabase';
const supabase = (SupabaseModule as any).supabase || (SupabaseModule as any).default || SupabaseModule;

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui-components';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';
import {
    PRESETS_AREAS, NOTA_TECNICA, LABELS_AREAS, calcViabilidadeInicial,
    TipoEmpreendimento, ViabilidadeInicialInput, ViabilidadeInicialResult
} from '../../lib/viabilidade-inicial';
import { EstudoRow, EstudoStatus, STATUS_PIPELINE, normalizeStatus, rowToInput } from '../viabilidade/EstudoCard';

// --- FUNÇÕES EMBUTIDAS PARA EVITAR ERRO DE BUILD ---
const formatDecimal = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const maskDecimal = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (!v) return '0,00';
    v = (Number(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v;
};
const showM2 = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²';
const unmask = (val: string | number) => typeof val === 'number' ? val : Number(val.replace(/\./g, '').replace(',', '.'));
const unmaskInteiro = (val: string | number) => typeof val === 'number' ? val : parseInt(val.replace(/\D/g, ''), 10) || 0;

const downloadViabilidadeInicialCsv = (input: ViabilidadeInicialInput, result: ViabilidadeInicialResult) => {
    const linhas = [
        ["Relatorio de Viabilidade Inicial"],
        [""],
        ["IDENTIFICACAO"],
        ["Empreendimento", input.obraNome],
        ["Empresa", input.empresaNome],
        ["Localizacao", input.localizacao],
        [""],
        ["RESULTADOS FINANCEIROS"],
        ["VGV Total Estimado", result.vgvTotal],
        ["Custo Total", result.custoTotal],
        ["Quantidade de Lotes", result.qtdLotes],
        ["ROI Inicial (%)", result.roi],
        ["Margem Bruta", result.margemBruta],
        ["Margem sobre VGV (%)", result.margemPct],
        ["Valor de Venda por Lote", result.valorVendaLote],
        ["Custo por Lote", result.custoPorLote],
    ];
    const csv = "data:text/csv;charset=utf-8," + linhas.map(l => l.join(";")).join("\n");
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Viabilidade_${input.obraNome || 'Estudo'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
// -------------------------------------------------------------

interface Props {
    onBack: () => void;
}

export const EstudoViabilidadeTab: React.FC<Props> = ({ onBack }) => {
    const [viewMode, setViewMode] = useState<'pipeline' | 'form'>('pipeline');
    const [estudoId, setEstudoId] = useState<string | null>(null);
    const [estudos, setEstudos] = useState<EstudoRow[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [mensagemErro, setMensagemErro] = useState<string | null>(null);

    const [obraNome, setObraNome] = useState('');
    const [empresaNome, setEmpresaNome] = useState('');
    const [destinatario, setDestinatario] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [localizacao, setLocalizacao] = useState('');
    const [tipo, setTipo] = useState<TipoEmpreendimento>('loteamento');

    const [areaTerreno, setAreaTerreno] = useState(formatDecimal(100000));
    const [areaApp, setAreaApp] = useState(formatDecimal(10000));
    const [percentuais, setPercentuais] = useState(PRESETS_AREAS.loteamento.padrao);
    const [loteMedio, setLoteMedio] = useState(formatDecimal(250));
    const [custoM2, setCustoM2] = useState(formatDecimal(PRESETS_AREAS.loteamento.custoM2));
    const [prazoObra, setPrazoObra] = useState('24');
    const [prazoVendas, setPrazoVendas] = useState('36');
    const [tma, setTma] = useState(formatDecimal(12));
    const [status, setStatus] = useState<EstudoStatus>('rascunho');
    const [previewAberto, setPreviewAberto] = useState(false);

    const buscarEstudos = async () => {
        setCarregando(true);
        const { data, error } = await supabase
            .from('viabilidade_inicial_estudos')
            .select('*')
            .order('updated_at', { ascending: false });
        if (!error && data) {
            setEstudos(data as EstudoRow[]);
        }
        setCarregando(false);
    };

    useEffect(() => {
        void buscarEstudos();
    }, []);

    useEffect(() => {
        if (!estudoId) {
            setPercentuais(PRESETS_AREAS[tipo].padrao);
            setCustoM2(formatDecimal(PRESETS_AREAS[tipo].custoM2));
        }
    }, [tipo]);

    const input: ViabilidadeInicialInput = useMemo(() => ({
        obraNome,
        empresaNome,
        cnpj,
        localizacao,
        destinatario,
        tipo,
        areaTerreno: unmask(areaTerreno),
        areaApp: unmask(areaApp),
        percentuais,
        loteMedio: unmask(loteMedio),
        custoM2Privativo: unmask(custoM2),
        taxaDescontoAA: unmask(tma),
        prazoObraMeses: unmaskInteiro(prazoObra),
        prazoVendasMeses: unmaskInteiro(prazoVendas),
    }), [obraNome, empresaNome, cnpj, localizacao, destinatario, tipo, areaTerreno, areaApp, percentuais, loteMedio, custoM2, tma, prazoObra, prazoVendas]);

    const r: ViabilidadeInicialResult = useMemo(() => calcViabilidadeInicial(input), [input]);

    const handleSalvar = async (comoNovo: boolean) => {
        setMensagemErro(null);
        setMensagemSucesso(null);
        if (!obraNome.trim()) {
            setMensagemErro("Informe o Nome do Empreendimento.");
            return;
        }
        setSalvando(true);
        try {
            const payload = {
                titulo: obraNome.trim(),
                empresa_nome: empresaNome || null,
                destinatario: destinatario || null,
                cnpj: cnpj || null,
                localizacao: localizacao || null,
                tipo,
                area_terreno: input.areaTerreno,
                area_app: input.areaApp,
                pct_vendavel: r.pctVendavel,
                pct_viario: percentuais.viario,
                pct_verde: percentuais.verde,
                pct_institucional: percentuais.institucional,
                lote_medio: input.loteMedio,
                custo_m2_privativo: input.custoM2Privativo,
                custo_total: r.custoTotal,
                vgv_total: r.vgvTotal,
                valor_lote: r.valorVendaLote,
                prazo_obra_meses: input.prazoObraMeses,
                prazo_vendas_meses: input.prazoVendasMeses,
                taxa_desconto_aa: input.taxaDescontoAA,
                status,
            };

            if (!comoNovo && estudoId) {
                const { error } = await supabase.from('viabilidade_inicial_estudos').update(payload).eq('id', estudoId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('viabilidade_inicial_estudos').insert(payload).select('id').single();
                if (error) throw error;
                if (data) setEstudoId(data.id);
            }

            setMensagemSucesso("Estudo salvo com sucesso!");
            await buscarEstudos();
            setViewMode('pipeline');
        } catch (e: any) {
            setMensagemErro(e.message || "Erro ao salvar estudo.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id: string) => {
        const { error } = await supabase.from('viabilidade_inicial_estudos').delete().eq('id', id);
        if (!error) {
            setMensagemSucesso("Estudo excluído.");
            void buscarEstudos();
        } else {
            setMensagemErro("Erro ao excluir estudo.");
        }
    };

    const carregarEstudoNoForm = (e: EstudoRow) => {
        const i = rowToInput(e);
        setEstudoId(e.id);
        setObraNome(i.obraNome);
        setEmpresaNome(i.empresaNome ?? '');
        setDestinatario(i.destinatario ?? '');
        setCnpj(i.cnpj ?? '');
        setLocalizacao(i.localizacao ?? '');
        setTipo(i.tipo);
        setAreaTerreno(formatDecimal(i.areaTerreno));
        setAreaApp(formatDecimal(i.areaApp));
        setPercentuais(i.percentuais);
        setLoteMedio(formatDecimal(i.loteMedio));
        setCustoM2(formatDecimal(i.custoM2Privativo));
        setPrazoObra(String(i.prazoObraMeses));
        setPrazoVendas(String(i.prazoVendasMeses));
        setTma(formatDecimal(i.taxaDescontoAA));
        setStatus(normalizeStatus(e.status));
        setViewMode('form');
    };

    const novoEstudoForm = () => {
        setEstudoId(null);
        setObraNome('');
        setEmpresaNome('');
        setDestinatario('');
        setCnpj('');
        setLocalizacao('');
        setTipo('loteamento');
        setAreaTerreno(formatDecimal(100000));
        setAreaApp(formatDecimal(10000));
        setPercentuais(PRESETS_AREAS.loteamento.padrao);
        setLoteMedio(formatDecimal(250));
        setCustoM2(formatDecimal(PRESETS_AREAS.loteamento.custoM2));
        setPrazoObra('24');
        setPrazoVendas('36');
        setTma(formatDecimal(12));
        setStatus('rascunho');
        setViewMode('form');
    };

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {mensagemSucesso && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center">
                    <span>{mensagemSucesso}</span>
                    <button onClick={() => setMensagemSucesso(null)} className="text-emerald-900 font-bold ml-2">×</button>
                </div>
            )}
            {mensagemErro && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center">
                    <span>{mensagemErro}</span>
                    <button onClick={() => setMensagemErro(null)} className="text-red-900 font-bold ml-2">×</button>
                </div>
            )}

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
                            Acompanhe o pipeline em Kanban ou monte uma nova simulação financeira
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
                        <span>Pipeline Kanban</span>
                    </button>
                    <button
                        onClick={novoEstudoForm}
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

            {viewMode === 'pipeline' ? (
                carregando ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {STATUS_PIPELINE.map((col) => {
                            const itens = estudos.filter(e => normalizeStatus(e.status) === col.id);
                            return (
                                <div key={col.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{col.label}</h3>
                                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200">{itens.length}</span>
                                    </div>
                                    {itens.length === 0 ? (
                                        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                                            Nenhum estudo
                                        </div>
                                    ) : (
                                        itens.map(e => (
                                            <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                <p className="font-bold text-xs text-slate-900 truncate">{e.titulo}</p>
                                                <p className="text-[10px] text-slate-500">{e.localizacao || 'Sem local'}</p>
                                                <div className="flex gap-1 pt-1">
                                                    <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" onClick={() => carregarEstudoNoForm(e)}>
                                                        <Pencil className="w-3 h-3 mr-1" /> Editar
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleExcluir(e.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <Button
                            onClick={() => handleSalvar(false)}
                            disabled={salvando}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                        >
                            <Save className="w-4 h-4 mr-1.5" />
                            {estudoId ? "Salvar Estudo Selecionado" : "Salvar Estudo"}
                        </Button>
                        <Button
                            onClick={() => handleSalvar(true)}
                            disabled={salvando}
                            variant="outline"
                            className="rounded-xl text-xs font-bold border-slate-200"
                        >
                            <FilePlus2 className="w-4 h-4 mr-1.5" />
                            Salvar como Novo
                        </Button>
                        <Button
                            onClick={() => setPreviewAberto(true)}
                            variant="secondary"
                            className="rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                            <FileDown className="w-4 h-4 mr-1.5" />
                            Exportar PDF
                        </Button>
                        <Button
                            onClick={() => downloadViabilidadeInicialCsv(input, r)}
                            variant="secondary"
                            className="rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                            <Sheet className="w-4 h-4 mr-1.5" />
                            Exportar Planilha (CSV)
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 space-y-6">
                            <Card className="rounded-2xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Identificação</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-500">Nome do Empreendimento *</Label>
                                        <Input
                                            type="text"
                                            value={obraNome}
                                            onChange={(e) => setObraNome(e.target.value)}
                                            placeholder="Obrigatório — vira o título do estudo"
                                            className="rounded-xl bg-slate-50 border-slate-200 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Empresa</Label>
                                            <Input
                                                type="text"
                                                value={empresaNome}
                                                onChange={(e) => setEmpresaNome(e.target.value)}
                                                className="rounded-xl bg-slate-50 border-slate-200 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Destinatário</Label>
                                            <Input
                                                type="text"
                                                value={destinatario}
                                                onChange={(e) => setDestinatario(e.target.value)}
                                                placeholder="Ex.: Pablo / Thiago"
                                                className="rounded-xl bg-slate-50 border-slate-200 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-500">Localização / Cidade do Brasil</Label>
                                        <CidadeAutocomplete value={localizacao} onChange={setLocalizacao} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Tipo de Empreendimento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {(['loteamento', 'condominio'] as TipoEmpreendimento[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTipo(t)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${tipo === t
                                                    ? 'border-purple-500 bg-purple-50 font-bold text-purple-900'
                                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200'
                                                }`}
                                        >
                                            <div className="text-xs font-bold">{PRESETS_AREAS[t].label}</div>
                                            <div className="text-[11px] font-normal mt-0.5 opacity-80">
                                                {PRESETS_AREAS[t].lei} • Custo padrão R$ {PRESETS_AREAS[t].custoM2.toFixed(2)}/m² privativo
                                            </div>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Quadro de Áreas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Área do Terreno (m²)</Label>
                                            <Input
                                                type="text"
                                                value={areaTerreno}
                                                onChange={(e) => setAreaTerreno(maskDecimal(e.target.value))}
                                                className="rounded-xl bg-slate-50 border-slate-200 text-sm text-right"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Área de APP (m²)</Label>
                                            <Input
                                                type="text"
                                                value={areaApp}
                                                onChange={(e) => setAreaApp(maskDecimal(e.target.value))}
                                                className="rounded-xl bg-slate-50 border-slate-200 text-sm text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                                        <span className="text-slate-600">Área Útil Pós-APP:</span>
                                        <span className="font-bold text-slate-900">{showM2(r.areaBase)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {(['viario', 'verde', 'institucional'] as (keyof typeof percentuais)[]).map((k) => (
                                            <div key={k} className="flex items-center justify-between">
                                                <span className="text-xs text-slate-600">{LABELS_AREAS[k]} (%)</span>
                                                <Input
                                                    type="number"
                                                    value={percentuais[k]}
                                                    onChange={(e) => setPercentuais(p => ({ ...p, [k]: Number(e.target.value) || 0 }))}
                                                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-right"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex justify-between items-center">
                                        <span className="text-purple-900 font-bold">Área Vendável:</span>
                                        <span className="font-bold text-purple-900">{showM2(r.areaVendavel)} ({r.pctVendavel.toFixed(1)}%)</span>
                                    </div>

                                    <div className="space-y-1 pt-2">
                                        <Label className="text-xs font-medium text-slate-500">Metragem Média dos Lotes (m²)</Label>
                                        <Input
                                            type="text"
                                            value={loteMedio}
                                            onChange={(e) => setLoteMedio(maskDecimal(e.target.value))}
                                            className="rounded-xl bg-slate-50 border-slate-200 text-sm text-right"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-7 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VGV Estimado</p>
                                        <p className="text-base font-black text-purple-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.vgvTotal)}</p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custo Total</p>
                                        <p className="text-base font-black text-red-500 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.custoTotal)}</p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qtd. Lotes</p>
                                        <p className="text-base font-black text-slate-900 mt-1">{r.qtdLotes}</p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ROI Inicial</p>
                                        <p className="text-base font-black text-emerald-500 mt-1">{r.roi.toFixed(2)}%</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="rounded-2xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Resumo dos Indicadores e Financeiro</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">Margem Bruta:</span>
                                        <span className="font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.margemBruta)}</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">Margem sobre VGV:</span>
                                        <span className="font-bold text-slate-900">{r.margemPct.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">Venda por Lote:</span>
                                        <span className="font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorVendaLote)}</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">Custo por Lote:</span>
                                        <span className="font-bold text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.custoPorLote)}</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">TIR Anual Estimada:</span>
                                        <span className="font-bold text-purple-600">{r.tirAnual != null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-600">Aproveitamento:</span>
                                        <span className="font-bold text-slate-900">{r.aproveitamentoPct.toFixed(2)}%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Nota Técnica</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {NOTA_TECNICA.map((note, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <h4 className="text-xs font-bold text-purple-700">{note.titulo}</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">{note.paragrafos[0]}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {previewAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-bold text-slate-900">Pré-visualização do Relatório</h2>
                            <button onClick={() => setPreviewAberto(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
                            <p><strong>Empreendimento:</strong> {obraNome || 'Não informado'}</p>
                            <p><strong>Localização:</strong> {localizacao || 'Não informada'}</p>
                            <p><strong>VGV Total:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.vgvTotal)}</p>
                            <p><strong>Custo Total:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.custoTotal)}</p>
                            <p><strong>Qtd. de Lotes:</strong> {r.qtdLotes}</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setPreviewAberto(false)} variant="outline">Fechar</Button>
                            <Button onClick={() => { downloadViabilidadeInicialCsv(input, r); setPreviewAberto(false); }}>Baixar Dados (CSV)</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};