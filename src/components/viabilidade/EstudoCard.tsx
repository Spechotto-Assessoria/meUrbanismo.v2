import React from "react";
import { FileDown, Loader2, Pencil, Trash2 } from "lucide-react";
import {
    PRESETS_AREAS,
    calcViabilidadeInicial,
    type TipoEmpreendimento,
    type ViabilidadeInicialInput,
} from "../../lib/viabilidade-inicial";

// --- FORMATADORES E UI EMBUTIDOS PARA EVITAR ERROS DE BUILD ---
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
// --------------------------------------------------------------

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

export type EstudoRow = {
    id: string;
    titulo: string;
    empresa_nome: string | null;
    cnpj: string | null;
    localizacao: string | null;
    destinatario: string | null;
    tipo: string;
    status: string | null;
    taxa_desconto_aa: number | null;
    area_terreno: number;
    area_app: number;
    pct_vendavel: number;
    pct_viario: number;
    pct_verde: number;
    pct_institucional: number;
    lote_medio: number;
    custo_m2_privativo: number;
    custo_total: number;
    vgv_total: number;
    valor_lote: number;
    prazo_obra_meses: number;
    prazo_vendas_meses: number;
    updated_at: string;
};

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
        taxaDescontoAA: Number(e.taxa_desconto_aa) || 12,
        prazoObraMeses: Number(e.prazo_obra_meses) || 24,
        prazoVendasMeses: Number(e.prazo_vendas_meses) || 36,
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
            className={`bg-white rounded-2xl border border-slate-200 shadow-2xs ${ativo ? "border-purple-500 ring-1 ring-purple-200" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""
                }`}
        >
            <CardContent className={`space-y-3 ${compact ? "p-3" : "p-4"}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 text-sm">{estudo.titulo}</p>
                        <p className="truncate text-[11px] text-slate-500">
                            {[estudo.localizacao, preset.label].filter(Boolean).join(" • ")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(estudo.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-red-500 hover:bg-red-50"
                        onClick={onExcluir}
                        aria-label="Excluir estudo"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Mini label="VGV estimado" value={brlShort(r.vgvTotal)} />
                    <Mini label="Custo total" value={brlShort(r.custoTotal)} />
                    <Mini label="Qtd. de lotes" value={r.qtdLotes.toLocaleString("pt-BR")} />
                    <Mini label="ROI" value={pctBR(r.roi)} />
                </div>

                {onStatus && (
                    <select
                        value={normalizeStatus(estudo.status)}
                        onChange={(ev) => onStatus(ev.target.value as EstudoStatus)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700"
                        aria-label="Situação do estudo"
                    >
                        {STATUS_PIPELINE.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs rounded-xl" onClick={onEditar}>
                        <Pencil className="mr-1.5 h-3 w-3" /> Visualizar / Editar
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 text-xs rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100" onClick={onPdf} disabled={gerando}>
                        {gerando ? (
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                            <FileDown className="mr-1.5 h-3 w-3" />
                        )}
                        Baixar PDF
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Mini({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">{label}</p>
            <p className="truncate text-xs font-bold text-slate-800 tabular-nums">{value}</p>
        </div>
    );
}