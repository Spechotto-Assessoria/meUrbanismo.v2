import type { DocumentoObra } from '../types';

export const PASTAS_PADRAO = [
  'Projetos de Urbanismo',
  'Arquitetura',
  'Rede de Água',
  'Rede de Esgoto',
  'Rede de Drenagem',
  'Rede Elétrica / Iluminação',
  'Projetos Complementares Edificações',
  'Paisagismo',
] as const;

export type PastaDocumentos = {
  chave: string;
  rotulo: string;
  arquivos: DocumentoObra[];
};

export function slugPasta(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function pastasDisponiveis(docs: DocumentoObra[], extras: string[]): string[] {
  const set = new Set<string>([...PASTAS_PADRAO, ...extras]);
  docs.forEach((d) => {
    if (d.categoria) set.add(d.categoria);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function agruparDocumentosPorPasta(
  docs: DocumentoObra[],
  incluirArquivados = false
): PastaDocumentos[] {
  const filtrados = incluirArquivados ? docs : docs.filter((d) => !d.arquivado);
  const mapa = new Map<string, DocumentoObra[]>();
  for (const d of filtrados) {
    const pasta = d.categoria || 'Sem pasta';
    if (!mapa.has(pasta)) mapa.set(pasta, []);
    mapa.get(pasta)!.push(d);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([rotulo, arquivos]) => ({
      chave: slugPasta(rotulo),
      rotulo,
      arquivos: arquivos.sort(
        (a, b) => (b.data_emissao || '').localeCompare(a.data_emissao || '')
      ),
    }));
}

export function formatarTamanho(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function extensaoDeArquivo(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ext.length <= 6) return ext;
  const mime = file.type.split('/').pop();
  return mime || 'bin';
}

export function tituloDeArquivo(file: File): string {
  return file.name.replace(/\.[^.]+$/, '') || file.name;
}

export function linkWhatsAppDocumento(titulo: string, url: string): string {
  const msg = `Documento da obra: ${titulo}\n${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
}

export function linkEmailDocumento(titulo: string, url: string, obraNome?: string): string {
  const assunto = encodeURIComponent(`Documento — ${obraNome || 'Obra'}: ${titulo}`);
  const corpo = encodeURIComponent(
    `Segue o link do documento "${titulo}":\n\n${url}\n\nEnviado via meUrbanismo.`
  );
  return `mailto:?subject=${assunto}&body=${corpo}`;
}
