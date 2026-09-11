import { apiService } from '../../../services/supabase';
import type { Obra } from '../../../types';
import { calcViabilidade, custoObraDoOrcamento, vgvDosLotes, type ViabilidadeResult } from '../../viabilidade';
import { PREMISSAS_DEFAULT, type PremissasObra } from '../../../hooks/useViabilidadeObra';

function parsePremissas(raw: unknown): Partial<PremissasObra> {
  if (!raw || typeof raw !== 'object') return {};
  const p = raw as Record<string, unknown>;
  const out: Partial<PremissasObra> = {};
  (Object.keys(PREMISSAS_DEFAULT) as (keyof PremissasObra)[]).forEach((k) => {
    if (p[k] != null && Number.isFinite(Number(p[k]))) out[k] = Number(p[k]);
  });
  return out;
}

export async function fetchViabilidadeDados(obraId: string, obra: Obra): Promise<ViabilidadeResult | null> {
  try {
    const [orcs, row, lotes] = await Promise.all([
      apiService.getOrcamentos(obraId),
      apiService.getViabilidade(obraId),
      apiService.getLotes(obraId)
    ]);

    const orc = custoObraDoOrcamento(orcs);
    const calc = vgvDosLotes(
      (lotes || []).map((l) => ({
        descricao: `${l.quadra ?? ''}-${l.numero ?? ''}`,
        quantidade: 1,
        area_m2: Number(l.area_m2) || 0,
        valor_m2: Number(l.valor_m2) || 0
      }))
    );

    const areaGleba = obra.area_total_m2 || obra.areaM2 || 0;
    const areaVendavelSalva = Number(obra.area_vendavel_m2) || 0;
    const areaVendavel = areaVendavelSalva > 0 ? areaVendavelSalva : areaGleba > 0 ? areaGleba * 0.55 : 0;

    const saved = parsePremissas(row?.premissas);
    const premissas: PremissasObra = { ...PREMISSAS_DEFAULT, ...saved };
    if (saved.custos_indiretos_pct == null && orc.sugeridoPct > 0) {
      premissas.custos_indiretos_pct = Number(orc.sugeridoPct.toFixed(2));
    }
    if (saved.custo_terreno == null && row?.custo_terreno) {
      premissas.custo_terreno = Number(row.custo_terreno) || 0;
    }

    const vgvLotes = calc.vgv;
    const vgv = vgvLotes > 0 ? vgvLotes : areaVendavel * premissas.preco_m2;

    return calcViabilidade({
      ...premissas,
      vgv,
      custo_obra: orc.custoObra
    });
  } catch {
    return null;
  }
}
