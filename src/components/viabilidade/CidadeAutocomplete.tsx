import React, { useEffect, useMemo, useState, useRef } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";

// --- UTILS & UI EMBUTIDOS PARA EVITAR ERRO DE BUILD ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const Button = React.forwardRef(({ className = '', variant = 'default', children, ...props }: any, ref: any) => {
    let base = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer ";
    if (variant === 'outline') base += "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 ";
    return <button ref={ref} className={cn(base, className)} {...props}>{children}</button>;
});

const Input = React.forwardRef(({ className = '', ...props }: any, ref: any) => (
    <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
));

// --- TIPOS E FUNÇÕES DE BUSCA EMBUTIDOS ---
export type Cidade = {
    nome: string;
    uf: string;
};

export function buscarCidades(termo: string, lista: Cidade[]): Cidade[] {
    if (!termo) return lista.slice(0, 50); // Mostra as 50 primeiras se não houver busca

    // Remove acentos e joga pra minúsculo para a busca ignorar formatação
    const termoClean = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return lista.filter(c => {
        const nomeClean = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nomeClean.includes(termoClean) || c.uf.toLowerCase().includes(termoClean);
    }).slice(0, 50);
}
// --------------------------------------------------------

let cacheIbge: Cidade[] | null = null;
let pending: Promise<Cidade[]> | null = null;

async function carregarIbge(): Promise<Cidade[]> {
    if (cacheIbge) return cacheIbge;
    if (!pending) {
        pending = fetch("https://servicosdados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome")
            .then((r) => r.json())
            .then((rows: any[]) =>
                rows.map((m) => ({
                    nome: String(m.nome),
                    uf: String(
                        m.microrregiao?.mesorregiao?.UF?.sigla ??
                        m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
                        "",
                    ),
                })),
            )
            .then((list) => {
                cacheIbge = list;
                return list;
            })
            .catch(() => []);
    }
    return pending;
}

export function CidadeAutocomplete({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [termo, setTermo] = useState("");
    const [extra, setExtra] = useState<Cidade[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) void carregarIbge().then(setExtra);
    }, [open]);

    // Lógica nativa para fechar o dropdown ao clicar fora (substituindo o Popover)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const resultados = useMemo(() => buscarCidades(termo, extra), [termo, extra]);
    const digitado = termo.trim();

    return (
        <div className="relative w-full" ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(!open)}
                className="w-full justify-between font-normal bg-slate-50 border-slate-200 rounded-xl"
            >
                <span className={cn("truncate", !value && "text-slate-500")}>
                    {value || "Buscar cidade do Brasil..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <div className="border-b border-slate-100 p-2 bg-slate-50">
                        <Input
                            autoFocus
                            value={termo}
                            onChange={(e: any) => setTermo(e.target.value)}
                            placeholder="Digite a cidade..."
                            className="h-9 bg-white"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {resultados.map((m) => {
                            const label = m.uf ? `${m.nome} - ${m.uf}` : m.nome;
                            return (
                                <button
                                    key={`${m.nome}-${m.uf}`}
                                    type="button"
                                    onClick={() => {
                                        onChange(label);
                                        setOpen(false);
                                        setTermo("");
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="flex-1 truncate text-slate-700">{label}</span>
                                    {value === label && <Check className="h-4 w-4 text-purple-600" />}
                                </button>
                            );
                        })}
                        {digitado.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(digitado);
                                    setOpen(false);
                                    setTermo("");
                                }}
                                className="mt-1 w-full rounded-lg border border-dashed border-purple-200 px-3 py-2.5 text-left text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                                Usar “{digitado}”
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}