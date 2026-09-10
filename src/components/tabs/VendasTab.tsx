import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useObraAccess } from '../../hooks/useObraAccess';
import { useSimuladorVendas } from '../../hooks/useSimuladorVendas';
import { useVendaLote } from '../../hooks/useVendaLote';
import { AcessoRestritoVendas } from '../vendas/AcessoRestritoVendas';
import { PropostaComercialDialog } from '../vendas/PropostaComercialDialog';
import { SimuladorVendasPanel } from '../vendas/SimuladorVendasPanel';

export const VendasTab: React.FC = () => {
  const { user, activeObra } = useAuth();
  const { isCliente } = useObraAccess();
  const venda = useVendaLote();

  const valorInicial = venda.loteSelecionado?.valor_total ?? 0;
  const simulador = useSimuladorVendas(valorInicial);
  const loteTravado = Boolean(venda.loteIdUrl);

  useEffect(() => {
    if (venda.loteSelecionado?.valor_total != null) {
      simulador.setValorLote(venda.loteSelecionado.valor_total);
    }
  }, [venda.loteSelecionado?.id, venda.loteSelecionado?.valor_total]);

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Selecione uma obra para acessar o simulador de vendas.
      </div>
    );
  }

  if (isCliente) {
    return <AcessoRestritoVendas />;
  }

  const handleGerarProposta = async () => {
    if (venda.podeReservar && venda.loteDisponivel) {
      try {
        await venda.gerarPropostaEReservar();
      } catch {
        // erro exibido via estado da mutation se necessário
      }
    } else {
      venda.setPropostaAberta(true);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-fadeIn">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            Vendas 120x
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
          Simulador de Vendas &amp; Propostas
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulação de parcelamento direto com correção monetária — {activeObra.nome}
        </p>
      </div>

      {venda.erroReserva && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Não foi possível reservar o lote. Verifique suas permissões ou tente novamente.
        </div>
      )}

      <SimuladorVendasPanel
        simulador={simulador}
        loteSelecionado={venda.loteSelecionado}
        loteTravado={loteTravado}
        lotesDisponiveis={venda.lotesDisponiveis}
        onSelecionarLote={venda.selecionarLote}
        isLoadingLote={venda.isLoadingLote}
        podeReservar={venda.podeReservar}
        loteDisponivel={venda.loteDisponivel}
        onGerarProposta={handleGerarProposta}
        isReservando={venda.isReservando}
      />

      <PropostaComercialDialog
        open={venda.propostaAberta}
        onClose={() => venda.setPropostaAberta(false)}
        obra={venda.activeObra}
        usuario={user}
        lote={venda.loteSelecionado}
        valorLote={simulador.valorLote}
        percEntrada={simulador.percEntrada}
        valorEntrada={simulador.valorEntrada}
        prazo={simulador.prazo}
        parcelaMensal={simulador.parcelaMensal}
        qtdBaloes={simulador.qtdBaloes}
        valorBalao={simulador.valorBalao}
        correcao={simulador.correcao}
      />
    </div>
  );
};
