import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
    EstudoCard,
    STATUS_PIPELINE,
    normalizeStatus,
    type EstudoRow,
    type EstudoStatus,
} from "./EstudoCard";

// --- UI E HELPERS EMBUTIDOS PARA GARANTIR O BUILD ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const Button = React.forwardRef(({ className = '', variant = 'default', children, ...props }: any, ref: any) => {
    let base = "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 h-9 px-4 py-2 ";
    if (variant === 'outline') base += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 ";
    else if (variant === 'ghost') base += "hover:bg-slate-100 text-slate-700 ";
    else base += "bg-purple-600 hover:bg-purple-700 text-white ";
    return <button ref={ref} className={cn(base, className)} {...props}>{children}</button>;
});

const Input = React.forwardRef(({ className = '', ...props }: any, ref: any) => (
    <input ref={ref} className={cn("flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm shadow-2xs outline-none focus:ring-1 focus:ring-purple-500", className)} {...props} />
));

const normalizar = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// ----------------------------------------------------

const CORES: Record<EstudoStatus, string> = {
    rascunho: "bg-slate-100 text-slate-700 border border-slate-200",
    enviado: "bg-amber-50 text-amber-800 border border-amber-200",
    aprovado: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    arquivado: "bg-slate-100 text-slate-500 border border-slate-200",
};

export function PipelineBoard({
    estudos,
    estudoId,
    gerandoCard,
    onEditar,
    onPdf,
    onExcluir,
    onStatus,
}: {
    estudos: EstudoRow[];
    estudoId: string | null;
    gerandoCard: string | null;
    onEditar: (e: EstudoRow) => void;
    onPdf: (e: EstudoRow) => void;
    onExcluir: (e: EstudoRow) => void;
    onStatus: (e: EstudoRow, s: EstudoStatus) => void;
}) {
    const [busca, setBusca] = useState("");

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, novoStatus: EstudoStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const estudoAlvo = estudos.find((x) => x.id === id);
        if (estudoAlvo && normalizeStatus(estudoAlvo.status) !== novoStatus) {
            onStatus(estudoAlvo, novoStatus);
        }
    };

    return (
        <div className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STATUS_PIPELINE.map((col) => {
                    const itens = estudosFiltrados.filter(
                        (e) => normalizeStatus(e.status) === col.id
                    );
                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3 min-h-[400px] flex flex-col"
                        >
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    {col.label}
                                </h3>
                                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                                    {itens.length}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                {itens.length === 0 ? (
                                    <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                                        Nenhum estudo nesta etapa
                                    </div>
                                ) : (
                                    itens.map((estudo) => (
                                        <EstudoCard
                                            key={estudo.id}
                                            estudo={estudo}
                                            ativo={estudo.id === estudoId}
                                            gerando={gerandoCard === estudo.id}
                                            draggable={true}
                                            onEditar={() => onEditar(estudo)}
                                            onPdf={() => onPdf(estudo)}
                                            onExcluir={() => onExcluir(estudo)}
                                            onStatus={(s) => onStatus(estudo, s)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}