import React from 'react';
import { Printer, Send, X } from 'lucide-react';
import { formatBRL } from '../../lib/loteMapa';
import { labelLote } from '../../lib/simuladorVendas';
import type { Lote, Obra, User } from '../../types';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '../tabs/ui-components';

type Props = {
  open: boolean;
  onClose: () => void;
  obra: Obra | null;
  usuario: User | null;
  lote: Lote | null;
  valorLote: number;
  percEntrada: number;
  valorEntrada: number;
  prazo: number;
  parcelaMensal: number;
  qtdBaloes: number;
  valorBalao: number;
  correcao: string;
};

function montarTextoWhatsApp(props: Props): string {
  const loteLabel = props.lote ? labelLote(props.lote.quadra, props.lote.numero) : '—';
  const obra = props.obra?.nome || 'Empreendimento';
  const corretor = props.usuario?.nome || 'Equipe Comercial';

  return [
    `*Proposta Comercial — ${obra}*`,
    '',
    `*${loteLabel}*`,
    props.lote?.area_m2 ? `Área: ${props.lote.area_m2} m²` : '',
    '',
    `Valor do Lote: ${formatBRL(props.valorLote)}`,
    `Entrada (${props.percEntrada}%): ${formatBRL(props.valorEntrada)}`,
    `Parcela: ${props.prazo}x de ${formatBRL(props.parcelaMensal)}`,
    props.qtdBaloes > 0
      ? `Balões: ${props.qtdBaloes}x de ${formatBRL(props.valorBalao)}`
      : '',
    `Correção: ${props.correcao}`,
    '',
    `Responsável: ${corretor}`,
    '',
    '_Proposta válida por 7 dias. Sujeita à análise cadastral._',
  ]
    .filter(Boolean)
    .join('\n');
}

export const PropostaComercialDialog: React.FC<Props> = (props) => {
  const { open, onClose, obra, usuario, lote } = props;

  if (!open) return null;

  const textoWa = encodeURIComponent(montarTextoWhatsApp(props));

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 print:hidden"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div id="proposta-comercial-print" className="print:p-0">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-[#0F2942]">Proposta Comercial</DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">Financiamento direto com a loteadora</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Empreendimento</span>
              <span className="text-sm font-extrabold text-[#0F2942]">{obra?.nome || '—'}</span>
            </div>
          </div>
        </DialogHeader>

        <DialogContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border text-xs">
            <div>
              <span className="text-slate-500 block">Lote</span>
              <strong className="text-slate-900 text-sm">
                {lote ? labelLote(lote.quadra, lote.numero) : '—'}
              </strong>
              {lote?.area_m2 && (
                <span className="block text-slate-600">{lote.area_m2} m²</span>
              )}
            </div>
            <div className="sm:text-right">
              <span className="text-slate-500 block">Responsável Comercial</span>
              <strong className="text-slate-900 text-sm">{usuario?.nome || '—'}</strong>
              <span className="block text-slate-600">{usuario?.email || ''}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block">Valor do Lote</span>
              <span className="text-base font-extrabold text-slate-900">{formatBRL(props.valorLote)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block">Entrada ({props.percEntrada}%)</span>
              <span className="text-base font-extrabold text-emerald-700">{formatBRL(props.valorEntrada)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F2942] text-white text-center">
            <span className="text-[11px] text-slate-300 font-semibold block uppercase">
              Parcela Mensal ({props.prazo}x)
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">{formatBRL(props.parcelaMensal)}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Correção: {props.correcao}</span>
          </div>

          {props.qtdBaloes > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <span className="text-amber-800 font-bold">
                Balões: {props.qtdBaloes}x de {formatBRL(props.valorBalao)}
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 border-t pt-3 leading-relaxed">
            Esta proposta possui validade de 7 (sete) dias a contar desta data. A aprovação final
            está sujeita à análise cadastral e documentação de praxe pela loteadora.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1 print:hidden">
            <Button
              type="button"
              className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Imprimir / Gerar PDF
            </Button>
            <a
              href={`https://wa.me/?text=${textoWa}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1"
            >
              <Button type="button" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4" />
                Enviar por WhatsApp
              </Button>
            </a>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};
