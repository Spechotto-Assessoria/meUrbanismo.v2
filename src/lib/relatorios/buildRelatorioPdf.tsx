import { pdf } from '@react-pdf/renderer';
import type { GerarRelatorioParams } from './tipos';
import { fetchDadosRelatorio, preloadImagensRelatorio } from './fetchDadosRelatorio';
import { RelatorioDocument } from './pdf/RelatorioDocument';

export async function buildRelatorioPdf(params: GerarRelatorioParams): Promise<Blob> {
  const dados = await fetchDadosRelatorio(params);
  const fotosUrls = dados.fotos.map((f) => f.url).filter(Boolean);
  const { logoMeUrbanismo, logoEmpresa, fotos } = await preloadImagensRelatorio(params.logoEmpresaUrl, fotosUrls);

  const doc = (
    <RelatorioDocument
      {...dados}
      logoMeUrbanismoDataUri={logoMeUrbanismo}
      logoEmpresaDataUri={logoEmpresa}
      fotosDataUri={fotos}
    />
  );

  return pdf(doc).toBlob();
}
