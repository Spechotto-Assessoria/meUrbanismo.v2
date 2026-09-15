import type { RelatorioObra, RelatorioTipo } from '../../types';
import { RELATORIO_CARDS } from './tipos';

export type PastaTipoRelatorio = {
  tipo: RelatorioTipo;
  rotulo: string;
  relatorios: RelatorioObra[];
};

export type PastaMesRelatorio = {
  chave: string;
  rotulo: string;
  tipos: PastaTipoRelatorio[];
  total: number;
};

export type PastaAnoRelatorio = {
  chave: string;
  rotulo: string;
  meses: PastaMesRelatorio[];
  total: number;
};

function rotuloMes(chave: string): string {
  const [y, m] = chave.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function rotuloTipo(tipo: RelatorioTipo): string {
  return RELATORIO_CARDS.find((c) => c.tipo === tipo)?.tituloPadrao || tipo;
}

function chaveMesDeCreatedAt(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '0000-00';
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

function chaveAnoDeCreatedAt(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '0000';
  return String(d.getFullYear());
}

export function agruparRelatoriosHistorico(relatorios: RelatorioObra[]): PastaAnoRelatorio[] {
  const mapaAno = new Map<string, Map<string, Map<RelatorioTipo, RelatorioObra[]>>>();

  for (const rel of relatorios) {
    const ano = chaveAnoDeCreatedAt(rel.created_at);
    const mes = chaveMesDeCreatedAt(rel.created_at);

    if (!mapaAno.has(ano)) mapaAno.set(ano, new Map());
    const mapaMes = mapaAno.get(ano)!;

    if (!mapaMes.has(mes)) mapaMes.set(mes, new Map());
    const mapaTipo = mapaMes.get(mes)!;

    if (!mapaTipo.has(rel.tipo)) mapaTipo.set(rel.tipo, []);
    mapaTipo.get(rel.tipo)!.push(rel);
  }

  return [...mapaAno.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ano, mapaMes]) => {
      const meses: PastaMesRelatorio[] = [...mapaMes.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([mes, mapaTipo]) => {
          const tipos: PastaTipoRelatorio[] = [...mapaTipo.entries()]
            .sort((a, b) => rotuloTipo(a[0]).localeCompare(rotuloTipo(b[0]), 'pt-BR'))
            .map(([tipo, lista]) => ({
              tipo,
              rotulo: rotuloTipo(tipo),
              relatorios: lista.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            }));

          const total = tipos.reduce((acc, t) => acc + t.relatorios.length, 0);
          return { chave: mes, rotulo: rotuloMes(mes), tipos, total };
        });

      const total = meses.reduce((acc, m) => acc + m.total, 0);
      return { chave: ano, rotulo: ano, meses, total };
    });
}

/** Estado inicial de abertura: ano e mês correntes abertos. */
export function estadoAberturaInicial(): {
  anos: Record<string, boolean>;
  meses: Record<string, boolean>;
  tipos: Record<string, boolean>;
} {
  const hoje = new Date();
  const anoAtual = String(hoje.getFullYear());
  const mesAtual = `${anoAtual}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  return {
    anos: { [anoAtual]: true },
    meses: { [`${anoAtual}:${mesAtual}`]: true },
    tipos: {}
  };
}
