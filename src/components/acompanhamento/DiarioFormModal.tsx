import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { DiarioObra } from '../../types';
import { CLIMA_OPCOES, EQUIPAMENTOS_PADRAO, SOLO_OPCOES } from '../../lib/acompanhamento-constants';
import { apiService } from '../../services/supabase';

type Props = {
  obraId: string;
  autorNome: string;
  ultimoDiario: DiarioObra | null;
  registro?: DiarioObra | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  data: string;
  clima_manha: string;
  clima_tarde: string;
  condicao_solo: string;
  efetivo_proprio: number;
  efetivo_terceirizado: number;
  equipamentos_ativos: string[];
  equipamentos_outros: string;
  atividades_realizadas: string;
  ocorrencias: string;
  visivel_convidados: boolean;
};

function estadoInicial(ultimo: DiarioObra | null, registro?: DiarioObra | null): FormState {
  if (registro) {
    const outros = (registro.equipamentos_ativos || []).filter(
      (e) => !EQUIPAMENTOS_PADRAO.includes(e as (typeof EQUIPAMENTOS_PADRAO)[number])
    );
    const padrao = (registro.equipamentos_ativos || []).filter((e) =>
      EQUIPAMENTOS_PADRAO.includes(e as (typeof EQUIPAMENTOS_PADRAO)[number])
    );
    return {
      data: registro.data || new Date().toISOString().slice(0, 10),
      clima_manha: registro.clima_manha || registro.clima || 'Ensolarado',
      clima_tarde: registro.clima_tarde || registro.clima_manha || 'Ensolarado',
      condicao_solo: registro.condicao_solo || 'Praticável',
      efetivo_proprio: registro.efetivo_proprio ?? 0,
      efetivo_terceirizado: registro.efetivo_terceirizado ?? 0,
      equipamentos_ativos: padrao,
      equipamentos_outros: outros.join(', '),
      atividades_realizadas: registro.atividades_realizadas || '',
      ocorrencias: registro.ocorrencias || '',
      visivel_convidados: registro.visivel_convidados ?? false,
    };
  }

  const clima = ultimo?.clima_manha || ultimo?.clima || 'Ensolarado';
  return {
    data: new Date().toISOString().slice(0, 10),
    clima_manha: clima,
    clima_tarde: clima,
    condicao_solo: ultimo?.condicao_solo || 'Praticável',
    efetivo_proprio: ultimo?.efetivo_proprio ?? 0,
    efetivo_terceirizado: ultimo?.efetivo_terceirizado ?? 0,
    equipamentos_ativos: ultimo?.equipamentos_ativos || [],
    equipamentos_outros: '',
    atividades_realizadas: '',
    ocorrencias: '',
    visivel_convidados: false,
  };
}

export const DiarioFormModal: React.FC<Props> = ({
  obraId,
  autorNome,
  ultimoDiario,
  registro,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<FormState>(() => estadoInicial(ultimoDiario, registro));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const tardeManual = useRef(false);

  useEffect(() => {
    if (!tardeManual.current) {
      setForm((p) => ({ ...p, clima_tarde: p.clima_manha }));
    }
  }, [form.clima_manha]);

  const toggleEquip = (nome: string) => {
    setForm((p) => ({
      ...p,
      equipamentos_ativos: p.equipamentos_ativos.includes(nome)
        ? p.equipamentos_ativos.filter((e) => e !== nome)
        : [...p.equipamentos_ativos, nome],
    }));
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    const outros = form.equipamentos_outros
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const equipamentos = [...form.equipamentos_ativos, ...outros];

    try {
      await apiService.saveDiario({
        id: registro?.id,
        obra_id: obraId,
        data: form.data,
        clima_manha: form.clima_manha,
        clima_tarde: form.clima_tarde,
        condicao_solo: form.condicao_solo,
        efetivo_proprio: form.efetivo_proprio,
        efetivo_terceirizado: form.efetivo_terceirizado,
        equipamentos_ativos: equipamentos,
        atividades_realizadas: form.atividades_realizadas,
        ocorrencias: form.ocorrencias,
        responsavel_nome: autorNome,
        visivel_convidados: form.visivel_convidados,
      });
      onSaved();
    } catch (e: any) {
      setErro(e?.message || 'Erro ao salvar diário.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {registro ? 'Editar relatório' : 'Novo relatório diário'}
            </h4>
            {!registro && ultimoDiario && (
              <p className="text-[10px] text-slate-500">
                Pré-preenchido com o último registro ({ultimoDiario.data})
              </p>
            )}
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Campo label="Data">
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-2">
            <Campo label="Clima manhã">
              <select
                value={form.clima_manha}
                onChange={(e) => setForm((p) => ({ ...p, clima_manha: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {CLIMA_OPCOES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Clima tarde">
              <select
                value={form.clima_tarde}
                onChange={(e) => {
                  tardeManual.current = true;
                  setForm((p) => ({ ...p, clima_tarde: e.target.value }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {CLIMA_OPCOES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Condição do solo">
            <select
              value={form.condicao_solo}
              onChange={(e) => setForm((p) => ({ ...p, condicao_solo: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {SOLO_OPCOES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid grid-cols-2 gap-2">
            <Campo label="Efetivo próprio">
              <input
                type="number"
                min={0}
                value={form.efetivo_proprio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, efetivo_proprio: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </Campo>
            <Campo label="Efetivo terceirizado">
              <input
                type="number"
                min={0}
                value={form.efetivo_terceirizado}
                onChange={(e) =>
                  setForm((p) => ({ ...p, efetivo_terceirizado: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </Campo>
          </div>

          <Campo label="Equipamentos em operação">
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50">
              {EQUIPAMENTOS_PADRAO.map((eq) => {
                const ativo = form.equipamentos_ativos.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleEquip(eq)}
                    className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                      ativo
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
            <input
              value={form.equipamentos_outros}
              onChange={(e) => setForm((p) => ({ ...p, equipamentos_outros: e.target.value }))}
              placeholder="Outros equipamentos (separados por vírgula)"
              className="mt-2 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </Campo>

          <Campo label="Atividades executadas">
            <textarea
              value={form.atividades_realizadas}
              onChange={(e) => setForm((p) => ({ ...p, atividades_realizadas: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>

          <Campo label="Ocorrências">
            <textarea
              value={form.ocorrencias}
              onChange={(e) => setForm((p) => ({ ...p, ocorrencias: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.visivel_convidados}
              onChange={(e) => setForm((p) => ({ ...p, visivel_convidados: e.target.checked }))}
            />
            Visível para convidados
          </label>

          {erro && <p className="text-xs text-rose-600">{erro}</p>}

          <button
            type="button"
            disabled={salvando}
            onClick={salvar}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-60"
          >
            {salvando ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              'Salvar relatório'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
    {children}
  </div>
);
