import React from 'react';
import { Building, PlusCircle, Save, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CidadeAutocomplete } from '../viabilidade/CidadeAutocomplete';
import { useNovaObraForm, type FeedbackObra } from '../../hooks/useNovaObraForm';
import { TIPOS_EMPREENDIMENTO, isTipoOutros } from '../../lib/obra-form';
import type { Obra } from '../../types';

interface NovaObraTabProps {
  onBack?: () => void;
  onGoToNovaEmpresa?: () => void;
  preSelectedEmpresaId?: string;
  obraToEdit?: Obra | null;
}

function FeedbackBanner({ feedback }: { feedback: FeedbackObra }) {
  const isError = feedback.type === 'error';
  const isSuccess = feedback.type === 'success';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      {isError ? (
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{feedback.message}</span>
    </div>
  );
}

function CampoMascara({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden ${
            prefix ? 'pl-9 pr-3' : suffix ? 'pl-3 pr-10' : 'px-3'
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export const NovaObraTab: React.FC<NovaObraTabProps> = ({
  onBack,
  onGoToNovaEmpresa,
  preSelectedEmpresaId,
  obraToEdit,
}) => {
  const form = useNovaObraForm({ obraToEdit, preSelectedEmpresaId, onBack });
  const outros = isTipoOutros(form.tipo);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-border/70 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-6 h-6 text-slate-700" /> {form.isEditing ? 'Editar Obra' : 'Nova Obra'}
            </h1>
            <p className="text-xs text-slate-500">Informações principais da obra e vínculo com a empresa.</p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit} className="bg-white p-6 rounded-2xl border border-border/70 shadow-sm space-y-4">
        {form.feedback && <FeedbackBanner feedback={form.feedback} />}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Obra *</label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => form.setNome(e.target.value)}
            placeholder="Ex: Condomínio Reserva dos Ipês"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Empresa / Incorporadora *</label>
            {onGoToNovaEmpresa && (
              <button
                type="button"
                onClick={onGoToNovaEmpresa}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Criar Nova Empresa
              </button>
            )}
          </div>
          <select
            value={form.empresaId}
            onChange={(e) => {
              const val = form.handleEmpresaSelectChange(e);
              if (val === 'NOVA_EMPRESA') onGoToNovaEmpresa?.();
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden bg-white font-medium text-slate-800"
            required
          >
            {form.empresas.length === 0 && <option value="">Nenhuma empresa cadastrada</option>}
            {form.empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
            <option value="NOVA_EMPRESA" className="font-bold text-blue-700">
              Cadastrar nova empresa...
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Empreendimento</label>
            <select
              value={form.tipo}
              onChange={(e) => form.setTipo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              {TIPOS_EMPREENDIMENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => form.setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="Planejamento">Planejamento</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluída">Concluída</option>
              <option value="Arquivada">Arquivada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
          <textarea
            rows={2}
            value={form.descricao}
            onChange={(e) => form.setDescricao(e.target.value)}
            placeholder="Breve resumo sobre o empreendimento"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => form.setEndereco(e.target.value)}
              placeholder="Rua, Av, Rodovia..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF *</label>
            <CidadeAutocomplete value={form.cidadeLabel} onChange={form.handleCidadeChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!outros && (
            <CampoMascara
              label="Área Total da Gleba"
              value={form.areaM2}
              onChange={form.handleGlebaChange}
              suffix="m²"
              placeholder="0,00"
            />
          )}
          <CampoMascara
            label="Valor Global / VGV"
            value={form.valorGlobal}
            onChange={form.handleVgvChange}
            prefix="R$"
            placeholder="0,00"
          />
          <CampoMascara
            label={outros ? 'Quantidade de Unidades' : 'Quantidade de Lotes'}
            value={form.qtdLotes}
            onChange={form.handleQtdChange}
            placeholder="0"
          />
          <CampoMascara
            label={outros ? 'Área Média da Unidade' : 'Área Média do Lote'}
            value={form.metragemPadraoLote}
            onChange={form.handleMetragemChange}
            suffix="m²"
            placeholder="0,00"
          />
          <CampoMascara
            label={outros ? 'Área Privativa / Vendável' : 'Área Vendável'}
            value={form.areaVendavel}
            onChange={form.handleAreaVendavelChange}
            suffix="m²"
            placeholder="0,00"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => form.setDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Entrega Prevista</label>
            <input
              type="date"
              value={form.dataEntrega}
              onChange={(e) => form.setDataEntrega(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Imagem / Logo Específica da Obra</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 min-h-[96px] flex flex-col items-center justify-center gap-2">
            {form.capaPreviewUrl ? (
              <img
                src={form.capaPreviewUrl}
                alt="Pré-visualização da capa"
                onError={form.handleCapaError}
                className="w-20 h-20 object-cover mx-auto rounded-xl bg-white border border-slate-200"
              />
            ) : null}
            <input
              ref={form.fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={form.handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={form.handleEscolherImagem}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50"
            >
              {form.capaFile ? 'Trocar imagem' : 'Escolher imagem'}
            </button>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={form.salvando}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={form.salvando}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {form.salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {form.salvando ? 'Salvando...' : form.isEditing ? 'Salvar Alterações' : 'Cadastrar Obra'}
          </button>
        </div>
      </form>
    </div>
  );
};
