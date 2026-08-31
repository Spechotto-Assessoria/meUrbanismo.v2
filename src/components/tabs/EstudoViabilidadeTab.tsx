import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, Layers, ArrowLeft, Save, FilePlus2, FileDown, Sheet, Loader2, Trash2, Pencil, X } from 'lucide-react';

// CORREÇÃO: Apontando para o arquivo correto de serviço (supabase.ts que gerencia o LocalStorage)
import { apiService } from '../../services/supabase';

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui-components';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';
import {
    PRESETS_AREAS, NOTA_TECNICA, calcViabilidadeInicial, calcularEficienciaViaria,
    TipoEmpreendimento, ViabilidadeInicialInput, ViabilidadeInicialResult
} from '../../lib/viabilidade-inicial';
import { EstudoRow, EstudoStatus, STATUS_PIPELINE, normalizeStatus, rowToInput } from '../viabilidade/EstudoCard';

// --- MASCARAS E CSV ---
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

// --- GRÁFICOS SVG NATIVOS ---
const DonutSVG = ({ values, colors }: { values: number[], colors: string[] }) => {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    return (
        <svg viewBox="0 0 32 32" className="w-32 h-32 transform -rotate-90">
            {values.map((v, i) => {
                const dash = (v / total) * 100;
                const out = <circle key={i} r="15.915494309" cx="16" cy="16" fill="transparent" stroke={colors[i]} strokeWidth="6" strokeDasharray={`${dash} 100`} strokeDashoffset={-offset} />;
                offset += dash;
                return out;
            })}
        </svg>
    );
};

