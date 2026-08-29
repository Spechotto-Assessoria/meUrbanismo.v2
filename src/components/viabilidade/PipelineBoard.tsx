import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizar } from "@/lib/cidades-br";
import {
    EstudoCard,
    STATUS_PIPELINE,
    normalizeStatus,
    type EstudoRow,
    type EstudoStatus,
} from "@/components/viabilidade/EstudoCard";

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
    const [over, setOver] = useState<EstudoStatus | null>(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<EstudoStatus | "todos">("todos");

    const filtrados = useMemo(() => {
        const q = normalizar(busca);
        if (!q) return estudos;
        return estudos.filter((e) =>
            [e.titulo, e.empresa_nome, e.localizacao].some((v) => v && normalizar(v).includes(q)),
        );
    }, [estudos, busca]);

    const colunas = STATUS_PIPELINE.filter((c) => filtro === "todos" || c.id === filtro);

    return (
        <section className="space-y-4">
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por Empreendimento / Empresa..."
                        className="pl-9 bg-slate-50 border-slate-200 rounded-xl"
                    />
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {(["todos", ...STATUS_PIPELINE.map((s) => s.id)] as const).map((id) => {
                        const label = id === "todos" ? "Todos" : STATUS_PIPELINE.find((s) => s.id === id)!.label;
                        return (
                            <Button
                                key={id}
                                size="sm"
                                variant={filtro === id ? "default" : "outline"}
                                className={`shrink-0 rounded-xl text-xs font-bold ${filtro === id ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                onClick={() => setFiltro(id as EstudoStatus | "todos")}
                            >
                                {label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4">
                {colunas.map((col) => {
                    const itens = filtrados.filter((e) => normalizeStatus(e.status) === col.id);
                    return (
                        <div
                            key={col.id}
                            onDragOver={(ev) => {
                                ev.preventDefault();
                                setOver(col.id);
                            }}
                            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
                            onDrop={(ev) => {
                                ev.preventDefault();
                                setOver(null);
                                const id = ev.dataTransfer.getData("text/plain");
                                const alvo = estudos.find((e) => e.id === id);
                                if (alvo && normalizeStatus(alvo.status) !== col.id) onStatus(alvo, col.id);
                            }}
                            className={`flex min-h-[300px] w-[280px] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition-colors sm:w-[320px] ${over === col.id ? "border-purple-500 bg-purple-50/50" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2 px-1">
                                <h3 className="truncate text-xs font-bold uppercase tracking-wider text-slate-600">
                                    {col.label}
                                </h3>
                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums ${CORES[col.id]}`}
                                >
                                    {itens.length}
                                </span>
                            </div>

                            {itens.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-xs text-slate-400">
                                    {busca ? "Nenhum estudo encontrado." : "Sem estudos nesta etapa"}
                                </div>
                            ) : (
                                itens.map((e) => (
                                    <EstudoCard
                                        key={e.id}
                                        estudo={e}
                                        compact
                                        draggable
                                        ativo={e.id === estudoId}
                                        gerando={false}
                                        onEditar={() => onEditar(e)}
                                        onPdf={() => onPdf(e)}
                                        onExcluir={() => onExcluir(e)}
                                        onStatus={(s) => onStatus(e, s)}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}