import { pdf } from '@react-pdf/renderer';
import type { GerarRelatorioParams } from './tipos';
import { fetchDadosRelatorio } from './fetchDadosRelatorio';
import { preloadImagensRelatorio } from './fetch/preloadImagens';
import { renderMapaLotesCanvas } from './renderMapaLotesCanvas';
import { RelatorioDocument } from './pdf/RelatorioDocument';

export async function buildRelatorioPdf(params: GerarRelatorioParams): Promise<Blob> {
  const dados = await fetchDadosRelatorio(params);
  const fotosUrls = dados.fotos.map((f) => f.url).filter(Boolean) as string[];
  const { logoMeUrbanismo, logoSpechotto, fotos } = await preloadImagensRelatorio(fotosUrls);

  const precisaMapa = params.tipo === 'mapa_lotes' || params.tipo === 'global';
  const mapaDataUri = precisaMapa
    ? await renderMapaLotesCanvas(
        dados.obra.mapa_masterplan_url,
        dados.obra.mapa_viewbox,
        dados.lotes,
        dados.obra.mapa_img_transform
      )
    : undefined;

  const doc = (
    <RelatorioDocument
      {...dados}
      logoMeUrbanismoDataUri={logoMeUrbanismo}
      logoSpechottoDataUri={logoSpechotto}
      fotosDataUri={fotos}
      mapaDataUri={mapaDataUri || undefined}
    />
  );

  return pdf(doc).toBlob();
}
