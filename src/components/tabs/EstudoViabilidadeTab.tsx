import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Layers, ArrowLeft, Save, FilePlus2, FileDown, Sheet, Loader2, Trash2, Pencil, X } from 'lucide-react';

// IMPORTAÇÃO CORINGA BLINDADA (Restaurada para não dar erro no Vite)
import * as SupabaseModule from '../../services/supabase';
const supabase = (SupabaseModule as any).supabase || (SupabaseModule as any).default || SupabaseModule;

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui-components';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';
import {
    PRESETS_AREAS, NOTA_TECNICA, calcViabilidadeInicial, calcularEficienciaViaria,
    TipoEmpreendimento, ViabilidadeInicialInput, ViabilidadeInicialResult
} from '../../lib/viabilidade-inicial';
import { EstudoRow, EstudoStatus, STATUS_PIPELINE, normalizeStatus, rowToInput } from '../viabilidade/EstudoCard';

// --- MASCARAS ---
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

// --- COMPONENTES DE GRÁFICOS SVG NATIVOS (BLINDADOS CONTRA ERRO DE BUILD) ---
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
                <span className="text-[10px] mt-1.5 text-slate-500">Custo total</span>
            </div>
            <div className="flex flex-col items-center w-12 h-full justify-end group">
                <div style={{ height: `${(v / max) * 100}%` }} className="w-full bg-blue-500 rounded-t-md transition-all" />
                <span className="text-[10px] mt-1.5 text-slate-500 font-medium">VGV estimado</span>
            </div>
            <div className="flex flex-col items-center w-12 h-full justify-end group">
                <div style={{ height: `${(m / max) * 100}%` }} className="w-full bg-emerald-500 rounded-t-md transition-all" />
                <span className="text-[10px] mt-1.5 text-slate-500">Margem bruta</span>
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
            <div className="absolute top-0 -left-12 text-[9px] text-slate-400">{formatBRL(max).split(',')[0]}</div>
            <div className="absolute bottom-0 -left-12 text-[9px] text-slate-400">{formatBRL(min).split(',')[0]}</div>
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

    // Eficiência Dinâmica do Sistema Viário (Auto-ajuste pelo Lote)
    useEffect(() => {
        const lote = unmask(loteMedio);
        if (lote > 0 && viewMode === 'form') {
            const autoViario = calcularEficienciaViaria(lote);
            setPercentuais(p => ({ ...p, viario: parseFloat(autoViario.toFixed(2)) }));
        }
    }, [loteMedio, viewMode]);

    const buscarEstudos = async () => {
        if (!supabase || typeof supabase.from !== 'function') return;
        setCarregando(true);
        const { data } = await supabase.from('viabilidade_inicial_estudos').select('*').order('updated_at', { ascending: false });
        if (data) setEstudos(data as EstudoRow[]);
        setCarregando(false);
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
        if (!obraNome.trim() || !supabase || typeof supabase.from !== 'function') return;
        setSalvando(true);
        const payload = {
            titulo: obraNome.trim(), empresa_nome: empresaNome || null, destinatario: destinatario || null,
            cnpj: cnpj || null, localizacao: localizacao || null, tipo,
            area_terreno: input.areaTerreno, area_app: input.areaApp, pct_vendavel: r.pctVendavel,
            pct_viario: percentuais.viario, pct_verde: percentuais.verde, pct_institucional: percentuais.institucional,
            lote_medio: input.loteMedio, custo_m2_privativo: input.custoM2Privativo, custo_total: r.custoTotal,
            vgv_total: r.vgvTotal, valor_lote: r.valorVendaLote, prazo_obra_meses: input.prazoObraMeses,
            prazo_vendas_meses: input.prazoVendasMeses, taxa_desconto_aa: input.taxaDescontoAA, status,
        };
        if (!comoNovo && estudoId) await supabase.from('viabilidade_inicial_estudos').update(payload).eq('id', estudoId);
        else {
            const { data } = await supabase.from('viabilidade_inicial_estudos').insert(payload).select('id').single();
            if (data) setEstudoId(data.id);
        }
        await buscarEstudos();
        setViewMode('pipeline');
        setSalvando(false);
    };

    const novoEstudoForm = () => {
        setEstudoId(null); setObraNome(''); setLocalizacao(''); setTipo('loteamento');
        setAreaTerreno(formatDecimal(100000)); setAreaApp(formatDecimal(10000)); setLoteMedio(formatDecimal(350));
        setCustoM2(formatDecimal(150)); setValorVendaM2(formatDecimal(600)); setStatus('rascunho');
        setViewMode('form');
    };

    return (
        <div className="space-y-6 pb-12 max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-purple-600" /> Estudo de Viabilidade Inicial
                        </h1>
                        <p className="text-xs text-slate-500">Acompanhe o pipeline em Kanban ou monte simulações</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('pipeline')} className={`flex-1 flex justify-center py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Layers className="w-4 h-4 mr-2" /> Pipeline Kanban</button>
                    <button onClick={novoEstudoForm} className={`flex-1 flex justify-center py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Calculator className="w-4 h-4 mr-2" /> Novo Estudo</button>
                </div>
            </div>

            {viewMode === 'form' && (
                <div className="space-y-6">
                    <div className="flex gap-2">
                        <Button onClick={() => handleSalvar(false)} disabled={salvando} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"><Save className="w-4 h-4 mr-1.5" /> Salvar Estudo</Button>
                        <Button onClick={() => handleSalvar(true)} disabled={salvando} variant="outline" className="flex-1 rounded-xl text-xs"><FilePlus2 className="w-4 h-4 mr-1.5" /> Salvar Novo</Button>
                    </div>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader><CardTitle className="text-sm font-bold">Quadro de áreas</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Área útil disponível / Área do terreno</Label>
                                <Input value={areaTerreno} onChange={(e) => setAreaTerreno(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Área de APP (opcional)</Label>
                                <Input value={areaApp} onChange={(e) => setAreaApp(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                            </div>
                            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between font-bold">
                                <span>Área útil após APP:</span><span>{formatDecimal(r.areaBase)} m²</span>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-600">Sistema Viário <br /><span className="text-[10px] text-slate-400">Auto-ajusta pelo lote médio</span></span>
                                    <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.viario / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.viario} onChange={(e) => setPercentuais(p => ({ ...p, viario: Number(e.target.value) || 0 }))} className="w-16 text-right" />%</div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-600">Áreas Verdes e Lazer</span>
                                    <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.verde / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.verde} onChange={(e) => setPercentuais(p => ({ ...p, verde: Number(e.target.value) || 0 }))} className="w-16 text-right" />%</div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-600">Áreas Institucionais</span>
                                    <div className="flex items-center gap-2"><span className="text-slate-500">{formatDecimal((input.percentuais.institucional / 100) * r.areaBase)} m²</span><Input type="number" value={percentuais.institucional} onChange={(e) => setPercentuais(p => ({ ...p, institucional: Number(e.target.value) || 0 }))} className="w-16 text-right" />%</div>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-center">
                                <div className="font-bold text-slate-800">Área privativa / vendável: {formatDecimal(r.areaVendavel)} m²</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{r.pctVendavel.toFixed(2)}% da área útil • {r.aproveitamentoPct.toFixed(2)}% do terreno</div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Metragem média dos lotes (m²)</Label>
                                <Input value={loteMedio} onChange={(e) => setLoteMedio(maskDecimal(e.target.value))} className="text-right font-bold text-blue-600 bg-blue-50" />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-center text-slate-700">
                                Quantidade estimada de lotes: {r.qtdLotes} lotes
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader><CardTitle className="text-sm font-bold">Financeiro (custo vs venda)</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Custo por m² de área privativa</Label>
                                <Input value={custoM2} onChange={(e) => setCustoM2(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                            </div>
                            <div className="flex justify-between py-2 border-b"><span>Custo total estimado da obra</span><span className="font-bold">{formatBRL(r.custoTotal)}</span></div>
                            <div className="flex justify-between py-2 border-b"><span>Custo por lote</span><span className="font-bold">{formatBRL(r.custoPorLote)}</span></div>
                            <div className="flex justify-between py-2 border-b"><span>Valor de venda por lote (média)</span><span className="font-bold text-emerald-600">{formatBRL(r.valorVendaLote)}</span></div>

                            <div className="space-y-1 pt-2">
                                <Label className="text-xs text-slate-500 font-bold text-emerald-700">Valor de venda por m² privativo</Label>
                                <Input value={valorVendaM2} onChange={(e) => setValorVendaM2(maskDecimal(e.target.value))} className="text-right font-bold text-emerald-700 bg-emerald-50 border-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader><CardTitle className="text-sm font-bold">Projeção temporal</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <Label className="text-slate-500">Prazo da obra (meses)</Label>
                                <Input value={prazoObra} onChange={(e) => setPrazoObra(e.target.value)} className="text-right bg-slate-50" type="number" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-500">Prazo de vendas (meses)</Label>
                                <Input value={prazoVendas} onChange={(e) => setPrazoVendas(e.target.value)} className="text-right bg-slate-50" type="number" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-500">Taxa de desconto / TMA (% a.a.)</Label>
                                <Input value={tma} onChange={(e) => setTma(maskDecimal(e.target.value))} className="text-right bg-slate-50" />
                                <p className="text-[10px] text-slate-400">Usada no VPL do fluxo (10% entrada + saldo parcelado no prazo de vendas)</p>
                            </div>
                            <div className="flex justify-between py-2 bg-slate-100 rounded-xl px-3 font-bold">
                                <span>VPL pela TMA informada</span><span className="text-slate-800">{formatBRL(r.vpl)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-3">
                        <Card className="rounded-2xl p-4 shadow-sm"><span className="text-xs text-slate-500 font-bold">VGV TOTAL ESTIMADO</span><div className="text-xl font-black mt-1 text-slate-900">{formatBRL(r.vgvTotal)}</div></Card>
                        <Card className="rounded-2xl p-4 shadow-sm"><span className="text-xs text-slate-500 font-bold">MARGEM BRUTA</span><div className="text-xl font-black mt-1 text-emerald-600">{formatBRL(r.margemBruta)}</div></Card>
                        <Card className="rounded-2xl p-4 shadow-sm"><span className="text-xs text-slate-500 font-bold">MARGEM SOBRE VGV</span><div className="text-xl font-black mt-1 text-slate-900">{r.margemPct.toFixed(2)}%</div></Card>
                        <Card className="rounded-2xl p-4 shadow-sm"><span className="text-xs text-slate-500 font-bold">ROI INICIAL</span><div className="text-xl font-black mt-1 text-blue-600">{r.roi.toFixed(2)}%</div></Card>
                        <Card className="rounded-2xl p-4 shadow-sm"><span className="text-xs text-slate-500 font-bold">TIR ANUAL ESTIMADA</span><div className="text-xl font-black mt-1 text-purple-600">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'Não calculável'}</div></Card>
                    </div>

                    <Card className="rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b text-sm font-bold">Composição do quadro de áreas</div>
                        <div className="p-6 flex flex-col items-center">
                            <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional, 0]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8', '#f59e0b']} />
                            <div className="flex flex-wrap justify-center gap-3 mt-6 text-[10px] text-slate-600">
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-900 mr-1" /> Vendável</span>
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1" /> Viário</span>
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Verde/Lazer</span>
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-1" /> Institucional</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b text-sm font-bold">Custo × VGV × Margem</div>
                        <div className="p-6">
                            <BarSVG c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} />
                        </div>
                    </Card>

                    <Card className="rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b text-sm font-bold">Curva S — Fluxo de caixa acumulado</div>
                        <div className="p-4 pt-8">
                            <SCurveSVG data={r.graficoFluxo} />
                            <div className="flex justify-between mt-2 text-[8px] text-slate-400">
                                <span>Mês 0</span><span>Metade</span><span>Mês {r.graficoFluxo.length - 1}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader><CardTitle className="text-sm font-bold">Resumo dos resultados</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Área privativa</span><span className="font-bold">{formatDecimal(r.areaVendavel)} m²</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Quantidade de lotes</span><span className="font-bold">{r.qtdLotes} lotes</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Custo por m² privativo</span><span className="font-bold">{formatBRL(input.custoM2Privativo)}</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Venda por m² privativo</span><span className="font-bold">{formatBRL(input.valorVendaM2)}</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Custo por lote</span><span className="font-bold">{formatBRL(r.custoPorLote)}</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Venda por lote</span><span className="font-bold">{formatBRL(r.valorVendaLote)}</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>Aproveitamento do terreno</span><span className="font-bold">{r.aproveitamentoPct.toFixed(2)}%</span></div>
                            <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"><span>TIR anual estimada</span><span className="font-bold text-purple-600">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</span></div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm bg-slate-50">
                        <div className="p-4 space-y-4">
                            {NOTA_TECNICA.map((n, i) => (
                                <div key={i} className="text-xs"><h4 className="font-bold text-slate-800 mb-1">{n.titulo}</h4><p className="text-slate-600">{n.paragrafos[0]}</p></div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};