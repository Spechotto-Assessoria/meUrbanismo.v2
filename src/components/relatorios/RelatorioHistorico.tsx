import React, { useState } from 'react';
import { Download, ExternalLink, MessageCircle, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '../tabs/ui-components';
import { periodoLabel, dataPt } from '../../lib/relatorios/formatadores';
import { RELATORIO_CARDS } from '../../lib/relatorios/tipos';
import type { RelatorioObra } from '../../types';

type Props = {
  relatorios: RelatorioObra[];
  loading: boolean;
  podeExcluir: boolean;
  onExcluir: (relatorio: RelatorioObra) => Promise<void>;
  excluindo: boolean;
  obraNome: string;
};

const tipoLabel = (tipo: RelatorioObra['tipo']) =>
  RELATORIO_CARDS.find((c) => c.tipo === tipo)?.tituloPadrao || tipo;

export const RelatorioHistorico: React.FC<Props> = ({
  relatorios,
  loading,
  podeExcluir,
  onExcluir,
  excluindo,
  obraNome
}) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const whatsappLink = (rel: RelatorioObra) => {
    const texto = `Relatório "${rel.titulo}" — ${obraNome}\n${rel.arquivo_url}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando histórico...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand-400" />
        Histórico de Relatórios Gerados
      </h4>

      {relatorios.length === 0 ? (
        <div className="p-6 rounded-2xl border border-slate-800 bg-navy-950 text-center text-xs text-slate-500">
          Nenhum relatório arquivado ainda. Selecione um tipo acima para gerar o primeiro PDF.
        </div>
      ) : (
        <div className="space-y-2">
          {relatorios.map((rel) => (
            <div
              key={rel.id}
              className="p-4 rounded-2xl border border-slate-800 bg-navy-950 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{rel.titulo}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {tipoLabel(rel.tipo)} • {periodoLabel(rel.periodo_inicio, rel.periodo_fim)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {dataPt(rel.created_at)} • {rel.gerado_por_nome || '—'}
                  {rel.inclui_financeiro ? ' • Com financeiro' : ' • Sem financeiro'}
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
                <a href={whatsappLink(rel)} target="_blank" rel="noreferrer">
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
                        onClick={() => void onExcluir(rel).then(() => setConfirmId(null))}
                      >
                        Confirmar
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-900/50 text-red-400 hover:bg-red-950/30"
                      onClick={() => setConfirmId(rel.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Excluir
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
