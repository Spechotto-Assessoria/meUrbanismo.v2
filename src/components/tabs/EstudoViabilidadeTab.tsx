import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, Layers, ArrowLeft, Save, FilePlus2, FileDown, Sheet, Loader2, Trash2, Pencil, Search } from 'lucide-react';
import { apiService } from '../../services/supabase';

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui-components';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';
import {
    PRESETS_AREAS, NOTA_TECNICA, calcViabilidadeInicial, calcularEficienciaViaria,
    TipoEmpreendimento, ViabilidadeInicialInput, ViabilidadeInicialResult
} from '../../lib/viabilidade-inicial';
import { EstudoCard, EstudoRow, EstudoStatus, STATUS_PIPELINE, normalizeStatus, rowToInput } from '../viabilidade/EstudoCard';

const formatDecimal = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const maskDecimal = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (!v) return '0,00';
    v = (Number(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v;
};
const unmask = (val: string | number) => typeof val === 'number' ? val : Number(val.replace(/\./g, '').replace(',', '.'));

const normalizar = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const downloadViabilidadeInicialCsv = (input: ViabilidadeInicialInput, result: ViabilidadeInicialResult) => {
    const linhas = [
        ["Relatorio de Viabilidade Inicial"], [""],
        ["IDENTIFICACAO"], ["Empreendimento", input.obraNome], ["Empresa", input.empresaNome], ["Localizacao", input.localizacao], [""],
        ["RESULTADOS FINANCEIROS"], ["VGV Total Estimado", result.vgvTotal], ["Custo Total", result.custoTotal], ["Quantidade de Lotes", result.qtdLotes],
        ["ROI Inicial (%)", result.roi], ["Margem Bruta", result.margemBruta], ["Margem sobre VGV (%)", result.margemPct],
        ["Valor de Venda por Lote", result.valorVendaLote], ["Custo por Lote", result.custoPorLote],
    ];
    const csv = "data:text/csv;charset=utf-8," + linhas.map(l => l.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Viabilidade_${input.obraNome || 'Estudo'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const DonutSVG = ({ values, colors }: { values: number[], colors: string[] }) => {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    return (
        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
            {values.map((v, i) => {
                const dash = (v / total) * 100;
                const out = <circle key={i} r="15.915494309" cx="16" cy="16" fill="transparent" stroke={colors[i]} strokeWidth="5" strokeDasharray={`${dash} 100`} strokeDashoffset={-offset} />;
                offset += dash;
                return out;
            })}
        </svg>
    );
};

const BarSVG = ({ c, v, m }: { c: number, v: number, m: number }) => {
    const max = Math.max(c, v, m, 1);
    return (
        <div className="flex items-end justify-center gap-8 h-48 w-full pt-4 border-b-2 border-slate-200">
            <div className="flex flex-col items-center w-16 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-700 mb-1">{formatBRL(c).replace(/,00$/, '')}</span>
                <div style={{ height: `${(c / max) * 100}%` }} className="w-full bg-blue-900 rounded-t-sm transition-all" />
                <span className="text-xs mt-2 text-slate-800 font-bold uppercase">Custo</span>
            </div>
            <div className="flex flex-col items-center w-16 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-700 mb-1">{formatBRL(v).replace(/,00$/, '')}</span>
                <div style={{ height: `${(v / max) * 100}%` }} className="w-full bg-blue-500 rounded-t-sm transition-all" />
                <span className="text-xs mt-2 text-slate-800 font-bold uppercase">VGV</span>
            </div>
            <div className="flex flex-col items-center w-16 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-700 mb-1">{formatBRL(m).replace(/,00$/, '')}</span>
                <div style={{ height: `${(m / max) * 100}%` }} className="w-full bg-emerald-500 rounded-t-sm transition-all" />
                <span className="text-xs mt-2 text-slate-800 font-bold uppercase">Margem</span>
            </div>
        </div>
    );
};

const SCurveSVG = ({ data }: { data: { mes: number, acumulado: number }[] }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.acumulado), 0);
    const min = Math.min(...data.map(d => d.acumulado), 0);
    const range = (max - min) || 1;
    const pts = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.acumulado - min) / range) * 100}`).join(' ');
    const zeroY = 100 - ((0 - min) / range) * 100;

    return (
        <div className="relative w-full h-48 mt-4 mb-2 border-l border-b border-slate-300">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#94a3b8" strokeDasharray="2" strokeWidth="0.5" />
                <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-0 -left-16 text-[10px] text-slate-500 font-bold">{formatBRL(max).split(',')[0]}</div>
            <div className="absolute bottom-0 -left-16 text-[10px] text-slate-500 font-bold">{formatBRL(min).split(',')[0]}</div>
        </div>
    );
};

interface Props { onBack: () => void; }

export const EstudoViabilidadeTab: React.FC<Props> = ({ onBack }) => {
    const [viewMode, setViewMode] = useState<'pipeline' | 'form'>('pipeline');
    const [estudoId, setEstudoId] = useState<string | null>(null);
    const [estudos, setEstudos] = useState<EstudoRow[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [gerandoPdf, setGerandoPdf] = useState(false);
    const [busca, setBusca] = useState("");

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
    const [loteMedio, setLoteMedio] = useState(formatDecimal(350));

    const [custoM2, setCustoM2] = useState(formatDecimal(PRESETS_AREAS.loteamento.custoM2));
    const [valorVendaM2, setValorVendaM2] = useState(formatDecimal(600));

    const [prazoObra, setPrazoObra] = useState('24');
    const [prazoVendas, setPrazoVendas] = useState('36');
    const [tma, setTma] = useState(formatDecimal(12));
    const [status, setStatus] = useState<EstudoStatus>('rascunho');

    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lote = unmask(loteMedio);
        if (lote > 0 && viewMode === 'form') {
            const autoViario = calcularEficienciaViaria(lote);
            setPercentuais(p => ({ ...p, viario: parseFloat(autoViario.toFixed(2)) }));
        }
    }, [loteMedio, viewMode]);

    const buscarEstudos = async () => {
        try {
            setCarregando(true);
            await apiService.getViabilidade('');
            const savedList = localStorage.getItem('meurbanismo_viabilidade_estudos_list');
            if (savedList) {
                setEstudos(JSON.parse(savedList));
            } else {
                setEstudos([]);
            }
        } catch (e) {
            console.error("Erro ao buscar estudos:", e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => { void buscarEstudos(); }, []);

    const input: ViabilidadeInicialInput = useMemo(() => ({
        obraNome, empresaNome, cnpj, localizacao, destinatario, tipo,
        areaTerreno: unmask(areaTerreno), areaApp: unmask(areaApp), percentuais,
        loteMedio: unmask(loteMedio), custoM2Privativo: unmask(custoM2), valorVendaM2: unmask(valorVendaM2),
        taxaDescontoAA: unmask(tma), prazoObraMeses: unmask(prazoObra), prazoVendasMeses: unmask(prazoVendas),
    }), [obraNome, empresaNome, cnpj, localizacao, destinatario, tipo, areaTerreno, areaApp, percentuais, loteMedio, custoM2, valorVendaM2, tma, prazoObra, prazoVendas]);

    const r: ViabilidadeInicialResult = useMemo(() => calcViabilidadeInicial(input), [input]);

    const estudosFiltrados = useMemo(() => {
        const termo = normalizar(busca);
        if (!termo) return estudos;
        return estudos.filter(
            (e) =>
                normalizar(e.titulo).includes(termo) ||
                normalizar(e.localizacao ?? "").includes(termo) ||
                normalizar(e.empresa_nome ?? "").includes(termo)
        );
    }, [estudos, busca]);

    const handleSalvar = async (comoNovo: boolean) => {
        setMensagemErro(null);
        setMensagemSucesso(null);

        if (!obraNome.trim()) {
            setMensagemErro("Atenção: O Nome do Empreendimento é obrigatório.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSalvando(true);
        try {
            const novoEstudo: EstudoRow = {
                id: (!comoNovo && estudoId) ? estudoId : `viab-${Date.now()}`,
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
                updated_at: new Date().toISOString()
            };

            let novaLista = [...estudos];
            if (!comoNovo && estudoId) {
                novaLista = novaLista.map(item => item.id === estudoId ? novoEstudo : item);
            } else {
                novaLista = [novoEstudo, ...novaLista];
                setEstudoId(novoEstudo.id);
            }

            localStorage.setItem('meurbanismo_viabilidade_estudos_list', JSON.stringify(novaLista));
            setEstudos(novaLista);

            setMensagemSucesso("Estudo salvo com sucesso!");
            setViewMode('pipeline');
        } catch (err: any) {
            setMensagemErro(err.message || "Ocorreu um erro ao salvar o estudo.");
        } finally {
            setSalvando(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleMudarStatus = (id: string, novoStatus: EstudoStatus) => {
        const novaLista = estudos.map(e => e.id === id ? { ...e, status: novoStatus, updated_at: new Date().toISOString() } : e);
        setEstudos(novaLista);
        localStorage.setItem('meurbanismo_viabilidade_estudos_list', JSON.stringify(novaLista));
    };

    const handleExcluir = async (id: string) => {
        const novaLista = estudos.filter(e => e.id !== id);
        setEstudos(novaLista);
        localStorage.setItem('meurbanismo_viabilidade_estudos_list', JSON.stringify(novaLista));
        setMensagemSucesso("Estudo excluído.");
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

        const areaBase = i.areaTerreno - i.areaApp;
        const somaPct = i.percentuais.viario + i.percentuais.verde + i.percentuais.institucional;
        const pctVendavel = Math.max(0, 100 - somaPct);
        const areaVendavel = areaBase * (pctVendavel / 100);
        const vM2 = areaVendavel > 0 ? e.vgv_total / areaVendavel : 600;
        setValorVendaM2(formatDecimal(vM2));

        setPrazoObra(String(i.prazoObraMeses));
        setPrazoVendas(String(i.prazoVendasMeses));
        setTma(formatDecimal(i.taxaDescontoAA));
        setStatus(normalizeStatus(e.status));
        setViewMode('form');
    };

    const novoEstudoForm = () => {
        setEstudoId(null); setObraNome(''); setEmpresaNome(''); setDestinatario(''); setCnpj(''); setLocalizacao(''); setTipo('loteamento');
        setAreaTerreno(formatDecimal(100000)); setAreaApp(formatDecimal(10000)); setPercentuais(PRESETS_AREAS.loteamento.padrao); setLoteMedio(formatDecimal(350));
        setCustoM2(formatDecimal(150)); setValorVendaM2(formatDecimal(600)); setPrazoObra('24'); setPrazoVendas('36'); setTma(formatDecimal(12)); setStatus('rascunho');
        setViewMode('form');
    };

    const handleGerarPdf = () => {
        setGerandoPdf(true);
        setTimeout(() => {
            window.print();
            setGerandoPdf(false);
        }, 500);
    };

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {mensagemSucesso && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm print:hidden">
                    <span>{mensagemSucesso}</span>
                    <button onClick={() => setMensagemSucesso(null)} className="text-emerald-900 font-bold ml-2">×</button>
                </div>
            )}
            {mensagemErro && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm print:hidden">
                    <span>{mensagemErro}</span>
                    <button onClick={() => setMensagemErro(null)} className="text-red-900 font-bold ml-2">×</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-purple-600" /> Estudo de Viabilidade Inicial
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">Acompanhe o pipeline em Kanban ou monte simulações profissionais</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('pipeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Layers className="w-4 h-4" /> <span>Pipeline Kanban</span></button>
                    <button onClick={novoEstudoForm} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Calculator className="w-4 h-4" /> <span>Novo Estudo / Simulador</span></button>
                </div>
            </div>

            {viewMode === 'pipeline' ? (
                carregando ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
                ) : (
                    <div className="space-y-4 print:hidden">
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={busca}
                                    onChange={(e: any) => setBusca(e.target.value)}
                                    placeholder="Buscar por empreendimento, local ou empresa..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                            {STATUS_PIPELINE.map((col) => {
                                const itens = estudosFiltrados.filter(e => normalizeStatus(e.status) === col.id);
                                const isCompact = itens.length > 3;

                                return (
                                    <div
                                        key={col.id}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const id = e.dataTransfer.getData("text/plain");
                                            if (id) {
                                                handleMudarStatus(id, col.id as EstudoStatus);
                                            }
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3 w-80 shrink-0 snap-start flex flex-col max-h-[75vh]"
                                    >
                                        <div className="flex justify-between items-center px-1 shrink-0">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{col.label}</h3>
                                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200">{itens.length}</span>
                                        </div>

                                        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                                            {itens.length === 0 ? (
                                                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                                                    Arraste um estudo para cá
                                                </div>
                                            ) : (
                                                itens.map(e => (
                                                    <EstudoCard
                                                        key={e.id}
                                                        estudo={e}
                                                        ativo={e.id === estudoId}
                                                        gerando={false}
                                                        compact={isCompact}
                                                        draggable={true}
                                                        onEditar={() => carregarEstudoNoForm(e)}
                                                        onPdf={() => {
                                                            carregarEstudoNoForm(e);
                                                            setTimeout(() => handleGerarPdf(), 300);
                                                        }}
                                                        onExcluir={() => handleExcluir(e.id)}
                                                        onStatus={(s) => handleMudarStatus(e.id, s)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                        <Button onClick={() => handleSalvar(false)} disabled={salvando} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold h-9 px-4">
                            <Save className="w-4 h-4 mr-1.5" /> {estudoId ? "Salvar Estudo Selecionado" : "Salvar Estudo"}
                        </Button>
                        <Button onClick={() => handleSalvar(true)} disabled={salvando} variant="outline" className="rounded-xl text-xs font-bold border-slate-200 h-9 px-4">
                            <FilePlus2 className="w-4 h-4 mr-1.5" /> Salvar como Novo
                        </Button>
                        <Button onClick={handleGerarPdf} disabled={gerandoPdf} className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white h-9 px-4">
                            {gerandoPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />} Exportar PDF
                        </Button>
                        <Button onClick={() => downloadViabilidadeInicialCsv(input, r)} variant="secondary" className="rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 px-4">
                            <Sheet className="w-4 h-4 mr-1.5" /> Exportar CSV
                        </Button>
                    </div>

                    {/* === INÍCIO DO FORMULÁRIO (Somente Tela) === */}
                    <div ref={reportRef} className="space-y-6 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:hidden">

                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">SPECHOTTO</h2>
                                <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">Assessoria & Construção</p>
                            </div>
                            <div className="text-right text-xs text-slate-600 space-y-0.5">
                                <p className="font-bold">Cuiabá, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                <p>{localizacao || 'Cuiabá - MT'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-5 space-y-6">
                                <Card className="rounded-2xl border-slate-200 shadow-sm">
                                    <CardHeader><CardTitle className="text-sm font-bold">Identificação</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Nome do Empreendimento *</Label>
                                            <Input type="text" value={obraNome} onChange={(e) => setObraNome(e.target.value)} placeholder="Obrigatório — vira o título do estudo" className="rounded-xl bg-slate-50 border-slate-200 text-sm" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><Label className="text-xs font-medium text-slate-500">Empresa</Label><Input type="text" value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 text-sm" /></div>
                                            <div className="space-y-1"><Label className="text-xs font-medium text-slate-500">Destinatário</Label><Input type="text" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} placeholder="Ex.: Pablo / Thiago" className="rounded-xl bg-slate-50 border-slate-200 text-sm" /></div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Localização / Cidade do Brasil</Label>
                                            <CidadeAutocomplete value={localizacao} onChange={setLocalizacao} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm">
                                    <CardHeader><CardTitle className="text-sm font-bold">Tipo de Empreendimento</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {(['loteamento', 'condominio'] as TipoEmpreendimento[]).map((t) => (
                                            <button key={t} type="button" onClick={() => setTipo(t)} className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${tipo === t ? 'border-purple-500 bg-purple-50 font-bold text-purple-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200'}`}>
                                                <div className="text-xs font-bold">{PRESETS_AREAS[t].label}</div>
                                                <div className="text-[11px] font-normal mt-0.5 opacity-80">{PRESETS_AREAS[t].lei} • Custo padrão {formatBRL(PRESETS_AREAS[t].custoM2)}/m²</div>
                                            </button>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm">
                                    <CardHeader><CardTitle className="text-sm font-bold">Quadro de áreas</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><Label className="text-xs font-medium text-slate-500">Área do Terreno (m²)</Label><Input value={areaTerreno} onChange={(e) => setAreaTerreno(maskDecimal(e.target.value))} className="text-right bg-slate-50" /></div>
                                            <div className="space-y-1"><Label className="text-xs font-medium text-slate-500">Área de APP (m²)</Label><Input value={areaApp} onChange={(e) => setAreaApp(maskDecimal(e.target.value))} className="text-right bg-slate-50" /></div>
                                        </div>

                                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between font-bold text-slate-700">
                                            <span>Área útil após APP:</span><span>{formatDecimal(r.areaBase)} m²</span>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600">Sistema Viário <br /><span className="text-[10px] text-slate-400">Auto-ajusta pelo lote médio</span></span>
                                                <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.viario / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.viario} onChange={(e) => setPercentuais(p => ({ ...p, viario: Number(e.target.value) || 0 }))} className="w-16 text-right font-medium" />%</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600">Áreas Verdes e Lazer</span>
                                                <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.verde / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.verde} onChange={(e) => setPercentuais(p => ({ ...p, verde: Number(e.target.value) || 0 }))} className="w-16 text-right font-medium" />%</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600">Áreas Institucionais</span>
                                                <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.institucional / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.institucional} onChange={(e) => setPercentuais(p => ({ ...p, institucional: Number(e.target.value) || 0 }))} className="w-16 text-right font-medium" />%</div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-center">
                                            <div className="font-bold text-slate-800">Área privativa / vendável: {formatDecimal(r.areaVendavel)} m²</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{r.pctVendavel.toFixed(2)}% da área útil • {r.aproveitamentoPct.toFixed(2)}% do terreno</div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-slate-500">Metragem média dos lotes (m²)</Label>
                                            <Input value={loteMedio} onChange={(e) => setLoteMedio(maskDecimal(e.target.value))} className="text-right font-bold text-blue-600 bg-blue-50 border-blue-200" />
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs font-black text-center text-purple-900">
                                            Quantidade estimada de lotes: {r.qtdLotes} lotes
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm">
                                    <CardHeader><CardTitle className="text-sm font-bold">Financeiro (custo vs venda)</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 text-xs">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-500">Custo por m² de área privativa</Label>
                                            <Input value={custoM2} onChange={(e) => setCustoM2(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Custo total estimado da obra</span><span className="font-bold text-slate-800">{formatBRL(r.custoTotal)}</span></div>
                                        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Custo por lote</span><span className="font-bold text-slate-800">{formatBRL(r.custoPorLote)}</span></div>
                                        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Valor de venda por lote (média)</span><span className="font-bold text-emerald-600">{formatBRL(r.valorVendaLote)}</span></div>

                                        <div className="space-y-1 pt-2">
                                            <Label className="text-xs font-bold text-emerald-700">Valor de venda por m² privativo</Label>
                                            <Input value={valorVendaM2} onChange={(e) => setValorVendaM2(maskDecimal(e.target.value))} className="text-right font-bold text-emerald-700 bg-emerald-50 border-emerald-200" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-slate-200 shadow-sm">
                                    <CardHeader><CardTitle className="text-sm font-bold">Projeção temporal</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 text-xs">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 font-medium">Prazo da obra (meses)</Label>
                                                <Input value={prazoObra} onChange={(e) => setPrazoObra(e.target.value)} className="text-right bg-slate-50" type="number" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 font-medium">Prazo de vendas (meses)</Label>
                                                <Input value={prazoVendas} onChange={(e) => setPrazoVendas(e.target.value)} className="text-right bg-slate-50" type="number" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-slate-500 font-medium">Taxa de desconto / TMA (% a.a.)</Label>
                                            <Input value={tma} onChange={(e) => setTma(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                                        </div>
                                        <div className="flex justify-between items-center py-2 bg-slate-100 rounded-xl px-3 font-bold border border-slate-200">
                                            <span className="text-slate-600">VPL (pela TMA)</span><span className="text-slate-800 text-sm">{formatBRL(r.vpl)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-7 space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                        <CardContent className="p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VGV Estimado</p>
                                            <p className="text-base font-black text-slate-900 mt-1">{formatBRL(r.vgvTotal)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                        <CardContent className="p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custo Total</p>
                                            <p className="text-base font-black text-red-500 mt-1">{formatBRL(r.custoTotal)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                        <CardContent className="p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Margem Bruta</p>
                                            <p className="text-base font-black text-emerald-500 mt-1">{formatBRL(r.margemBruta)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-slate-200 shadow-sm text-center">
                                        <CardContent className="p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ROI Inicial</p>
                                            <p className="text-base font-black text-blue-600 mt-1">{r.roi.toFixed(2)}%</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
                                        <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold text-slate-800">Composição de áreas</div>
                                        <div className="p-6 flex flex-col items-center">
                                            <div className="w-32 h-32">
                                                <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional, 0]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8', '#f59e0b']} />
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-3 mt-6 text-[10px] text-slate-600 font-medium">
                                                <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-900 mr-1.5" /> Vendável</span>
                                                <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" /> Viário</span>
                                                <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Verde/Lazer</span>
                                                <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5" /> Institucional</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
                                        <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold text-slate-800">Custo × VGV × Margem</div>
                                        <div className="p-6">
                                            <BarSVG c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} />
                                        </div>
                                    </Card>
                                </div>

                                <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
                                    <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold flex justify-between items-center text-slate-800">
                                        Curva S — Fluxo de caixa
                                        <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">TIR Anual: <strong className="text-purple-600">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</strong></span>
                                    </div>
                                    <div className="p-6 pt-8">
                                        <SCurveSVG data={r.graficoFluxo} />
                                        <div className="flex justify-between mt-3 text-[9px] text-slate-400 font-bold uppercase">
                                            <span>Início da Obra</span>
                                            {r.mesBreakEven !== null && <span className="text-emerald-500">Break-even (Mês {r.mesBreakEven})</span>}
                                            <span>Fim dos Recebimentos (Mês {r.graficoFluxo.length - 1})</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                    {/* === FIM DO FORMULÁRIO === */}


                    {/* ============================================================================== */}
                    {/* === INÍCIO DO RELATÓRIO DE IMPRESSÃO PROFISSIONAL (SOMENTE PDF/IMPRESSÃO) === */}
                    {/* ============================================================================== */}
                    <div className="hidden print:block bg-white text-slate-900 w-full p-2">

                        {/* PÁGINA 1: CABEÇALHO, APRESENTAÇÃO E CONSIDERAÇÕES */}
                        <div>
                            {/* 1. CABEÇALHO CORPORATIVO COM LOGOS GRANDES E TÍTULO CENTRALIZADO */}
                            <div className="grid grid-cols-3 items-center border-b-4 border-blue-900 pb-4 mb-6 w-full">
                                <div className="flex justify-start items-center">
                                    <img src="/logo-spechotto.png" alt="Spechotto Assessoria & Construção" className="h-20 max-h-20 w-auto object-contain" />
                                </div>
                                <div className="text-center">
                                    <h1 className="text-base font-black text-blue-950 uppercase tracking-wider m-0 p-0 leading-tight">ESTUDO DE VIABILIDADE INICIAL</h1>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Análise Econômica e Urbanística</p>
                                </div>
                                <div className="flex justify-end items-center">
                                    <img src="/logo-meurbanismo.jpg" alt="meUrbanismo" className="h-16 max-h-16 w-auto object-contain" />
                                </div>
                            </div>

                            {/* 2. DADOS DE IDENTIFICAÇÃO E INTRODUÇÃO */}
                            <div className="mb-6 space-y-3 text-xs leading-relaxed text-justify">
                                <div className="text-right text-[11px] text-slate-600 space-y-0.5 mb-2">
                                    <p className="font-bold">Cuiabá, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
                                </div>
                                <p><strong>Aos cuidados de:</strong> {destinatario || 'Cliente / Investidor'}</p>
                                <p><strong>Assunto:</strong> Estudo de Viabilidade Inicial — {obraNome || 'Novo Empreendimento'} ({localizacao || 'Cuiabá - MT'})</p>
                                <p className="pt-1">Prezado(a),</p>
                                <p>Em atendimento a vossa solicitação, apresentamos a seguir o <strong>Estudo de Viabilidade Inicial</strong> para o empreendimento denominado <strong>{obraNome || 'Não definido'}</strong>, localizado na cidade de <strong>{localizacao || 'Cuiabá - MT'}</strong>.</p>
                                <p>Aproveitamos a oportunidade para reafirmar nosso compromisso em atendê-los com os mais elevados níveis de qualidade, buscando oferecer as melhores soluções tecnológicas associadas às boas práticas da engenharia e da construção. Agradecemos desde já a confiança depositada e nos colocamos à vossa inteira disposição para os esclarecimentos que se fizerem necessários.</p>
                            </div>

                            {/* 3. CONSIDERAÇÕES INICIAIS */}
                            <div className="mb-4 text-xs leading-relaxed text-justify">
                                <h3 className="text-xs font-bold text-blue-900 border-b border-blue-900 pb-1 mb-2 uppercase tracking-widest">Considerações Iniciais</h3>
                                <p className="mb-1.5">O estudo de viabilidade a seguir foi elaborado de forma estimada e prévia, utilizando como base os parâmetros mínimos de projeto e as informações base de metragem. Para um estudo mais detalhado será necessário projeto preliminar e definições legais de município e estado, principalmente relacionadas a questões ambientais e à eventual existência de Área de Preservação Permanente (APP).</p>
                                <p>Quando houver APP, recomenda-se que a área de doação obrigatória seja adquirida externamente ao empreendimento, de modo a não reduzir a área vendável. Como infraestrutura básica, o empreendimento deverá contemplar: rede de drenagem, dreno de bordo nas ruas, rede de abastecimento de água, tratamento de esgoto, pavimentação asfáltica, rede de energia e iluminação, garantindo qualidade superior ao produto final.</p>
                            </div>
                        </div>

                        {/* === QUEBRA DE PÁGINA OBRIGATÓRIA PARA A PÁGINA 2 (TABELAS) === */}
                        <div className="print:break-before-page pt-2"></div>

                        {/* PÁGINA 2: TABELAS (QUADRO DE ÁREAS E INDICADORES) */}
                        <div className="w-full">
                            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-4 pb-1 border-b border-slate-300">Sumário Executivo e Métricas Numéricas</h3>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Quadro de Áreas */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-blue-900 border-b border-blue-900 pb-1 mb-2 uppercase tracking-widest">Quadro de Áreas</h4>
                                    <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                                        <thead>
                                            <tr className="bg-blue-900 text-white">
                                                <th className="py-1 px-2 border-b border-slate-300">Destinação</th>
                                                <th className="py-1 px-2 text-right border-b border-slate-300">Área (m²)</th>
                                                <th className="py-1 px-2 text-right border-b border-slate-300">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            <tr className="bg-slate-50"><td className="py-1 px-2 font-bold">Área total da gleba</td><td className="py-1 px-2 text-right font-medium">{formatDecimal(input.areaTerreno)}</td><td className="py-1 px-2 text-right">100%</td></tr>
                                            <tr><td className="py-1 px-2">Área de APP (deduzida)</td><td className="py-1 px-2 text-right text-red-600">{formatDecimal(input.areaApp)}</td><td className="py-1 px-2 text-right text-red-600">{formatDecimal((input.areaApp / input.areaTerreno) * 100)}%</td></tr>
                                            <tr className="bg-slate-100"><td className="py-1 px-2 font-bold text-slate-700">Área útil (após APP)</td><td className="py-1 px-2 text-right font-bold text-slate-700">{formatDecimal(r.areaBase)}</td><td className="py-1 px-2 text-right font-bold text-slate-700">{formatDecimal((r.areaBase / input.areaTerreno) * 100)}%</td></tr>
                                            <tr><td className="py-1 px-2">Sistema Viário</td><td className="py-1 px-2 text-right">{formatDecimal((input.percentuais.viario / 100) * r.areaBase)}</td><td className="py-1 px-2 text-right">{formatDecimal((((input.percentuais.viario / 100) * r.areaBase) / input.areaTerreno) * 100)}%</td></tr>
                                            <tr><td className="py-1 px-2">Áreas Verdes e Lazer</td><td className="py-1 px-2 text-right">{formatDecimal((input.percentuais.verde / 100) * r.areaBase)}</td><td className="py-1 px-2 text-right">{formatDecimal((((input.percentuais.verde / 100) * r.areaBase) / input.areaTerreno) * 100)}%</td></tr>
                                            <tr><td className="py-1 px-2">Áreas Institucionais</td><td className="py-1 px-2 text-right">{formatDecimal((input.percentuais.institucional / 100) * r.areaBase)}</td><td className="py-1 px-2 text-right">{formatDecimal((((input.percentuais.institucional / 100) * r.areaBase) / input.areaTerreno) * 100)}%</td></tr>
                                            <tr className="bg-blue-50 border-t-2 border-blue-200"><td className="py-1 px-2 font-black text-blue-900">Área privativa (Vendável)</td><td className="py-1 px-2 text-right font-black text-blue-900">{formatDecimal(r.areaVendavel)}</td><td className="py-1 px-2 text-right font-black text-blue-900">{formatDecimal(r.aproveitamentoPct)}%</td></tr>
                                            <tr className="bg-white"><td className="py-1 px-2 font-bold text-slate-600">Lotes estimados</td><td className="py-1 px-2 text-right font-bold text-slate-600">{r.qtdLotes} lotes</td><td className="py-1 px-2 text-right text-slate-600">{formatDecimal(input.loteMedio)} m²/lote</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Indicadores Financeiros */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-blue-900 border-b border-blue-900 pb-1 mb-2 uppercase tracking-widest">Indicadores Financeiros</h4>
                                    <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                                        <thead>
                                            <tr className="bg-slate-800 text-white">
                                                <th className="py-1 px-2 border-b border-slate-300">Métrica</th>
                                                <th className="py-1 px-2 text-right border-b border-slate-300">Valor Estimado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            <tr><td className="py-1 px-2 text-slate-700">Custo Ref. por m² privativo</td><td className="py-1 px-2 text-right font-medium">{formatBRL(input.custoM2Privativo)}</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">Venda Ref. por m² privativo</td><td className="py-1 px-2 text-right font-medium">{formatBRL(input.valorVendaM2)}</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">Custo médio por lote</td><td className="py-1 px-2 text-right font-medium">{formatBRL(r.custoPorLote)}</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">Venda média por lote</td><td className="py-1 px-2 text-right font-medium">{formatBRL(r.valorVendaLote)}</td></tr>
                                            <tr className="bg-red-50"><td className="py-1 px-2 font-bold text-slate-900">Custo Total da Obra</td><td className="py-1 px-2 text-right font-black text-red-700">{formatBRL(r.custoTotal)}</td></tr>
                                            <tr className="bg-emerald-50"><td className="py-1 px-2 font-bold text-slate-900">VGV Total Estimado</td><td className="py-1 px-2 text-right font-black text-emerald-700">{formatBRL(r.vgvTotal)}</td></tr>
                                            <tr><td className="py-1 px-2 font-bold text-slate-700">Margem Bruta (R$)</td><td className="py-1 px-2 text-right font-bold text-slate-800">{formatBRL(r.margemBruta)}</td></tr>
                                            <tr><td className="py-1 px-2 font-bold text-slate-700">Margem sobre VGV (%)</td><td className="py-1 px-2 text-right font-bold text-slate-800">{r.margemPct.toFixed(2)}%</td></tr>
                                            <tr className="bg-blue-50"><td className="py-1 px-2 font-bold text-blue-900">ROI Inicial Estimado</td><td className="py-1 px-2 text-right font-black text-blue-700">{r.roi.toFixed(2)}%</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">TIR Anual Aproximada</td><td className="py-1 px-2 text-right font-medium">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">VPL (TMA {input.taxaDescontoAA}% a.a.)</td><td className="py-1 px-2 text-right font-medium">{formatBRL(r.vpl)}</td></tr>
                                            <tr><td className="py-1 px-2 text-slate-700">Prazos (Obra / Vendas)</td><td className="py-1 px-2 text-right font-medium">{input.prazoObraMeses} / {input.prazoVendasMeses} meses</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* === QUEBRA DE PÁGINA OBRIGATÓRIA PARA A PÁGINA 3 (GRÁFICOS) === */}
                        <div className="print:break-before-page pt-2"></div>

                        {/* PÁGINA 3: GRÁFICOS (USO DO SOLO, CUSTO x VGV E CURVA S) */}
                        <div className="w-full">
                            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-4 pb-1 border-b border-slate-300">Análise Gráfica e Fluxo de Caixa</h3>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Gráfico 1: Áreas */}
                                <div className="flex flex-col items-center justify-center p-3 border border-slate-300 rounded-xl bg-slate-50">
                                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3">Uso do Solo (Áreas)</h4>
                                    <div className="w-28 h-28">
                                        <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional, 0]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8', '#f59e0b']} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] text-slate-700 w-full max-w-[200px]">
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-900 mr-1.5" /> Vendável: {r.pctVendavel.toFixed(1)}%</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" /> Viário: {input.percentuais.viario.toFixed(1)}%</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" /> Verdes: {input.percentuais.verde.toFixed(1)}%</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" /> Inst.: {input.percentuais.institucional.toFixed(1)}%</span>
                                    </div>
                                </div>

                                {/* Gráfico 2: Financeiro */}
                                <div className="flex flex-col items-center justify-center p-3 border border-slate-300 rounded-xl bg-slate-50">
                                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-2">Custo × VGV × Margem</h4>
                                    <div className="w-full max-w-[240px]">
                                        <BarSVG c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} />
                                    </div>
                                </div>
                            </div>

                            {/* Gráfico 3: Curva S */}
                            <div className="p-4 border border-slate-300 rounded-xl bg-slate-50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Curva S — Fluxo de Caixa Acumulado</h4>
                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                        TIR Anual: {r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}
                                    </span>
                                </div>
                                <div className="pt-1">
                                    <SCurveSVG data={r.graficoFluxo} />
                                    <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase">
                                        <span>Início da Obra</span>
                                        {r.mesBreakEven !== null && <span className="text-emerald-600 font-black">Break-even (Mês {r.mesBreakEven})</span>}
                                        <span>Fim dos Recebimentos (Mês {r.graficoFluxo.length - 1})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === QUEBRA DE PÁGINA OBRIGATÓRIA PARA A PÁGINA 4 (NOTA TÉCNICA E ASSINATURA) === */}
                        <div className="print:break-before-page pt-2"></div>

                        {/* PÁGINA 4: NOTA TÉCNICA E ASSINATURA */}
                        <div className="w-full">
                            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-4 pb-1 border-b border-slate-300">Fundamentação Técnica</h3>

                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-blue-900 border-b border-blue-900 pb-1 mb-3 uppercase tracking-widest">Nota Técnica: Eficiência de Gleba e Tipologia</h4>
                                <div className="text-xs leading-relaxed text-justify text-slate-700 space-y-3">
                                    <p><strong>Eficiência Média de Mercado:</strong> Em projetos de urbanismo no Brasil, a proporção média de área vendável em relação à área útil do terreno situa-se historicamente entre <strong>50% e 65%</strong>. A variação exata depende do relevo, formato do polígono e exigências legais do município.</p>

                                    <p><strong>Loteamento Aberto (Lei 6.766/1979):</strong> Apresenta eficiência média de <strong>50% a 58%</strong>. Neste modelo, vias, praças e áreas institucionais são compulsoriamente doadas ao município. As exigências rígidas de caixa de rua e recuos tendem a consumir maior proporção da gleba com o sistema viário.</p>

                                    <p><strong>Condomínio de Lotes / Fechado (Lei 13.465/2017):</strong> Permite eficiência superior, variando de <strong>58% a 68%</strong>. Como as vias internas e áreas de lazer consistem em áreas comuns privativas, o projeto urbano é otimizado através da adoção de vias dimensionadas ao tráfego local e *cul-de-sacs*, minimizando as perdas de terreno.</p>

                                    <p><strong>Fatores Modificadores:</strong> A eficiência da gleba é diretamente afetada pelo tamanho dos lotes adotados. Lotes amplos (ex: sítios de recreio a partir de 1.000 m²) demandam menos área de circulação por hectare, podendo elevar a eficiência para além de 65%. Em contrapartida, APPs severas, declividades acima de 30% e polígonos irregulares reduzem significativamente o índice de aproveitamento.</p>

                                    <div className="p-3 bg-slate-100 border-l-4 border-blue-900 font-medium my-3">
                                        <strong>Parâmetro Adotado Neste Estudo:</strong> {PRESETS_AREAS[input.tipo].label} baseado na {PRESETS_AREAS[input.tipo].lei}, considerando área média de {formatDecimal(input.loteMedio)} m² por lote. Os custos de obra refletem referenciais médios consolidados para esta tipologia construtiva.
                                    </div>
                                </div>
                            </div>

                            {/* Assinatura */}
                            <div className="mt-12 pt-6 text-center text-xs text-slate-800">
                                <div className="w-64 border-b-2 border-slate-900 mx-auto mb-3"></div>
                                <p className="font-black text-sm uppercase tracking-wider">Rennan Seidl Spechotto</p>
                                <p className="font-bold text-slate-600 mt-0.5">Engenheiro e Especialista em Gerenciamento de Obras</p>
                                <p className="font-bold text-slate-600">Spechotto Assessoria & Construção</p>
                                <p className="text-[10px] text-slate-400 mt-3 font-medium">Documento gerado pela plataforma meUrbanismo • {new Date().getFullYear()}</p>
                            </div>
                        </div>

                    </div>
                    {/* ======================= FIM DO RELATÓRIO DE IMPRESSÃO ======================== */}

                </div>
            )}
        </div>
    );
};