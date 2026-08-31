export type TipoEmpreendimento = 'loteamento' | 'condominio';

export const PRESETS_AREAS = {
    loteamento: {
        label: "Loteamento Aberto",
        lei: "Lei 6.766/1979",
        custoM2: 80.00,
        padrao: { viario: 22, verde: 12, institucional: 6 },
    },
    condominio: {
        label: "Condominio Fechado / Condominio de Lotes",
        lei: "Lei 13.465/2017",
        custoM2: 150.00,
        padrao: { viario: 20, verde: 12, institucional: 6 },
    }
};

export const LABELS_AREAS = {
    viario: "Sistema Viário (faixa 18%~22%)",
    verde: "Áreas Verdes e Lazer (faixa 10%~15%)",
    institucional: "Áreas Institucionais (faixa 0%~8%)",
};

export type ViabilidadeInicialInput = {
    obraNome: string;
    empresaNome: string;
    cnpj: string;
    localizacao: string;
    destinatario: string;
    tipo: TipoEmpreendimento;
    areaTerreno: number;
    areaApp: number;
    percentuais: { viario: number; verde: number; institucional: number };
    loteMedio: number;
    custoM2Privativo: number;
    valorVendaM2: number;
    taxaDescontoAA: number;
    prazoObraMeses: number;
    prazoVendasMeses: number;
};

export type GraficoPonto = { mes: number; fcl: number; acumulado: number };

export type ViabilidadeInicialResult = {
    areaBase: number;
    pctVendavel: number;
    areaVendavel: number;
    qtdLotes: number;
    vgvTotal: number;
    custoTotal: number;
    valorVendaLote: number;
    custoPorLote: number;
    margemBruta: number;
    margemPct: number;
    aproveitamentoPct: number;
    roi: number;
    tirAnual: number | null;
    vpl: number;
    exposicaoMaxima: number;
    mesBreakEven: number | null;
    graficoFluxo: GraficoPonto[];
};

// Algoritmo de Interpolação para Eficiência Viária Dinâmica
export function calcularEficienciaViaria(loteMedio: number): number {
    if (loteMedio <= 250) return 24.00;
    if (loteMedio >= 1500) return 13.00;
    return 24.00 - (11.00 * ((loteMedio - 250) / 1250));
}

// Algoritmo Newton-Raphson para aproximação da Taxa Interna de Retorno (TIR)
function calcularTIR(fluxo: number[], guess = 0.01): number | null {
    const maxIter = 1000;
    const tol = 1e-6;
    let rate = guess;

    for (let i = 0; i < maxIter; i++) {
        let npv = 0;
        let dNpv = 0;
        for (let t = 0; t < fluxo.length; t++) {
            npv += fluxo[t] / Math.pow(1 + rate, t);
            if (t > 0) dNpv -= (t * fluxo[t]) / Math.pow(1 + rate, t + 1);
        }
        if (Math.abs(dNpv) < 1e-12) return null; // Prevenção de divisão por zero
        const newRate = rate - npv / dNpv;
        if (Math.abs(newRate - rate) < tol) return newRate;
        rate = newRate;
    }
    return null;
}

