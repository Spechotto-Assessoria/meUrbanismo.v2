import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Loader2
} from 'lucide-react';
import {
  agruparRelatoriosHistorico,
  estadoAberturaInicial
} from '../../lib/relatorios/historico-agrupamento';
import type { RelatorioObra } from '../../types';
import { RelatorioHistoricoCard } from './RelatorioHistoricoCard';

type Props = {
  relatorios: RelatorioObra[];
  loading: boolean;
  podeExcluir: boolean;
  onExcluir: (relatorio: RelatorioObra) => Promise<void>;
  excluindo: boolean;
  obraNome: string;
};

export const RelatorioHistorico: React.FC<Props> = ({
  relatorios,
  loading,
  podeExcluir,
  onExcluir,
  excluindo,
  obraNome
}) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [anosAbertos, setAnosAbertos] = useState<Record<string, boolean>>(
    () => estadoAberturaInicial().anos
  );
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, boolean>>(
    () => estadoAberturaInicial().meses
  );
  const [tiposAbertos, setTiposAbertos] = useState<Record<string, boolean>>({});

  const anos = useMemo(() => agruparRelatoriosHistorico(relatorios), [relatorios]);

  const toggleAno = (chave: string) =>
    setAnosAbertos((p) => ({ ...p, [chave]: !p[chave] }));

  const toggleMes = (chaveAno: string, chaveMes: string) => {
    const key = `${chaveAno}:${chaveMes}`;
    setMesesAbertos((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleTipo = (chaveAno: string, chaveMes: string, tipo: string) => {
    const key = `${chaveAno}:${chaveMes}:${tipo}`;
    setTiposAbertos((p) => ({ ...p, [key]: !p[key] }));
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
    <div id="relatorio-historico" className="space-y-3">
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
          {anos.map((ano) => {
            const anoAberto = anosAbertos[ano.chave] ?? false;
            return (
              <div
                key={ano.chave}
                className="rounded-2xl border border-slate-800 bg-navy-950 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleAno(ano.chave)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-navy-900/60 transition-colors"
                >
                  {anoAberto ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  {anoAberto ? (
                    <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-brand-400 shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-white">{ano.rotulo}</span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {ano.total} relatório{ano.total !== 1 ? 's' : ''}
                  </span>
                </button>

                {anoAberto && (
                  <div className="border-t border-slate-800 p-3 space-y-2">
                    {ano.meses.map((mes) => {
                      const mesKey = `${ano.chave}:${mes.chave}`;
                      const mesAberto = mesesAbertos[mesKey] ?? false;
                      return (
                        <div
                          key={mes.chave}
                          className="rounded-xl border border-slate-800/80 bg-navy-900/30 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMes(ano.chave, mes.chave)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-navy-900/50 transition-colors"
                          >
                            {mesAberto ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-slate-200 capitalize">
                              {mes.rotulo}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {mes.tipos.length} tipo{mes.tipos.length !== 1 ? 's' : ''} · {mes.total} PDF{mes.total !== 1 ? 's' : ''}
                            </span>
                          </button>

                          {mesAberto && (
                            <div className="border-t border-slate-800/60 p-2 space-y-2">
                              {mes.tipos.map((grupo) => {
                                const tipoKey = `${ano.chave}:${mes.chave}:${grupo.tipo}`;
                                const tipoAberto = tiposAbertos[tipoKey] ?? true;
                                return (
                                  <div
                                    key={grupo.tipo}
                                    className="rounded-lg border border-slate-800/60 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleTipo(ano.chave, mes.chave, grupo.tipo)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-navy-900/40 transition-colors"
                                    >
                                      {tipoAberto ? (
                                        <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                                      )}
                                      <span className="text-[11px] font-medium text-slate-300">
                                        {grupo.rotulo}
                                      </span>
                                      <span className="text-[10px] text-slate-600 ml-auto">
                                        {grupo.relatorios.length}
                                      </span>
                                    </button>

                                    {tipoAberto && (
                                      <div className="p-2 space-y-2">
                                        {grupo.relatorios.map((rel) => (
                                          <RelatorioHistoricoCard
                                            key={rel.id}
                                            relatorio={rel}
                                            obraNome={obraNome}
                                            podeExcluir={podeExcluir}
                                            confirmId={confirmId}
                                            excluindo={excluindo}
                                            onConfirmarExclusao={setConfirmId}
                                            onCancelarExclusao={() => setConfirmId(null)}
                                            onExcluir={onExcluir}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
