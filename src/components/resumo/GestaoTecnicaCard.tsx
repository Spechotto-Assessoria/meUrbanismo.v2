import React, { useEffect, useState } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '../tabs/ui-components';
import { GestaoTecnicaEditDialog } from './GestaoTecnicaEditDialog';
import { useGestaoTecnicaObra } from '../../hooks/useGestaoTecnicaObra';
import type { Obra } from '../../types';

type Props = {
  obra: Obra;
  isAdmin: boolean;
};

function formatarEngenheiro(obra: Obra): string {
  const nome = obra.engenheiro_responsavel?.trim();
  const crea = obra.crea_responsavel?.trim();
  if (nome && crea) return `${nome} (${crea})`;
  if (nome) return nome;
  if (crea) return crea;
  return '—';
}

export const GestaoTecnicaCard: React.FC<Props> = ({ obra, isAdmin }) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { salvar, salvando, erro } = useGestaoTecnicaObra();

  useEffect(() => {
    if (!sucesso) return;
    const timer = setTimeout(() => setSucesso(null), 3000);
    return () => clearTimeout(timer);
  }, [sucesso]);

  const handleSalvar = async (dados: Parameters<typeof salvar>[0]) => {
    await salvar(dados);
    setDialogAberto(false);
    setSucesso('Dados de gestão técnica salvos com sucesso.');
  };

  const supervisao = obra.supervisao_tecnica?.trim() || '—';
  const engenheiro = formatarEngenheiro(obra);

  return (
    <>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Gestão & Responsabilidade Técnica
          </h3>
          {isAdmin && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDialogAberto(true)}
              aria-label="Editar gestão técnica"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          )}
        </div>

        {sucesso && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span>{sucesso}</span>
          </div>
        )}

        <div className="text-xs space-y-1.5">
          <p className="text-slate-600">
            <strong>Supervisão Técnica:</strong> {supervisao}
          </p>
          <p className="text-slate-600">
            <strong>Engenheiro Responsável:</strong> {engenheiro}
          </p>
          <p className="text-[11px] text-slate-500">
            Plataforma com conformidade às normas ABNT NBR 12721 e Leis Federais 6.766/79 e 13.465/17.
          </p>
        </div>
      </div>

      <GestaoTecnicaEditDialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        obra={obra}
        onSalvar={handleSalvar}
        salvando={salvando}
        erro={erro}
      />
    </>
  );
};
