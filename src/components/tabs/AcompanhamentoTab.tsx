import React from 'react';
import { HardHat } from 'lucide-react';
import { SkeletonCard } from '../common/SkeletonLoader';
import { useAuth } from '../../contexts/AuthContext';
import { useAcompanhamentoObra } from '../../hooks/useAcompanhamentoObra';
import { AcompanhamentoSubNav } from '../acompanhamento/AcompanhamentoSubNav';
import { GaleriaFotosPanel } from '../acompanhamento/GaleriaFotosPanel';
import { DiarioObraPanel } from '../acompanhamento/DiarioObraPanel';
import { MedicoesPanel } from '../acompanhamento/MedicoesPanel';

export const AcompanhamentoTab: React.FC<{
  focoInicial?: 'fotos' | 'diario' | 'medicoes';
}> = ({ focoInicial = 'fotos' }) => {
  const { canAccessObra } = useAuth();
  const ctx = useAcompanhamentoObra(focoInicial);

  if (!ctx.activeObra) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Selecione uma obra para ver o acompanhamento.
      </div>
    );
  }

  if (!canAccessObra(ctx.activeObra.id)) {
    return (
      <div className="p-8 text-center text-sm text-rose-600">
        Você não tem acesso a este empreendimento.
      </div>
    );
  }

  if (ctx.loading) {
    return (
      <div className="p-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Acompanhamento da Obra</h2>
        </div>
        <p className="text-xs text-slate-500">
          {ctx.activeObra.nome}
          {ctx.isClienteOuCorretor && ' · Galeria pública (fotos liberadas para cliente/comprador)'}
        </p>
      </header>

      {ctx.erro && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {ctx.erro}
        </div>
      )}

      <AcompanhamentoSubNav
        subAba={ctx.subAba}
        onChange={ctx.setSubAba}
        podeVerTodasSubAbas={ctx.podeVerTodasSubAbas}
      />

      {ctx.subAba === 'fotos' && (
        <GaleriaFotosPanel
          obraId={ctx.activeObra.id}
          fotos={ctx.fotos}
          autorNome={ctx.autorNome}
          podeGerenciar={ctx.podeGerenciar}
          onReload={ctx.loadData}
        />
      )}

      {ctx.subAba === 'diario' && ctx.podeVerTodasSubAbas && (
        <DiarioObraPanel
          obraId={ctx.activeObra.id}
          diarios={ctx.diarios}
          ultimoDiario={ctx.ultimoDiario}
          autorNome={ctx.autorNome}
          podeGerenciar={ctx.podeGerenciar}
          onReload={ctx.loadData}
        />
      )}

      {ctx.subAba === 'medicoes' && ctx.podeVerTodasSubAbas && (
        <MedicoesPanel
          obraId={ctx.activeObra.id}
          medicoes={ctx.medicoes}
          podeGerenciar={ctx.podeGerenciar}
          onReload={ctx.loadData}
        />
      )}
    </div>
  );
};
