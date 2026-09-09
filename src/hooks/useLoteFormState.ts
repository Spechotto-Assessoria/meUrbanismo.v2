import { useEffect, useState } from 'react';
import type { Lote } from '../types';
import { montarLoteFormPayload, normalizeStatus, type LoteFormData, type StatusLote } from '../lib/loteMapa';

const FORM_VAZIO = {
  quadra: '',
  numero: '',
  area: '',
  valor: '',
  status: 'disponivel' as StatusLote,
  svgPath: '',
};

export function useLoteFormState(lote?: Lote | null) {
  const [quadra, setQuadra] = useState('');
  const [numero, setNumero] = useState('');
  const [area, setArea] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<StatusLote>('disponivel');
  const [svgPath, setSvgPath] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!lote) {
      setQuadra(FORM_VAZIO.quadra);
      setNumero(FORM_VAZIO.numero);
      setArea(FORM_VAZIO.area);
      setValor(FORM_VAZIO.valor);
      setStatus(FORM_VAZIO.status);
      setSvgPath(FORM_VAZIO.svgPath);
      setErro(null);
      return;
    }
    setQuadra(lote.quadra || '');
    setNumero(lote.numero || '');
    setArea(String(lote.area_m2 ?? ''));
    setValor(String(lote.valor_total ?? ''));
    setStatus(normalizeStatus(lote.status));
    setSvgPath(lote.svg_path || '');
    setErro(null);
  }, [lote]);

  const validarESerializar = (): { dados: LoteFormData; erro: string | null } => {
    const result = montarLoteFormPayload({ quadra, numero, area, valor, status, svgPath });
    setErro(result.erro);
    return result;
  };

  const reset = () => {
    setQuadra(FORM_VAZIO.quadra);
    setNumero(FORM_VAZIO.numero);
    setArea(FORM_VAZIO.area);
    setValor(FORM_VAZIO.valor);
    setStatus(FORM_VAZIO.status);
    setSvgPath(FORM_VAZIO.svgPath);
    setErro(null);
  };

  return {
    quadra,
    setQuadra,
    numero,
    setNumero,
    area,
    setArea,
    valor,
    setValor,
    status,
    setStatus,
    svgPath,
    setSvgPath,
    erro,
    setErro,
    validarESerializar,
    reset,
  };
}
