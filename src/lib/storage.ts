import { supabase } from './supabaseClient';

/**
 * Helpers de upload/exclusão para o Supabase Storage.
 *
 * Bucket "logos_empresas" (público, ver src/services/schema.sql):
 *  - Leitura liberada para qualquer um (necessário para exibir o logo nas
 *    telas das obras, inclusive para convidados sem sessão).
 *  - Escrita (insert/update/delete) restrita ao administrador master via RLS
 *    em storage.objects (policy "logos_empresas_admin_write").
 */
const LOGOS_EMPRESAS_BUCKET = 'logos_empresas';
const FOTOS_OBRA_BUCKET = 'fotos_obra';

function logStorageError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[storage] ❌ Falha em "${context}": ${message}`);
}

/** Extrai a extensão do arquivo (sem o ponto), com fallback seguro para "png". */
function getFileExtension(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return 'png';
}

/**
 * Extrai o caminho interno do objeto (relativo ao bucket) a partir de uma URL
 * pública do Supabase Storage, para permitir excluir o arquivo antigo.
 * Formato esperado: ".../storage/v1/object/public/logos_empresas/<path>"
 */
function extractStoragePath(logoUrl: string, bucket: string = LOGOS_EMPRESAS_BUCKET): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = logoUrl.indexOf(marker);
  if (idx === -1) return null;
  return logoUrl.slice(idx + marker.length);
}

/**
 * Envia o logo de uma empresa para o Storage e devolve a URL pública.
 * O arquivo é salvo em "<empresaId>/logo.<ext>" com upsert, então reenviar um
 * novo logo para a mesma empresa sobrescreve o anterior automaticamente.
 */
export async function uploadEmpresaLogo(file: File, empresaId: string): Promise<string> {
  const ext = getFileExtension(file);
  const path = `${empresaId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from(LOGOS_EMPRESAS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) {
    logStorageError('uploadEmpresaLogo', error);
    throw new Error('Não foi possível enviar a imagem do logo. Tente novamente.');
  }

  const { data } = supabase.storage.from(LOGOS_EMPRESAS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Remove um logo de empresa já enviado anteriormente, a partir da sua URL pública. */
export async function deleteEmpresaLogo(logoUrl: string): Promise<void> {
  const path = extractStoragePath(logoUrl, LOGOS_EMPRESAS_BUCKET);
  if (!path) return;

  const { error } = await supabase.storage.from(LOGOS_EMPRESAS_BUCKET).remove([path]);
  if (error) {
    // Falha ao limpar o arquivo antigo não deve travar o fluxo do usuário —
    // registramos apenas no console para eventual limpeza manual no painel.
    logStorageError('deleteEmpresaLogo', error);
  }
}

/**
 * Envia a imagem de capa de uma obra para o Storage e devolve a URL pública.
 * Caminho: "<obraId>/capa.<ext>" no bucket público "fotos_obra".
 */
export async function uploadObraCapa(file: File, obraId: string): Promise<string> {
  const ext = getFileExtension(file);
  const path = `${obraId}/capa.${ext}`;

  const { error } = await supabase.storage
    .from(FOTOS_OBRA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) {
    logStorageError('uploadObraCapa', error);
    throw new Error('Não foi possível enviar a imagem de capa da obra. Tente novamente.');
  }

  const { data } = supabase.storage.from(FOTOS_OBRA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Remove uma capa de obra já enviada, a partir da URL pública. */
export async function deleteObraCapa(fotoUrl: string): Promise<void> {
  const path = extractStoragePath(fotoUrl, FOTOS_OBRA_BUCKET);
  if (!path) return;

  const { error } = await supabase.storage.from(FOTOS_OBRA_BUCKET).remove([path]);
  if (error) {
    logStorageError('deleteObraCapa', error);
  }
}
