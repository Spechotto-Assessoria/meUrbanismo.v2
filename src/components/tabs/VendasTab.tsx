import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ComingSoonCard } from '../common/ComingSoonCard';
import { 
  ShoppingBag, 
  Calculator, 
  FileText, 
  Printer, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  Send,
  X
} from 'lucide-react';

export const VendasTab: React.FC = () => {
  const { activeObra, user } = useAuth();

  // Estados do Simulador de Loteamento em até 120x
  const [valorLote, setValorLote] = useState<number>(140800);
  const [percEntrada, setPercEntrada] = useState<number>(10);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(120);
  const [tipoReajuste, setTipoReajuste] = useState<string>('IPCA + 0.5% a.m.');
  const [baloesQtd, setBaloesQtd] = useState<number>(0);
  const [valorBalao, setValorBalao] = useState<number>(0);
  const [clienteNome, setClienteNome] = useState<string>('Luciana Ferreira');
  const [clienteTelefone, setClienteTelefone] = useState<string>('(17) 98877-6655');
  const [clienteEmail, setClienteEmail] = useState<string>('luciana.compradora@gmail.com');
  const [showPropostaModal, setShowPropostaModal] = useState<boolean>(false);

  // Cálculos Financeiros
  const valorEntrada = (valorLote * percEntrada) / 100;
  const totalBaloes = baloesQtd * valorBalao;
  const saldoFinanciar = Math.max(0, valorLote - valorEntrada - totalBaloes);
  
  // Cálculo aproximado com juros de tabela (Price ou SAC simplificada)
  const taxaMensal = tipoReajuste.includes('Taxa Fixa') ? 0.01 : 0.005;
  const fatorPrice = taxaMensal > 0 && numeroParcelas > 0
    ? (taxaMensal * Math.pow(1 + taxaMensal, numeroParcelas)) / (Math.pow(1 + taxaMensal, numeroParcelas) - 1)
    : 1 / numeroParcelas;
  
  const parcelaMensal = saldoFinanciar > 0 && numeroParcelas > 0 
    ? Math.round(saldoFinanciar * fatorPrice) 
    : 0;

  const totalFinanciamento = valorEntrada + (parcelaMensal * numeroParcelas) + totalBaloes;

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      
      {/* CARD TRANSLÚCIDO COM FITA 'EM BREVE' + SIMULADOR TOTALMENTE FUNCIONAL */}
      <ComingSoonCard
        title="Simulador de Vendas & Financiamento Próprio"
        subtitle="Simulações em até 120x com reajustes, balões anuais e emissão instantânea de proposta comercial"
        description="O Módulo de Vendas do meUrbanismo automatiza o funil comercial, gerando simulações personalizadas de parcelamento direto com a loteadora em até 120 meses com correção monetária."
        icon={<ShoppingBag className="w-8 h-8" />}
        badgeText="Em Breve"
        featuresList={[
          'Simulador direto em até 120x',
          'Cálculo automático de entrada, balões intermediários e juros',
          'Emissão de proposta comercial em PDF para WhatsApp',
          'Assinatura digital e integração com CRM'
        ]}
        isUnlockedForAdmin={true} // Desbloqueado para uso e demonstração do simulador
      >
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand-400" />
                Simulador Financeiro de Loteamento
              </h3>
              <p className="text-xs text-slate-400">
                Financiamento direto com a construtora em até 120 parcelas mensais
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold">
              Tabela Direta 2025
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* COLUNA ESQUERDA: PARÂMETROS DA SIMULAÇÃO */}
            <div className="lg:col-span-7 p-5 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-4 text-xs shadow-glass">
              
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Valor do Lote / Imóvel (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={valorLote}
                    onChange={e => setValorLote(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Entrada ({percEntrada}% = R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </label>
                  <select
                    value={percEntrada}
                    onChange={e => setPercEntrada(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white focus:outline-none focus:border-brand-400"
                  >
                    <option value={10}>10% de Entrada</option>
                    <option value={15}>15% de Entrada</option>
                    <option value={20}>20% de Entrada</option>
                    <option value={30}>30% de Entrada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Plano de Parcelamento
                  </label>
                  <select
                    value={numeroParcelas}
                    onChange={e => setNumeroParcelas(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white focus:outline-none focus:border-brand-400"
                  >
                    <option value={12}>12x (1 ano - Sem juros)</option>
                    <option value={24}>24x (2 anos)</option>
                    <option value={36}>36x (3 anos)</option>
                    <option value={60}>60x (5 anos)</option>
                    <option value={84}>84x (7 anos)</option>
                    <option value={100}>100x (Padrão)</option>
                    <option value={120}>120x (10 anos - Especial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Índice de Correção Monetária
                </label>
                <select
                  value={tipoReajuste}
                  onChange={e => setTipoReajuste(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white focus:outline-none focus:border-brand-400"
                >
                  <option value="IPCA + 0.5% a.m.">IPCA + 0.50% ao mês</option>
                  <option value="IGPM + 0.5% a.m.">IGPM + 0.50% ao mês</option>
                  <option value="Taxa Fixa 1.0% a.m.">Taxa Fixa de 1.00% ao mês</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Balões Anuais Intermediários
                  </label>
                  <select
                    value={baloesQtd}
                    onChange={e => setBaloesQtd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value={0}>Sem balões anuais</option>
                    <option value={2}>2 parcelas anuais</option>
                    <option value={4}>4 parcelas anuais</option>
                    <option value={8}>8 parcelas anuais</option>
                    <option value={10}>10 parcelas anuais</option>
                  </select>
                </div>

                {baloesQtd > 0 && (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Valor de Cada Balão (R$)
                    </label>
                    <input
                      type="number"
                      value={valorBalao}
                      onChange={e => setValorBalao(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h5 className="font-bold text-white">Dados do Proponente / Cliente</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={clienteTelefone}
                    onChange={e => setClienteTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={clienteEmail}
                    onChange={e => setClienteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: RESUMO DO FLUXO E GERADOR DE PROPOSTA */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-gradient-to-b from-navy-900 via-navy-850 to-navy-950 border border-brand-500/30 space-y-4 shadow-glass flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Resumo do Parcelamento
                  </span>
                  <span className="text-[10px] font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md">
                    {numeroParcelas}x Parcelas
                  </span>
                </div>

                {/* DESTAQUE DA PARCELA MENSAL */}
                <div className="my-4 p-4 rounded-2xl bg-navy-950 border border-brand-500/20 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Valor da Parcela Inicial ({numeroParcelas}x)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-brand-300 mt-1">
                    R$ {parcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Correção: {tipoReajuste}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Entrada Facilitada ({percEntrada}%):</span>
                    <span className="font-bold text-white">
                      R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {baloesQtd > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Balões ({baloesQtd}x anuais):</span>
                      <span className="font-bold text-amber-300">
                        {baloesQtd}x de R$ {valorBalao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300">
                    <span>Saldo Total Financiado:</span>
                    <span className="font-bold text-cyan-300">
                      R$ {saldoFinanciar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-emerald-400">
                    <span>Total Projetado da Proposta:</span>
                    <span>R$ {totalFinanciamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={() => setShowPropostaModal(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <FileText className="w-4 h-4" />
                  Visualizar Proposta Comercial Formatada
                </button>

                <a
                  href={`https://wa.me/55${clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${clienteNome}! Segue sua simulação de loteamento no ${activeObra?.nome}:\n- Valor do Lote: R$ ${valorLote.toLocaleString('pt-BR')}\n- Entrada: R$ ${valorEntrada.toLocaleString('pt-BR')}\n- Plano: ${numeroParcelas}x de R$ ${parcelaMensal.toLocaleString('pt-BR')}\n- Reajuste: ${tipoReajuste}\n\nSpechotto Assessoria & Construção`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Enviar Simulação via WhatsApp
                </a>
              </div>

            </div>

          </div>

          {/* MODAL PROPOSTA COMERCIAL FORMATADA (PRONTA PARA IMPRESSÃO / PDF) */}
          {showPropostaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
                
                <button
                  onClick={() => setShowPropostaModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* CABEÇALHO DA PROPOSTA COMERCIAL */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <img src="/logo-meurbanismo.png" alt="meUrbanismo" className="h-10 object-contain" />
                    <div>
                      <h2 className="text-xl font-extrabold text-[#0F2942]">meUrbanismo</h2>
                      <p className="text-xs text-slate-500 font-semibold">Proposta Comercial de Loteamento</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">Empreendimento</span>
                    <span className="text-sm font-extrabold text-[#0F2942]">{activeObra?.nome}</span>
                  </div>
                </div>

                {/* DADOS DO CLIENTE E DO CORRETOR */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border text-xs">
                  <div>
                    <span className="text-slate-500 block">Proponente Comprador:</span>
                    <strong className="text-slate-900 text-sm">{clienteNome}</strong>
                    <span className="block text-slate-600">{clienteTelefone} • {clienteEmail}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Responsável Comercial:</span>
                    <strong className="text-slate-900 text-sm">{user.nome}</strong>
                    <span className="block text-slate-600">{user.email}</span>
                  </div>
                </div>

                {/* TABELA DE CONDIÇÕES DE PAGAMENTO */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#0F2942] border-b pb-1">Condições da Negociação</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <span className="text-slate-500 block">Valor do Lote</span>
                      <span className="text-base font-extrabold text-slate-900">
                        R$ {valorLote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <span className="text-slate-500 block">Sinal / Entrada ({percEntrada}%)</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <span className="text-slate-500 block">Parcelamento Direto</span>
                      <span className="text-base font-extrabold text-[#0284c7]">
                        {numeroParcelas}x de R$ {parcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <span className="text-slate-500 block">Correção Monetária</span>
                      <span className="text-sm font-bold text-slate-800">
                        {tipoReajuste}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 border-t pt-3 leading-relaxed">
                  * Esta proposta possui validade de 7 (sete) dias a contar desta data. A aprovação final está sujeita à análise cadastral e documentação de praxe pela loteadora Spechotto Assessoria & Construção.
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / Salvar em PDF
                  </button>
                  <button
                    onClick={() => setShowPropostaModal(false)}
                    className="px-6 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </ComingSoonCard>

    </div>
  );
};
