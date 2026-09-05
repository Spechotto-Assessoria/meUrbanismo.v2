import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PRESETS_AREAS,
  calcViabilidadeInicial,
  calcularEficienciaViaria,
  type TipoEmpreendimento,
  type ViabilidadeInicialInput
} from '../lib/viabilidade-inicial';
import { formatDecimal, unmask, vendaAPartirDoCusto } from '../components/viabilidade/formatters';
import { inferirValorVendaM2, normalizeStatus, rowToInput, type EstudoRow, type EstudoStatus } from '../components/viabilidade/EstudoCard';

export function useEstudoViabilidadeForm() {
  const [estudoId, setEstudoId] = useState<string | null>(null);
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
  const [custoM2, setCustoM2State] = useState(formatDecimal(PRESETS_AREAS.loteamento.custoM2));
  const [valorVendaM2, setValorVendaM2] = useState(formatDecimal(vendaAPartirDoCusto(PRESETS_AREAS.loteamento.custoM2)));
  const [prazoObra, setPrazoObra] = useState('36');
  const [prazoVendas, setPrazoVendas] = useState('60');
  const [tma, setTma] = useState(formatDecimal(12));
  const [status, setStatus] = useState<EstudoStatus>('rascunho');
  const [viewMode, setViewMode] = useState<'pipeline' | 'form'>('pipeline');

  const pularAutoViario = useRef(false);

  const setCustoM2 = (mascarado: string) => {
    setCustoM2State(mascarado);
    setValorVendaM2(formatDecimal(vendaAPartirDoCusto(unmask(mascarado))));
  };

  useEffect(() => {
    if (viewMode !== 'form') return;
    if (pularAutoViario.current) {
      pularAutoViario.current = false;
      return;
    }
    const lote = unmask(loteMedio);
    if (lote > 0) {
      setPercentuais(p => ({ ...p, viario: parseFloat(calcularEficienciaViaria(lote).toFixed(2)) }));
    }
  }, [loteMedio, viewMode]);

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
    valorVendaM2: unmask(valorVendaM2),
    taxaDescontoAA: unmask(tma),
    prazoObraMeses: unmask(prazoObra),
    prazoVendasMeses: unmask(prazoVendas)
  }), [obraNome, empresaNome, cnpj, localizacao, destinatario, tipo, areaTerreno, areaApp, percentuais, loteMedio, custoM2, valorVendaM2, tma, prazoObra, prazoVendas]);

  const resultado = useMemo(() => calcViabilidadeInicial(input), [input]);

  const aplicarTipo = (t: TipoEmpreendimento) => {
    setTipo(t);
    setPercentuais(PRESETS_AREAS[t].padrao);
    setCustoM2(formatDecimal(PRESETS_AREAS[t].custoM2));
  };

  const hidratar = (e: EstudoRow) => {
    pularAutoViario.current = true;
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
    setCustoM2State(formatDecimal(i.custoM2Privativo));
    setValorVendaM2(formatDecimal(inferirValorVendaM2(e)));
    setPrazoObra(String(i.prazoObraMeses));
    setPrazoVendas(String(i.prazoVendasMeses));
    setTma(formatDecimal(i.taxaDescontoAA));
    setStatus(normalizeStatus(e.status));
    setViewMode('form');
  };

  const resetar = () => {
    pularAutoViario.current = true;
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
    setLoteMedio(formatDecimal(350));
    setCustoM2(formatDecimal(PRESETS_AREAS.loteamento.custoM2));
    setPrazoObra('36');
    setPrazoVendas('60');
    setTma(formatDecimal(12));
    setStatus('rascunho');
    setViewMode('form');
  };

  const montarPayload = () => ({
    id: estudoId ?? undefined,
    titulo: obraNome.trim(),
    empresa_nome: empresaNome || null,
    destinatario: destinatario || null,
    cnpj: cnpj || null,
    localizacao: localizacao || null,
    tipo,
    area_terreno: input.areaTerreno,
    area_app: input.areaApp,
    pct_vendavel: resultado.pctVendavel,
    pct_viario: percentuais.viario,
    pct_verde: percentuais.verde,
    pct_institucional: percentuais.institucional,
    lote_medio: input.loteMedio,
    custo_m2_privativo: input.custoM2Privativo,
    valor_venda_m2: input.valorVendaM2,
    custo_total: resultado.custoTotal,
    vgv_total: resultado.vgvTotal,
    valor_lote: resultado.valorVendaLote,
    prazo_obra_meses: input.prazoObraMeses,
    prazo_vendas_meses: input.prazoVendasMeses,
    taxa_desconto_aa: input.taxaDescontoAA,
    status,
    updated_at: new Date().toISOString()
  });

  return {
    estudoId,
    setEstudoId,
    obraNome,
    setObraNome,
    empresaNome,
    setEmpresaNome,
    destinatario,
    setDestinatario,
    cnpj,
    setCnpj,
    localizacao,
    setLocalizacao,
    tipo,
    aplicarTipo,
    areaTerreno,
    setAreaTerreno,
    areaApp,
    setAreaApp,
    percentuais,
    setPercentuais,
    loteMedio,
    setLoteMedio,
    custoM2,
    setCustoM2,
    valorVendaM2,
    setValorVendaM2,
    prazoObra,
    setPrazoObra,
    prazoVendas,
    setPrazoVendas,
    tma,
    setTma,
    status,
    viewMode,
    setViewMode,
    input,
    resultado,
    hidratar,
    resetar,
    montarPayload
  };
}
