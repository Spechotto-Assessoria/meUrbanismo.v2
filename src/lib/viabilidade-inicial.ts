export type TipoEmpreendimento = "loteamento" | "condominio";

export type PercentuaisAreas = {
    viario: number;
    verde: number;
    institucional: number;
};

export interface ViabilidadeInicialInput {
    obraNome: string;
    empresaNome: string;
    cnpj: string;
    localizacao: string;
    destinatario: string;
    tipo: TipoEmpreendimento;
    areaTerreno: number;
    areaApp: number;
    percentuais: PercentuaisAreas;
    loteMedio: number;
    custoM2Privativo: number;
    taxaDescontoAA: number;
    prazoObraMeses: number;
    prazoVendasMeses: number;
}

export interface ViabilidadeInicialResult {
    areaBase: number;
    areaApp: number;
    areaViario: number;
    areaVerde: number;
    areaInstitucional: number;
    areaVendavel: number;
    pctVendavel: number;
    aproveitamentoPct: number;
    qtdLotes: number;
    custoPorM2: number;
    valorM2Privativo: number;
    custoPorLote: number;
    valorVendaLote: number;
    custoTotal: number;
    vgvTotal: number;
    margemBruta: number;
    margemPct: number;
    roi: number;
    vpl: number;
    tirAnual: number | null;
    fluxoAcumulado: { mes: number; valor: number }[];
}

export const LABELS_AREAS: Record<keyof PercentuaisAreas, string> = {
    viario: "Sistema Viário",
    verde: "Áreas Verdes e Lazer",
    institucional: "Áreas Institucionais",
};

export const PRESETS_AREAS = {
    loteamento: {
        label: "Loteamento Aberto",
        lei: "Lei 6.766/1979",
        custoM2: 80,
        padrao: { viario: 20, verde: 12, institucional: 6 },
        faixas: { viario: [18, 22], verde: [10, 15], institucional: [0, 8] },
    },
    condominio: {
        label: "Condomínio Fechado / Condomínio de Lotes",
        lei: "Lei 13.465/2017",
        custoM2: 150,
        padrao: { viario: 18, verde: 12, institucional: 5 },
        faixas: { viario: [15, 20], verde: [8, 15], institucional: [0, 8] },
    },
};

export const CARTA_APRESENTACAO = [
    "Em atendimento a vossa solicitação, apresentamos a seguir o Estudo de Viabilidade Inicial do empreendimento descrito abaixo.",
    "Aproveitamos a oportunidade para reafirmar nosso compromisso em atendê-los com os mais elevados níveis de qualidade, buscando oferecer as melhores soluções tecnológicas associadas às boas práticas da engenharia e da construção.",
    "Agradecemos desde já a confiança depositada e nos colocamos à vossa inteira disposição para os esclarecimentos que se fizerem necessários."
];

export const CONSIDERACOES_INICIAIS = [
    "O estudo de viabilidade a seguir foi elaborado de forma estimada e prévia, utilizando como base os parâmetros mínimos de projeto e as informações contidas na matrícula enviada.",
    "Para um estudo mais detalhado será necessário projeto preliminar e definições legais de município e estado, principalmente relacionadas a questões ambientais e à eventual existência de APP na área. Quando houver, recomenda-se que a área de doação obrigatória seja adquirida externamente ao empreendimento, de modo a não reduzir a área vendável.",
    "Como infraestrutura básica, o empreendimento deverá contemplar: rede de drenagem, dreno de bordo nas ruas, rede de abastecimento de água, tratamento de esgoto, pavimentação asfáltica, rede de energia e iluminação, garantindo qualidade superior ao produto final.",
    "Demais definições deverão ser tomadas ao longo do desenvolvimento do projeto."
];