export function calcViabilidadeInicial(input: ViabilidadeInicialInput): ViabilidadeInicialResult {
    const areaBase = input.areaTerreno - input.areaApp;
    const somaPct = (input.percentuais.viario + input.percentuais.verde + input.percentuais.institucional);
    const pctVendavel = Math.max(0, 100 - somaPct);
    const areaVendavel = areaBase * (pctVendavel / 100);

    const qtdLotes = input.loteMedio > 0 ? Math.floor(areaVendavel / input.loteMedio) : 0;
    const vgvTotal = areaVendavel * input.valorVendaM2;
    const custoTotal = areaVendavel * input.custoM2Privativo;

    const margemBruta = vgvTotal - custoTotal;
    const margemPct = vgvTotal > 0 ? (margemBruta / vgvTotal) * 100 : 0;
    const roi = custoTotal > 0 ? ((vgvTotal - custoTotal) / custoTotal) * 100 : 0;
    const aproveitamentoPct = input.areaTerreno > 0 ? (areaVendavel / input.areaTerreno) * 100 : 0;

    const valorVendaLote = qtdLotes > 0 ? vgvTotal / qtdLotes : 0;
    const custoPorLote = qtdLotes > 0 ? custoTotal / qtdLotes : 0;

    // GERADOR DE FLUXO DE CAIXA: Curva S + Efeito Escadinha
    const prazoObra = input.prazoObraMeses || 1;
    const prazoVendas = input.prazoVendasMeses || 1;
    const prazoFinanciamento = 60; // Padrão de 60 meses de parcelamento pós-entrada
    const mesesTotais = Math.max(prazoObra, prazoVendas + prazoFinanciamento) + 1;
    const fluxoCaixa = Array(mesesTotais).fill(0);

    // 1. Curva S - Desembolso de Obra
    for (let t = 1; t <= prazoObra; t++) {
        const xAtual = t / prazoObra;
        const xAnt = (t - 1) / prazoObra;
        const sAtual = 3 * Math.pow(xAtual, 2) - 2 * Math.pow(xAtual, 3);
        const sAnt = 3 * Math.pow(xAnt, 2) - 2 * Math.pow(xAnt, 3);
        fluxoCaixa[t] -= custoTotal * (sAtual - sAnt);
    }

    // 2. Receitas - Entrada + Escadinha de Parcelamento
    if (vgvTotal > 0 && prazoVendas > 0) {
        const vgvMensal = vgvTotal / prazoVendas;
        const pctEntrada = 0.10;
        const pctParcelado = 0.90;

        for (let v = 1; v <= prazoVendas; v++) {
            fluxoCaixa[v] += (vgvMensal * pctEntrada);
            const parcela = (vgvMensal * pctParcelado) / prazoFinanciamento;
            for (let p = 1; p <= prazoFinanciamento; p++) {
                if (v + p < fluxoCaixa.length) {
                    fluxoCaixa[v + p] += parcela;
                }
            }
        }
    }

    // 3. Indicadores Avançados (VPL, TIR, Exposição, Payback)
    const tmaMes = Math.pow(1 + (input.taxaDescontoAA / 100), 1 / 12) - 1;
    let vpl = 0;
    let acumulado = 0;
    let exposicaoMaxima = 0;
    let mesBreakEven = null;
    const graficoFluxo: GraficoPonto[] = [];

    for (let t = 0; t < fluxoCaixa.length; t++) {
        const fcl = fluxoCaixa[t];
        vpl += fcl / Math.pow(1 + tmaMes, t);
        acumulado += fcl;

        if (acumulado < exposicaoMaxima) exposicaoMaxima = acumulado;
        if (mesBreakEven === null && t > 0 && acumulado >= 0 && fluxoCaixa.slice(0, t).reduce((a, b) => a + b, 0) < 0) {
            mesBreakEven = t;
        }

        graficoFluxo.push({ mes: t, fcl, acumulado });
    }

    const tirMensal = calcularTIR(fluxoCaixa);
    const tirAnual = tirMensal !== null ? (Math.pow(1 + tirMensal, 12) - 1) * 100 : null;

    return {
        areaBase, pctVendavel, areaVendavel, qtdLotes,
        vgvTotal, custoTotal, valorVendaLote, custoPorLote,
        margemBruta, margemPct, aproveitamentoPct, roi,
        tirAnual, vpl, exposicaoMaxima, mesBreakEven, graficoFluxo
    };
}

export const NOTA_TECNICA = [
    {
        titulo: "1. Loteamentos Abertos (Lei 6.766/1979) — Eficiência Média: 50% a 58%",
        paragrafos: ["As vias, praças e áreas institucionais são obrigatoriamente doadas ao município. As exigências de caixas de rua (largura mínima das vias) e recuos municipais costumam ser mais rígidas, o que aumenta a proporção gasta com o sistema viário."]
    },
    {
        titulo: "2. Condomínios de Lotes / Fechados (Lei 13.465/2017) — Eficiência Média: 58% a 68%",
        paragrafos: ["As vias internas e áreas de lazer são áreas comuns privativas dos condôminos. O projetista consegue otimizar o desenho urbanístico com ruas mais estreitas, utilização de cul-de-sacs (ruas sem saída com balão de retorno) e redução de sobras de terreno, aumentando a área privativa comercializável."]
    }
];