const BarSVG = ({ c, v, m }: { c: number, v: number, m: number }) => {
    const max = Math.max(c, v, m, 1);
    return (
        <div className="flex items-end justify-center gap-6 h-40 w-full pt-4 border-b border-slate-200">
            <div className="flex flex-col items-center w-12 h-full justify-end group">
                <div style={{ height: `${(c / max) * 100}%` }} className="w-full bg-blue-800 rounded-t-md transition-all" />
                <span className="text-[10px] mt-1.5 text-slate-500 font-bold">Custo total</span>
            </div>
            <div className="flex flex-col items-center w-12 h-full justify-end group">
                <div style={{ height: `${(v / max) * 100}%` }} className="w-full bg-blue-500 rounded-t-md transition-all" />
                <span className="text-[10px] mt-1.5 text-slate-500 font-bold">VGV est.</span>
            </div>
            <div className="flex flex-col items-center w-12 h-full justify-end group">
                <div style={{ height: `${(m / max) * 100}%` }} className="w-full bg-emerald-500 rounded-t-md transition-all" />
                <span className="text-[10px] mt-1.5 text-slate-500 font-bold">Margem</span>
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
        <div className="relative w-full h-48 mt-4 border-l border-b border-slate-200">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#94a3b8" strokeDasharray="2" strokeWidth="0.5" />
                <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
            </svg>
            <div className="absolute top-0 -left-12 text-[9px] text-slate-400 font-medium">{formatBRL(max).split(',')[0]}</div>
            <div className="absolute bottom-0 -left-12 text-[9px] text-slate-400 font-medium">{formatBRL(min).split(',')[0]}</div>
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
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm">
                    <span>{mensagemSucesso}</span>
                    <button onClick={() => setMensagemSucesso(null)} className="text-emerald-900 font-bold ml-2">×</button>
                </div>
            )}
            {mensagemErro && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                        {STATUS_PIPELINE.map((col) => {
                            const itens = estudos.filter(e => normalizeStatus(e.status) === col.id);
                            return (
                                <div key={col.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{col.label}</h3>
                                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200">{itens.length}</span>
                                    </div>
                                    {itens.length === 0 ? (
                                        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">Nenhum estudo</div>
                                    ) : (
                                        itens.map(e => (
                                            <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                <p className="font-bold text-xs text-slate-900 truncate">{e.titulo}</p>
                                                <p className="text-[10px] text-slate-500">{e.localizacao || 'Sem local'}</p>
                                                <div className="flex gap-1 pt-1">
                                                    <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" onClick={() => carregarEstudoNoForm(e)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleExcluir(e.id)}><Trash2 className="w-3 h-3" /></Button>
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
                    <div className="flex flex-wrap gap-2 justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                        <Button onClick={() => handleSalvar(false)} disabled={salvando} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
                            <Save className="w-4 h-4 mr-1.5" /> {estudoId ? "Salvar Estudo Selecionado" : "Salvar Estudo"}
                        </Button>
                        <Button onClick={() => handleSalvar(true)} disabled={salvando} variant="outline" className="rounded-xl text-xs font-bold border-slate-200">
                            <FilePlus2 className="w-4 h-4 mr-1.5" /> Salvar como Novo
                        </Button>
                        <Button onClick={handleGerarPdf} disabled={gerandoPdf} className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">
                            {gerandoPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />} Exportar PDF Profissional
                        </Button>
                        <Button onClick={() => downloadViabilidadeInicialCsv(input, r)} variant="secondary" className="rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">
                            <Sheet className="w-4 h-4 mr-1.5" /> Exportar Planilha (CSV)
                        </Button>
                    </div>

                    {/* ÁREA DE IMPRESSÃO / PDF PROFISSIONAL */}
                    <div ref={reportRef} className="space-y-6 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
                        {/* CABEÇALHO */}
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

                        {/* CORPO DO TEXTO */}
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed pt-2">
                            <p className="font-bold text-slate-900">Aos cuidados de: <span className="font-normal">{destinatario || 'Cliente / Investidor'}</span></p>
                            <p className="font-bold text-slate-900">Assunto: <span className="font-normal">Estudo de Viabilidade Inicial — {obraNome || 'Novo Empreendimento'}</span></p>

                            <p className="pt-2">Prezado(a),</p>
                            <p>
                                Em atendimento a vossa solicitação, apresentamos a seguir o <strong>Estudo de Viabilidade Inicial</strong> para o empreendimento <strong>{obraNome || 'Não definido'}</strong>, localizado na cidade de <strong>{localizacao || 'Cuiabá - MT'}</strong>.
                            </p>
                            <p>
                                Aproveitamos a oportunidade para reafirmar nosso compromisso em atendê-los com os mais elevados níveis de qualidade, buscando oferecer as melhores soluções tecnológicas associadas às boas práticas da engenharia e da construção.
                            </p>
                        </div>

                        {/* FORMULÁRIO (Exibido apenas em modo tela, oculto no PDF impresso) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
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
                                            <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional, 0]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8', '#f59e0b']} />
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

                                <Card className="rounded-2xl border-slate-200 shadow-sm bg-slate-50">
                                    <div className="p-5 space-y-4">
                                        {NOTA_TECNICA.map((n, i) => (
                                            <div key={i} className="text-xs">
                                                <h4 className="font-bold text-slate-800 mb-1">{n.titulo}</h4>
                                                <p className="text-slate-600 leading-relaxed">{n.paragrafos[0]}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* RELATÓRIO EXCLUSIVO PARA IMPRESSÃO / PDF COM GRÁFICOS */}
                        <div className="hidden print:block space-y-6 pt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="border border-slate-300 p-3 rounded-lg text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">VGV Estimado</p><p className="text-sm font-black text-slate-900 mt-1">{formatBRL(r.vgvTotal)}</p></div>
                                <div className="border border-slate-300 p-3 rounded-lg text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">Custo Total</p><p className="text-sm font-black text-red-600 mt-1">{formatBRL(r.custoTotal)}</p></div>
                                <div className="border border-slate-300 p-3 rounded-lg text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">Margem Bruta</p><p className="text-sm font-black text-emerald-600 mt-1">{formatBRL(r.margemBruta)}</p></div>
                                <div className="border border-slate-300 p-3 rounded-lg text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">ROI Inicial</p><p className="text-sm font-black text-blue-600 mt-1">{r.roi.toFixed(2)}%</p></div>
                            </div>

                            {/* GRÁFICOS INJETADOS NO PDF */}
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="border border-slate-300 rounded-lg p-4 flex flex-col items-center">
                                    <h3 className="font-bold text-xs uppercase text-slate-800 mb-4">Composição de Áreas</h3>
                                    <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional, 0]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8', '#f59e0b']} />
                                    <div className="flex flex-wrap justify-center gap-2 mt-4 text-[9px] text-slate-600 font-medium">
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-900 mr-1" /> Vendável</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1" /> Viário</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Verde/Lazer</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-1" /> Instit.</span>
                                    </div>
                                </div>
                                <div className="border border-slate-300 rounded-lg p-4 flex flex-col items-center">
                                    <h3 className="font-bold text-xs uppercase text-slate-800 mb-4">Custo × VGV × Margem</h3>
                                    <BarSVG c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} />
                                </div>
                            </div>
                            <div className="border border-slate-300 rounded-lg p-4 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-xs uppercase text-slate-800">Curva S — Fluxo de caixa</h3>
                                    <span className="text-[10px] font-bold text-purple-700">TIR: {r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</span>
                                </div>
                                <SCurveSVG data={r.graficoFluxo} />
                            </div>

                            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                                <h3 className="font-bold text-xs uppercase text-slate-800 border-b pb-1">Quadro de Áreas e Indicadores</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Área Total do Terreno:</span><span className="font-bold">{formatDecimal(unmask(areaTerreno))} m²</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Área Privativa / Vendável:</span><span className="font-bold">{formatDecimal(r.areaVendavel)} m² ({r.pctVendavel.toFixed(1)}%)</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Quantidade Estimada de Lotes:</span><span className="font-bold">{r.qtdLotes} lotes</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Metragem Média do Lote:</span><span className="font-bold">{loteMedio} m²</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Custo por m² Privativo:</span><span className="font-bold">{formatBRL(unmask(custoM2))}</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Venda por m² Privativo:</span><span className="font-bold">{formatBRL(unmask(valorVendaM2))}</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Custo por Lote:</span><span className="font-bold">{formatBRL(r.custoPorLote)}</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>Venda Média por Lote:</span><span className="font-bold">{formatBRL(r.valorVendaLote)}</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>TIR Anual Estimada:</span><span className="font-bold text-purple-700">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200"><span>VPL pela TMA ({tma}% a.a.):</span><span className="font-bold">{formatBRL(r.vpl)}</span></div>
                                </div>
                            </div>

                            <div className="border border-slate-300 rounded-lg p-4 space-y-2">
                                <h3 className="font-bold text-xs uppercase text-slate-800 border-b pb-1">Nota Técnica e Considerações</h3>
                                {NOTA_TECNICA.map((n, i) => (
                                    <div key={i} className="text-[11px] space-y-1">
                                        <p className="font-bold text-slate-800">{n.titulo}</p>
                                        <p className="text-slate-600 leading-snug">{n.paragrafos[0]}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-700 mt-8">
                                <div>
                                    <p className="font-bold text-slate-900">Rennan Seidl Spechotto</p>
                                    <p className="text-[10px] text-slate-500">Gerente de Obras / Especialista em Empreendimentos Horizontais</p>
                                    <p className="text-[10px] text-slate-500">WhatsApp: (65) 99608-2107 | spechotto.arq@outlook.com</p>
                                </div>
                                <div className="text-right text-[10px] text-slate-400">
                                    Spechotto Assessoria & Construção • meUrbanismo
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};