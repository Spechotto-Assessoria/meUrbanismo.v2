import React from 'react';
import { Download, ExternalLink, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '../tabs/ui-components';
import { periodoLabel, dataHoraPt } from '../../lib/relatorios/formatadores';
import { RELATORIO_CARDS } from '../../lib/relatorios/tipos';
import type { RelatorioObra } from '../../types';

type Props = {
  relatorio: RelatorioObra;
  obraNome: string;
  podeExcluir: boolean;
  confirmId: string | null;
  excluindo: boolean;
  onConfirmarExclusao: (id: string) => void;
  onCancelarExclusao: () => void;
  onExcluir: (relatorio: RelatorioObra) => Promise<void>;
};

const tipoLabel = (tipo: RelatorioObra['tipo']) =>
  RELATORIO_CARDS.find((c) => c.tipo === tipo)?.tituloPadrao || tipo;

export const RelatorioHistoricoCard: React.FC<Props> = ({
  relatorio: rel,
  obraNome,
  podeExcluir,
  confirmId,
  excluindo,
  onConfirmarExclusao,
  onCancelarExclusao,
  onExcluir
}) => {
  const whatsappLink = () => {
    const texto = `Relatório "${rel.titulo}" — ${obraNome}\n${rel.arquivo_url}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div
      className="p-4 rounded-xl border border-slate-800/80 bg-navy-900/50 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{rel.titulo}</p>
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-navy-950 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {tipoLabel(rel.tipo)}
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          {periodoLabel(rel.periodo_inicio, rel.periodo_fim)}
        </p>

        <p className="text-[10px] text-slate-500">
          Gerado em {dataHoraPt(rel.created_at)} por {rel.gerado_por_nome || '—'}
        </p>

        <p className="text-[10px] text-slate-600">
          {rel.inclui_financeiro ? 'Com financeiro' : 'Sem financeiro'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-700 bg-navy-900 text-slate-200 hover:bg-navy-800"
          onClick={() => window.open(rel.arquivo_url, '_blank')}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1" />
          Abrir
        </Button>
        <a href={rel.arquivo_url} download={`${rel.titulo}.pdf`} target="_blank" rel="noreferrer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 bg-navy-900 text-slate-200 hover:bg-navy-800"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Baixar
          </Button>
        </a>
        <a href={whatsappLink()} target="_blank" rel="noreferrer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            WhatsApp
          </Button>
        </a>

        {podeExcluir && (
          confirmId === rel.id ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                disabled={excluindo}
                onClick={() => void onExcluir(rel).then(() => onCancelarExclusao())}
              >
                Confirmar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelarExclusao}>
                Não
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-900/50 text-red-400 hover:bg-red-950/30"
              onClick={() => onConfirmarExclusao(rel.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Excluir
            </Button>
          )
        )}
      </div>
    </div>
  );
};
