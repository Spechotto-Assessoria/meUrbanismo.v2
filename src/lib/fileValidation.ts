export const LIMITES = {
  foto: { maxBytes: 10 * 1024 * 1024, maxArquivos: 20 },
  documento: { maxBytes: 50 * 1024 * 1024, maxArquivos: 30 },
} as const;

const EXECUTAVEIS = new Set([
  'exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js', 'mjs', 'sh', 'bash', 'ps1',
  'php', 'asp', 'aspx', 'jsp', 'html', 'htm', 'svg', 'apk', 'msi', 'dmg', 'jar',
]);

const MIME_FOTOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXT_DOCS = new Set(['pdf', 'dwg', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp']);

const MIME_DOCS = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
  'application/acad',
  'image/vnd.dwg',
]);

function extensaoDe(file: File): string {
  return (file.name.split('.').pop() || '').toLowerCase();
}

export type ValidacaoArquivosResult =
  | { ok: true; files: File[] }
  | { ok: false; erro: string };

/** Valida tamanho, extensão e MIME antes de upload. */
export function validarArquivos(
  files: File[],
  tipo: 'foto' | 'documento'
): ValidacaoArquivosResult {
  const limite = LIMITES[tipo];

  if (files.length === 0) {
    return { ok: false, erro: 'Selecione ao menos um arquivo.' };
  }
  if (files.length > limite.maxArquivos) {
    return { ok: false, erro: `Máximo de ${limite.maxArquivos} arquivos por envio.` };
  }

  for (const file of files) {
    const ext = extensaoDe(file);

    if (EXECUTAVEIS.has(ext)) {
      return { ok: false, erro: `Tipo bloqueado: .${ext} (${file.name})` };
    }
    if (file.size > limite.maxBytes) {
      const mb = limite.maxBytes / 1024 / 1024;
      return { ok: false, erro: `${file.name} excede ${mb} MB.` };
    }

    if (tipo === 'foto') {
      if (!MIME_FOTOS.has(file.type)) {
        return { ok: false, erro: `${file.name}: apenas JPEG, PNG, WebP ou GIF.` };
      }
      continue;
    }

    if (!EXT_DOCS.has(ext)) {
      return { ok: false, erro: `Extensão não permitida: .${ext}` };
    }
    if (ext === 'dwg') continue;
    if (file.type && !MIME_DOCS.has(file.type)) {
      return { ok: false, erro: `${file.name}: tipo de arquivo não permitido.` };
    }
  }

  return { ok: true, files };
}