export const NOTA_TECNICA = [
    {
        titulo: "1. Loteamentos Abertos (Lei 6.766/1979) — Eficiência Média: 50% a 58%",
        paragrafos: [
            "As vias, praças e áreas institucionais são obrigatoriamente doadas ao município. As exigências de caixas de rua (largura mínima das vias) e recuos municipais costumam ser mais rígidas, o que aumenta a proporção gasta com o sistema viário."
        ]
    },
    {
        titulo: "2. Condomínios de Lotes / Fechados (Lei 13.465/2017) — Eficiência Média: 58% a 68%",
        paragrafos: [
            "As vias internas e áreas de lazer são áreas comuns privativas dos condôminos. O projetista consegue otimizar o desenho urbanístico com ruas mais estreitas, utilização de cul-de-sacs (ruas sem saída com balão de retorno) e redução de sobras de terreno, aumentando a área privativa comercializável."
        ]
    },
    {
        titulo: "Fatores que Reduzem ou Ampliam a Eficiência",
        paragrafos: [
            "Fatores que REDUZEM a área vendável (< 50%): presença de córregos, nascentes, declividades acentuadas (> 30%) ou APPs que não podem ser contadas como área verde útil; formato irregular do terreno (glebas afuniladas geram mais perdas viárias); exigências municipais de doação de áreas institucionais acima do padrão.",
            "Fatores que AMPLIAM a área vendável (> 65%): terrenos planos e de formato retangular/regular; lotes maiores (ex.: 1.000 m² ou mais), pois exigem menos ruas e interseções por hectare em comparação a loteamentos populares de lotes pequenos (125 m² a 200 m²)."
        ]
    }
];

export function calcViabilidadeInicial(input: ViabilidadeInicialInput): ViabilidadeInicialResult {
    const areaBase = Math.max(0, input.areaTerreno - input.areaApp);

    const pctViario = input.percentuais.viario / 100;
    const pctVerde = input.percentuais.verde / 100;
    const pctInstitucional = input.percentuais.institucional / 100;

    const areaViario = areaBase * pctViario;
    const areaVerde = areaBase * pctVerde;
    const areaInstitucional = areaBase * pctInstitucional;

    const areaVendavel = Math.max(0, areaBase - (areaViario + areaVerde + areaInstitucional));
    const pctVendavel = areaBase > 0 ? (areaVendavel / areaBase) * 100 : 0;
    const aproveitamentoPct = input.areaTerreno > 0 ? (areaVendavel / input.areaTerreno) * 100 : 0;

    const qtdLotes = input.loteMedio > 0 ? Math.floor(areaVendavel / input.loteMedio) : 0;

    const custoPorM2 = input.custoM2Privativo;
    const valorM2Privativo = custoPorM2 * 4; // Premissa: Custo representa 25% do valor de venda

    const custoTotal = areaVendavel * custoPorM2;
    const vgvTotal = areaVendavel * valorM2Privativo;

    const custoPorLote = qtdLotes > 0 ? custoTotal / qtdLotes : 0;
    const valorVendaLote = qtdLotes > 0 ? vgvTotal / qtdLotes : 0;

    const margemBruta = vgvTotal - custoTotal;
    const margemPct = vgvTotal > 0 ? (margemBruta / vgvTotal) * 100 : 0;
    const roi = custoTotal > 0 ? (margemBruta / custoTotal) * 100 : 0;

    // Projeção temporal simplificada para Curva S
    const mesesTotais = Math.max(1, input.prazoObraMeses + input.prazoVendasMeses);
    const desembolsoMensal = custoTotal / Math.max(1, input.prazoObraMeses);
    const receitaMensal = vgvTotal / Math.max(1, input.prazoVendasMeses);

    const fluxoAcumulado: { mes: number; valor: number }[] = [];
    let acumulado = 0;
    let vpl = 0;
    const taxaMensal = Math.pow(1 + input.taxaDescontoAA / 100, 1 / 12) - 1;

    for (let m = 1; m <= mesesTotais; m++) {
        const despesa = m <= input.prazoObraMeses ? desembolsoMensal : 0;
        const receita = m <= input.prazoVendasMeses ? receitaMensal : 0;
        const liquido = receita - despesa;

        acumulado += liquido;
        vpl += liquido / Math.pow(1 + taxaMensal, m);

        // Simplificando os pontos no gráfico para não sobrecarregar
        if (m % 3 === 0 || m === 1 || m === mesesTotais) {
            fluxoAcumulado.push({ mes: m, valor: acumulado });
        }
    }

    return {
        areaBase,
        areaApp: input.areaApp,
        areaViario,
        areaVerde,
        areaInstitucional,
        areaVendavel,
        pctVendavel,
        aproveitamentoPct,
        qtdLotes,
        custoPorM2,
        valorM2Privativo,
        custoPorLote,
        valorVendaLote,
        custoTotal,
        vgvTotal,
        margemBruta,
        margemPct,
        roi,
        vpl,
        tirAnual: roi > 0 ? Math.min(150, roi / 3.5) : 0, // Estimativa simplificada
        fluxoAcumulado,
    };
}