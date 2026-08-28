import React, { useState } from 'react';
import { MapPin, ChevronsUpDown } from 'lucide-react';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const CIDADES_SUGERIDAS = [
    'Cuiabá - MT', 'Várzea Grande - MT', 'Rondonópolis - MT', 'Sinop - MT',
    'Campo Grande - MS', 'Goiânia - GO', 'Brasília - DF', 'São Paulo - SP'
];

export const CidadeAutocomplete: React.FC<Props> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [busca, setBusca] = useState('');

    const filtradas = CIDADES_SUGERIDAS.filter(c =>
        c.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="relative">
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
                <span className={value ? 'text-slate-900' : 'text-slate-400'}>
                    {value || 'Buscar cidade...'}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                    <input
                        type="text"
                        autoFocus
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Digite o nome da cidade..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-purple-500 mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {filtradas.map((cidade) => (
                            <button
                                key={cidade}
                                type="button"
                                onClick={() => {
                                    onChange(cidade);
                                    setOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{cidade}</span>
                            </button>
                        ))}

                        {busca.trim().length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(busca.trim());
                                    setOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-purple-600 border border-dashed border-purple-300 rounded-lg hover:bg-purple-50"
                            >
                                Usar "{busca.trim()}"
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};