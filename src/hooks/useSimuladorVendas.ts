import { useMemo, useState } from 'react';
import {
  calcularSimulacao,
  ENTRADA_PADRAO_PCT,
  type IndiceCorrecao,
  OPCOES_CORRECAO,
  PRAZO_PADRAO,
  PRAZO_MAXIMO,
} from '../lib/simuladorVendas';

export function useSimuladorVendas(valorLoteInicial = 0) {
  const [percEntrada, setPercEntrada] = useState(ENTRADA_PADRAO_PCT);
  const [prazo, setPrazo] = useState(PRAZO_PADRAO);
  const [qtdBaloes, setQtdBaloes] = useState(0);
  const [valorBalao, setValorBalao] = useState(0);
  const [correcao, setCorrecao] = useState<IndiceCorrecao>(OPCOES_CORRECAO[0]);
  const [valorLote, setValorLote] = useState(valorLoteInicial);

  const resultado = useMemo(
    () =>
      calcularSimulacao({
        valorLote,
        percEntrada,
        prazo: Math.min(PRAZO_MAXIMO, Math.max(1, prazo)),
        qtdBaloes,
        valorBalao,
      }),
    [valorLote, percEntrada, prazo, qtdBaloes, valorBalao]
  );

  const ajustarPrazo = (novoPrazo: number) => {
    setPrazo(Math.min(PRAZO_MAXIMO, Math.max(1, novoPrazo)));
  };

  return {
    percEntrada,
    setPercEntrada,
    prazo,
    setPrazo: ajustarPrazo,
    qtdBaloes,
    setQtdBaloes,
    valorBalao,
    setValorBalao,
    correcao,
    setCorrecao,
    valorLote,
    setValorLote,
    ...resultado,
  };
}
