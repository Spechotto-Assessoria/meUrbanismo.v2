import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { MedicaoItem } from '../../types';
import { apiService } from '../../services/supabase';
import { deleteStorageFile, uploadMedicaoPdf } from '../../lib/storage';
import { Campo } from './GaleriaFotoModals';

type Props = {
  obraId: string;
  registro: MedicaoItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export const MedicaoFormModal: React.FC<Props> = ({ obraId, registro, onClose, onSaved }) => {
  const [empresa, setEmpresa] = useState(registro?.fornecedor_empreiteiro || '');
  const [empreiteiro, setEmpreiteiro] = useState(registro?.resumo_atividades || '');
  const [servico, setServico] = useState(registro?.servico_executado || '');
  const [dataMedicao, setDataMedicao] = useState(
    registro?.data_medicao || registro?.periodo_fim || new Date().toISOString().slice(0, 10)
  );
  const [visivel, setVisivel] = useState(registro?.visivel_convidados ?? false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    if (!empresa.trim() || !empreiteiro.trim() || !servico.trim()) {
      setErro('Empresa, empreiteiro e serviço são obrigatórios.');
      return;
    }
    if (!registro && !pdf) {
      setErro('Anexe o PDF da medição.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      let link = registro?.link_relatorio_pdf;
      if (pdf) {
        if (registro?.link_relatorio_pdf) {
          await deleteStorageFile(registro.link_relatorio_pdf);
        }
        link = await uploadMedicaoPdf(pdf, obraId);
      }

      await apiService.saveMedicao({
        id: registro?.id,
        obra_id: obraId,
        fornecedor_empreiteiro: empresa.trim(),
        resumo_atividades: empreiteiro.trim(),
        servico_executado: servico.trim(),
        periodo_fim: dataMedicao,
        link_relatorio_pdf: link,
        visivel_convidados: visivel,
        status: 'registrada',
        numero_medicao: registro?.numero_medicao || Date.now() % 100000,
      });
      onSaved();
    } catch (e: any) {
      setErro(e?.message || 'Erro ao salvar medição.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800">
            {registro ? 'Editar medição' : 'Nova medição (PDF)'}
          </h4>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Campo label="Nome da empresa *">
            <input
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label="Nome do empreiteiro *">
            <input
              value={empreiteiro}
              onChange={(e) => setEmpreiteiro(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label="Serviço sendo medido *">
            <input
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label="Data da medição">
            <input
              type="date"
              value={dataMedicao}
              onChange={(e) => setDataMedicao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </Campo>
          <Campo label={registro ? 'Substituir PDF (opcional)' : 'PDF da medição *'}>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf(e.target.files?.[0] || null)}
              className="w-full text-xs"
            />
          </Campo>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
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
              'Salvar medição'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
