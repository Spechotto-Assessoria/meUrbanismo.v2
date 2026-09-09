import React, { useState } from 'react';
import { Building2, MapPin, Save, X, Loader2 } from 'lucide-react';
import { UserRole, Convite } from '../../types';
import { Obra } from '../../types';
import { dataService } from '../../services/supabase';

interface ConviteVincularObraModalProps {
  convite: Convite;
  obras: Obra[];
  convitesExistentes: Convite[];
  onClose: () => void;
  onSuccess: (novo: Convite) => void;
}

export const ConviteVincularObraModal: React.FC<ConviteVincularObraModalProps> = ({
  convite,
  obras,
  convitesExistentes,
  onClose,
  onSuccess
}) => {
  const [obraId, setObraId] = useState('');
  const [role, setRole] = useState<UserRole>(convite.role || 'CLIENTE_COMPRADOR');
  const [quadraLote, setQuadraLote] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const obrasDisponiveis = obras.filter(
    o => !convitesExistentes.some(c => c.obra_id === o.id && (c.email || '').toLowerCase() === (convite.email || '').toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId) {
      setErro('Selecione um empreendimento.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const baseUrl = window.location.origin;
      const cleanEmail = (convite.email || '').trim().toLowerCase();
      const linkSeguro = `${baseUrl}/?email=${encodeURIComponent(cleanEmail)}&obra=${obraId}#/convite`;
      const novo = await dataService.saveConvite({
        obra_id: obraId,
        email: cleanEmail,
        nome: convite.nome,
        telefone: convite.telefone,
        role,
        quadraLote: role === 'CLIENTE_COMPRADOR' ? quadraLote.trim() : '',
        ativo: true,
        link_acesso: linkSeguro,
        statusCadastro: 'PENDENTE'
      } as Parameters<typeof dataService.saveConvite>[0]);
      onSuccess(novo);
      onClose();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Não foi possível vincular a obra.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-slate-900 text-base mb-1">Vincular outra obra</h3>
        <p className="text-xs text-slate-500 mb-4">Adicionar acesso de <strong>{convite.email}</strong> a outro empreendimento.</p>

        {erro && (
          <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Empreendimento *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={obraId}
                onChange={e => setObraId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                required
              >
                <option value="">Selecione...</option>
                {obrasDisponiveis.map(o => (
                  <option key={o.id} value={o.id}>{o.nome} ({o.cidade})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Perfil na obra *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="CLIENTE_COMPRADOR">Comprador / Adquirente</option>
              <option value="CORRETOR">Corretor de Imóveis</option>
              <option value="PROPRIETARIO_INVESTIDOR">Proprietário / Investidor</option>
            </select>
          </div>

          {role === 'CLIENTE_COMPRADOR' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quadra / Lote</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={quadraLote}
                  onChange={e => setQuadraLote(e.target.value)}
                  placeholder="Ex: Quadra B - Lote 14"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={salvando} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || obrasDisponiveis.length === 0} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60">
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Vincular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Badge de status do convite para exibição na lista. */
export function getConviteStatusBadge(c: Convite): { label: string; className: string } {
  if (!c.ativo) {
    return { label: 'Bloqueado', className: 'bg-rose-100 text-rose-700' };
  }
  if (c.user_id || c.statusCadastro === 'COMPLETO') {
    return { label: 'Aceito / Ativo', className: 'bg-emerald-100 text-emerald-800' };
  }
  return { label: 'Pendente', className: 'bg-amber-100 text-amber-800' };
}

/** Conta quantas obras distintas um e-mail possui nos convites. */
export function contarObrasPorEmail(convites: Convite[], email: string): number {
  const clean = email.toLowerCase();
  return new Set(convites.filter(c => (c.email || '').toLowerCase() === clean).map(c => c.obra_id)).size;
}
