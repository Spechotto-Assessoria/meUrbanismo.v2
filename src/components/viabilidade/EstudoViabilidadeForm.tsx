import React from 'react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../tabs/ui-components';
import { CidadeAutocomplete } from './CidadeAutocomplete';
import { DonutSVG, BarSVG, SCurveSVG } from './ViabilidadeCharts';
import { formatBRL, formatDecimal, maskDecimal } from './formatters';
import { PRESETS_AREAS, type TipoEmpreendimento } from '../../lib/viabilidade-inicial';
import type { useEstudoViabilidadeForm } from '../../hooks/useEstudoViabilidadeForm';

type FormApi = ReturnType<typeof useEstudoViabilidadeForm>;

export const EstudoViabilidadeForm: React.FC<{ form: FormApi }> = ({ form }) => {
  const { input, resultado: r } = form;

  return (
    <div className="space-y-6 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:hidden">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">SPECHOTTO</h2>
          <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">Assessoria & Construção</p>
        </div>
        <div className="text-right text-xs text-slate-600 space-y-0.5">
          <p className="font-bold">Cuiabá, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p>{form.localizacao || 'Cuiabá - MT'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-bold">Identificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nome do Empreendimento *</Label>
                <Input type="text" value={form.obraNome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setObraNome(e.target.value)} placeholder="Obrigatório — vira o título do estudo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Empresa</Label><Input type="text" value={form.empresaNome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setEmpresaNome(e.target.value)} /></div>
                <div className="space-y-1"><Label>Destinatário</Label><Input type="text" value={form.destinatario} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setDestinatario(e.target.value)} placeholder="Ex.: Pablo / Thiago" /></div>
              </div>
              <div className="space-y-1">
                <Label>CNPJ</Label>
                <Input type="text" value={form.cnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label>Localização / Cidade do Brasil</Label>
                <CidadeAutocomplete value={form.localizacao} onChange={form.setLocalizacao} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-bold">Tipo de Empreendimento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(['loteamento', 'condominio'] as TipoEmpreendimento[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => form.aplicarTipo(t)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${form.tipo === t ? 'border-blue-800 bg-blue-50 font-bold text-blue-950' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200'}`}
                >
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
                <div className="space-y-1"><Label>Área do Terreno (m²)</Label><Input value={form.areaTerreno} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setAreaTerreno(maskDecimal(e.target.value))} className="text-right" /></div>
                <div className="space-y-1"><Label>Área de APP (m²)</Label><Input value={form.areaApp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setAreaApp(maskDecimal(e.target.value))} className="text-right" /></div>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between font-bold text-slate-700">
                <span>Área útil após APP:</span><span>{formatDecimal(r.areaBase)} m²</span>
              </div>
              {([
                ['viario', 'Sistema Viário', true],
                ['verde', 'Áreas Verdes e Lazer', false],
                ['institucional', 'Áreas Institucionais', false]
              ] as const).map(([chave, rotulo, auto]) => (
                <div key={chave} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">
                    {rotulo}
                    {auto && <><br /><span className="text-[10px] text-slate-400">Auto-ajusta pelo lote médio</span></>}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{formatDecimal((input.percentuais[chave] / 100) * r.areaBase)} m²</span>
                    <Input type="number" value={form.percentuais[chave]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPercentuais(p => ({ ...p, [chave]: Number(e.target.value) || 0 }))} className="w-16 text-right font-medium" />%
                  </div>
                </div>
              ))}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-center">
                <div className="font-bold text-slate-800">Área privativa / vendável: {formatDecimal(r.areaVendavel)} m²</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{r.pctVendavel.toFixed(2)}% da área útil • {r.aproveitamentoPct.toFixed(2)}% do terreno</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Metragem média dos lotes (m²)</Label>
                <Input value={form.loteMedio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setLoteMedio(maskDecimal(e.target.value))} className="text-right font-bold text-blue-700 bg-blue-50 border-blue-200" />
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs font-black text-center text-blue-950">
                Quantidade estimada de lotes: {r.qtdLotes} lotes
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-bold">Financeiro (custo vs venda)</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Custo por m² de área privativa</Label>
                <Input value={form.custoM2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setCustoM2(maskDecimal(e.target.value))} className="text-right" />
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Custo total estimado da obra</span><span className="font-bold text-slate-800">{formatBRL(r.custoTotal)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Custo por lote</span><span className="font-bold text-slate-800">{formatBRL(r.custoPorLote)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-600">Valor de venda por lote (média)</span><span className="font-bold text-emerald-700">{formatBRL(r.valorVendaLote)}</span></div>
              <div className="space-y-1 pt-2">
                <Label className="text-xs font-bold text-emerald-700">Valor de venda por m² privativo</Label>
                <Input value={form.valorVendaM2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setValorVendaM2(maskDecimal(e.target.value))} className="text-right font-bold text-emerald-700 bg-emerald-50 border-emerald-200" />
                <p className="text-[10px] text-slate-400">Preenchido como 4× o custo (custo = 25% da venda). Editável.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-bold">Projeção temporal</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prazo da obra (meses)</Label>
                  <Input value={form.prazoObra} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPrazoObra(e.target.value)} className="text-right" type="number" />
                </div>
                <div className="space-y-1">
                  <Label>Prazo de vendas (meses)</Label>
                  <Input value={form.prazoVendas} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPrazoVendas(e.target.value)} className="text-right" type="number" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Taxa de desconto / TMA (% a.a.)</Label>
                <Input value={form.tma} onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setTma(maskDecimal(e.target.value))} className="text-right" />
              </div>
              <div className="flex justify-between items-center py-2 bg-slate-100 rounded-xl px-3 font-bold border border-slate-200">
                <span className="text-slate-600">VPL (pela TMA)</span><span className="text-slate-800 text-sm">{formatBRL(r.vpl)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['VGV Estimado', formatBRL(r.vgvTotal), 'text-slate-900'],
              ['Custo Total', formatBRL(r.custoTotal), 'text-red-600'],
              ['Margem Bruta', formatBRL(r.margemBruta), 'text-emerald-600'],
              ['ROI Inicial', `${r.roi.toFixed(2)}%`, 'text-blue-800']
            ].map(([label, valor, cor]) => (
              <Card key={label} className="rounded-2xl border-slate-200 shadow-sm text-center">
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-base font-black mt-1 ${cor}`}>{valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
              <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold text-slate-800">Composição de áreas</div>
              <div className="p-6 flex flex-col items-center">
                <DonutSVG values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8']} />
                <div className="flex flex-wrap justify-center gap-3 mt-6 text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-900 mr-1.5" /> Vendável</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" /> Viário</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Verde/Lazer</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5" /> Institucional</span>
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
              <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold text-slate-800">Custo × VGV × Margem</div>
              <div className="p-6"><BarSVG c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} /></div>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm overflow-hidden border-slate-200">
            <div className="bg-slate-50 p-4 border-b border-slate-100 text-sm font-bold flex justify-between items-center text-slate-800">
              Curva S — Fluxo de caixa
              <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                TIR Anual: <strong className="text-blue-800">{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</strong>
              </span>
            </div>
            <div className="p-6 pt-8">
              <SCurveSVG data={r.graficoFluxo} />
              <div className="flex justify-between mt-3 text-[9px] text-slate-400 font-bold uppercase">
                <span>Início da Obra</span>
                {r.mesBreakEven !== null && <span className="text-emerald-600">Break-even (Mês {r.mesBreakEven})</span>}
                <span>Fim dos Recebimentos (Mês {r.graficoFluxo.length - 1})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
