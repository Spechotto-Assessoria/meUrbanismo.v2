import type { DiarioObra, FotoObra } from '../types';

export type SubAbaAcompanhamento = 'fotos' | 'diario' | 'medicoes';

export const SERVICOS_PADRAO = [
  'Evolução Geral',
  'Terraplanagem',
  'Drenagem',
  'Pavimentação',
  'Muro',
  'Portaria',
  'Aéreo / Drone',
] as const;

export const CLIMA_OPCOES = ['Ensolarado', 'Nublado', 'Chuvoso', 'Garoa'] as const;
export const SOLO_OPCOES = ['Praticável', 'Úmido', 'Impraticável'] as const;

export const EQUIPAMENTOS_PADRAO = [
  'Escavadeira hidráulica',
  'Mini escavadeira',
  'Retroescavadeira',
  'Pá carregadeira',
  'Trator de esteira',
  'Motoniveladora',
  'Caminhão basculante',
  'Caminhão pipa',
  'Rolo compactador',
  'Pavimentadora',
  'Rolo liso',
  'Rolo de pneu',
  'Betoneira',
  'Guindaste',
] as const;

export type PastaMes = {
  chave: string;
  rotulo: string;
  dias: PastaDia[];
};

export type PastaDia = {
  chave: string;
  rotulo: string;
  fotos: FotoObra[];
};

const rotuloMes = (chave: string) => {
  const [y, m] = chave.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const rotuloDia = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

export function agruparFotosPorMesDia(fotos: FotoObra[]): PastaMes[] {
  const mapa = new Map<string, Map<string, FotoObra[]>>();
  for (const f of fotos) {
    const data = f.data_registro || f.data || new Date().toISOString().slice(0, 10);
    const mes = data.slice(0, 7);
    if (!mapa.has(mes)) mapa.set(mes, new Map());
    const dias = mapa.get(mes)!;
    if (!dias.has(data)) dias.set(data, []);
    dias.get(data)!.push(f);
  }
  return [...mapa.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, diasMap]) => ({
      chave: mes,
      rotulo: rotuloMes(mes),
      dias: [...diasMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dia, lista]) => ({
          chave: dia,
          rotulo: rotuloDia(dia),
          fotos: lista,
        })),
    }));
}

export type PastaMesDiario = {
  chave: string;
  rotulo: string;
  registros: DiarioObra[];
};

export function agruparDiariosPorMes(diarios: DiarioObra[]): PastaMesDiario[] {
  const mapa = new Map<string, DiarioObra[]>();
  for (const d of diarios) {
    const data = d.data || new Date().toISOString().slice(0, 10);
    const mes = data.slice(0, 7);
    if (!mapa.has(mes)) mapa.set(mes, []);
    mapa.get(mes)!.push(d);
  }
  return [...mapa.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, lista]) => ({
      chave: mes,
      rotulo: rotuloMes(mes),
      registros: lista.sort((a, b) => (b.data || '').localeCompare(a.data || '')),
    }));
}

export function servicosDisponiveis(fotos: FotoObra[], extras: string[]): string[] {
  const set = new Set<string>([...SERVICOS_PADRAO, ...extras]);
  fotos.forEach((f) => {
    if (f.categoria) set.add(f.categoria);
  });
  return ['TODAS', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
