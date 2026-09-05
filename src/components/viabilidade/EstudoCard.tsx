import React from "react";
import { FileDown, Loader2, Pencil, Trash2 } from "lucide-react";
import {
    PRESETS_AREAS,
    calcViabilidadeInicial,
    type TipoEmpreendimento,
    type ViabilidadeInicialInput,
} from "../../lib/viabilidade-inicial";
import type { EstudoViabilidade } from "../../types";

const brlShort = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(val);
};

const pctBR = (val: number) => {
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const Button = ({ children, className = '', variant = 'default', size = 'default', ...props }: any) => {
    let base = "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ";
    if (variant === 'outline') base += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 ";
    else if (variant === 'ghost') base += "hover:bg-slate-100 text-slate-700 ";
    else if (variant === 'secondary') base += "bg-slate-100 hover:bg-slate-200 text-slate-700 ";
    else base += "bg-purple-600 hover:bg-purple-700 text-white ";

    if (size === 'icon') base += "h-7 w-7 p-0 flex items-center justify-center ";
    else if (size === 'sm') base += "h-7 px-2.5 text-[10px] ";
    else base += "h-9 px-4 py-2 ";

    return <button className={`${base} ${className}`} {...props}>{children}</button>;
};

const Card = ({ className = '', children, ...props }: any) => (
    <div className={`rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`} {...props}>{children}</div>
);

const CardContent = ({ className = '', children, ...props }: any) => (
    <div className={`${className}`} {...props}>{children}</div>
);

export const STATUS_PIPELINE = [
    { id: "rascunho", label: "Rascunho / Em Estudo" },
    { id: "enviado", label: "Enviado / Em Análise" },
    { id: "aprovado", label: "Aprovado / Viável" },
    { id: "arquivado", label: "Arquivado" },
] as const;

export type EstudoStatus = (typeof STATUS_PIPELINE)[number]["id"];

export function normalizeStatus(s: string | null | undefined): EstudoStatus {
    return (STATUS_PIPELINE.find((x) => x.id === s)?.id ?? "rascunho") as EstudoStatus;
}

export type EstudoRow = EstudoViabilidade;

export function inferirValorVendaM2(e: EstudoRow): number {
    const salvo = Number(e.valor_venda_m2);
    if (salvo > 0) return salvo;
    const areaBase = Math.max(0, Number(e.area_terreno) - Number(e.area_app));
    const somaPct = Number(e.pct_viario) + Number(e.pct_verde) + Number(e.pct_institucional);
    const pctVendavel = Math.max(0, 100 - somaPct);
    const areaVendavel = areaBase * (pctVendavel / 100);
    return areaVendavel > 0 ? Number(e.vgv_total) / areaVendavel : 600;
}

export function rowToInput(e: EstudoRow): ViabilidadeInicialInput {
    const tipo: TipoEmpreendimento = e.tipo === "condominio" ? "condominio" : "loteamento";
    return {
        obraNome: e.titulo,
        empresaNome: e.empresa_nome ?? "",
        cnpj: e.cnpj ?? "",
        localizacao: e.localizacao ?? "",
        destinatario: e.destinatario ?? "",
        tipo,
        areaTerreno: Number(e.area_terreno) || 0,
        areaApp: Number(e.area_app) || 0,
        percentuais: {
            viario: Number(e.pct_viario) || PRESETS_AREAS[tipo].padrao.viario,
            verde: Number(e.pct_verde) || PRESETS_AREAS[tipo].padrao.verde,
            institucional: Number(e.pct_institucional) || PRESETS_AREAS[tipo].padrao.institucional,
        },
        loteMedio: Number(e.lote_medio) || 250,
        custoM2Privativo: Number(e.custo_m2_privativo) || PRESETS_AREAS[tipo].custoM2,
        valorVendaM2: inferirValorVendaM2(e),
        taxaDescontoAA: Number(e.taxa_desconto_aa) || 12,
        prazoObraMeses: Number(e.prazo_obra_meses) || 36,
        prazoVendasMeses: Number(e.prazo_vendas_meses) || 60,
    };
}

export function EstudoCard({
    estudo,
    ativo,
    gerando,
    compact,
    onEditar,
    onPdf,
    onExcluir,
    onStatus,
    draggable,
}: {
    estudo: EstudoRow;
    ativo: boolean;
    gerando: boolean;
    compact?: boolean;
    onEditar: () => void;
    onPdf: () => void;
    onExcluir: () => void;
    onStatus?: (s: EstudoStatus) => void;
    draggable?: boolean;
}) {
    const input = rowToInput(estudo);
    const r = calcViabilidadeInicial(input);
    const preset = PRESETS_AREAS[input.tipo];

    return (
        <Card
            draggable={draggable}
            onDragStart={(ev: any) => ev.dataTransfer.setData("text/plain", estudo.id)}
            className={`bg-white rounded-2xl border border-slate-200 shadow-2xs ${ativo ? "border-purple-500 ring-1 ring-purple-200" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
            <CardContent className={`space-y-2.5 ${compact ? "p-2.5" : "p-4"}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 text-xs sm:text-sm">{estudo.titulo}</p>
                        <p className="truncate text-[10px] text-slate-500">
                            {[estudo.localizacao, preset.label].filter(Boolean).join(" • ")}
                        </p>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 text-red-500 hover:bg-red-50"
                        onClick={onExcluir}
                        aria-label="Excluir estudo"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <Mini label="VGV" value={brlShort(r.vgvTotal)} />
                    <Mini label="Custo" value={brlShort(r.custoTotal)} />
                    {!compact && (
                        <>
                            <Mini label="Qtd. Lotes" value={r.qtdLotes.toLocaleString("pt-BR")} />
                            <Mini label="ROI" value={pctBR(r.roi)} />
                        </>
                    )}
                </div>

                {onStatus && (
                    <select
                        value={normalizeStatus(estudo.status)}
                        onChange={(ev) => onStatus(ev.target.value as EstudoStatus)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                        aria-label="Situação do estudo"
                    >
                        {STATUS_PIPELINE.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                )}

                <div className="flex gap-1.5 pt-0.5">
                    <Button size="sm" variant="outline" className="flex-1 text-[11px] h-7 rounded-xl" onClick={onEditar}>
                        <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 text-[11px] h-7 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100" onClick={onPdf} disabled={gerando}>
                        {gerando ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileDown className="mr-1 h-3 w-3" />} PDF
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Mini({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1">
            <p className="text-[8px] uppercase tracking-wide text-slate-400 font-bold">{label}</p>
            <p className="truncate text-[11px] font-bold text-slate-800 tabular-nums">{value}</p>
        </div>
    );
}