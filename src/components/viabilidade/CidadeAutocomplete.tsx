import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { buscarCidades, type Cidade } from "../../lib/cidades-br";

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

    useEffect(() => {
        if (open) void carregarIbge().then(setExtra);
    }, [open]);

    const resultados = useMemo(() => buscarCidades(termo, extra), [termo, extra]);
    const digitado = termo.trim();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal bg-slate-50 border-slate-200 rounded-xl"
                >
                    <span className={cn("truncate", !value && "text-muted-foreground")}>
                        {value || "Buscar cidade do Brasil..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="border-b p-2">
                    <Input
                        autoFocus
                        value={termo}
                        onChange={(e) => setTermo(e.target.value)}
                        placeholder="Digite a cidade..."
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
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                            >
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="flex-1 truncate">{label}</span>
                                {value === label && <Check className="h-3.5 w-3.5 text-purple-600" />}
                            </button>
                        );
                    })}
                    {digitado.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange(digitado);
                                setOpen(false);
                            }}
                            className="mt-1 w-full rounded-md border border-dashed px-3 py-2 text-left text-xs text-purple-600 hover:bg-purple-50"
                        >
                            Usar “{digitado}”
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}