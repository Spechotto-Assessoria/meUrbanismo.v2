import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/supabase';
import type { EstudoViabilidade } from '../types';
import { inferirValorVendaM2, type EstudoRow, type EstudoStatus } from '../components/viabilidade/EstudoCard';

const LOCAL_KEY = 'meurbanismo_viabilidade_estudos_list';

function isUuid(id?: string | null): boolean {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function payloadLocal(e: EstudoRow): Partial<EstudoViabilidade> & { titulo: string } {
  return {
    titulo: e.titulo,
    empresa_nome: e.empresa_nome,
    destinatario: e.destinatario,
    cnpj: e.cnpj,
    localizacao: e.localizacao,
    tipo: e.tipo,
    status: e.status,
    area_terreno: e.area_terreno,
    area_app: e.area_app,
    pct_viario: e.pct_viario,
    pct_verde: e.pct_verde,
    pct_institucional: e.pct_institucional,
    pct_vendavel: e.pct_vendavel,
    lote_medio: e.lote_medio,
    custo_m2_privativo: e.custo_m2_privativo,
    valor_venda_m2: inferirValorVendaM2(e),
    custo_total: e.custo_total,
    vgv_total: e.vgv_total,
    valor_lote: e.valor_lote,
    prazo_obra_meses: e.prazo_obra_meses,
    prazo_vendas_meses: e.prazo_vendas_meses,
    taxa_desconto_aa: e.taxa_desconto_aa
  };
}

export function useEstudosViabilidade() {
  const [estudos, setEstudos] = useState<EstudoRow[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const limparMensagens = () => {
    setMensagemErro(null);
    setMensagemSucesso(null);
  };

  const migrarLocalSeVazio = useCallback(async (listaBanco: EstudoRow[]) => {
    if (listaBanco.length > 0) return listaBanco;
    const bruto = localStorage.getItem(LOCAL_KEY);
    if (!bruto) return listaBanco;
    let locais: EstudoRow[] = [];
    try {
      locais = JSON.parse(bruto);
    } catch {
      localStorage.removeItem(LOCAL_KEY);
      return listaBanco;
    }
    if (!Array.isArray(locais) || locais.length === 0) {
      localStorage.removeItem(LOCAL_KEY);
      return listaBanco;
    }

    const migrados: EstudoRow[] = [];
    for (const item of locais) {
      if (!item?.titulo) continue;
      const salvo = await apiService.saveEstudoViabilidade(payloadLocal(item));
      migrados.push(salvo);
    }
    localStorage.removeItem(LOCAL_KEY);
    return migrados;
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await apiService.listEstudosViabilidade();
      const efetiva = await migrarLocalSeVazio(lista);
      setEstudos(efetiva);
    } catch (e: any) {
      setMensagemErro(e?.message || 'Erro ao buscar estudos.');
      setEstudos([]);
    } finally {
      setCarregando(false);
    }
  }, [migrarLocalSeVazio]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async (estudo: Partial<EstudoViabilidade> & { titulo: string }, comoNovo: boolean) => {
    limparMensagens();
    setSalvando(true);
    try {
      const id = !comoNovo && isUuid(estudo.id) ? estudo.id : undefined;
      const salvo = await apiService.saveEstudoViabilidade({ ...estudo, id });
      setEstudos(prev => {
        const sem = prev.filter(x => x.id !== salvo.id);
        return [salvo, ...sem];
      });
      setMensagemSucesso('Estudo salvo com sucesso!');
      return salvo;
    } catch (e: any) {
      setMensagemErro(e?.message || 'Ocorreu um erro ao salvar o estudo.');
      return null;
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (id: string, status: EstudoStatus) => {
    limparMensagens();
    const anterior = estudos;
    setEstudos(prev =>
      prev.map(e => (e.id === id ? { ...e, status, updated_at: new Date().toISOString() } : e))
    );
    try {
      await apiService.updateEstudoViabilidadeStatus(id, status);
    } catch (e: any) {
      setEstudos(anterior);
      setMensagemErro(e?.message || 'Não foi possível atualizar o status.');
    }
  };

  const excluir = async (id: string) => {
    if (!window.confirm('Excluir este estudo de viabilidade? Esta ação não pode ser desfeita.')) {
      return;
    }
    limparMensagens();
    const anterior = estudos;
    setEstudos(prev => prev.filter(e => e.id !== id));
    try {
      await apiService.deleteEstudoViabilidade(id);
      setMensagemSucesso('Estudo excluído.');
    } catch (e: any) {
      setEstudos(anterior);
      setMensagemErro(e?.message || 'Não foi possível excluir o estudo.');
    }
  };

  return {
    estudos,
    carregando,
    salvando,
    mensagemSucesso,
    mensagemErro,
    setMensagemSucesso,
    setMensagemErro,
    limparMensagens,
    carregar,
    salvar,
    mudarStatus,
    excluir
  };
}
