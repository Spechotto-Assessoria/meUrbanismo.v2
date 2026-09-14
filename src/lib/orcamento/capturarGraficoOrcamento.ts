/** Converte o container do gráfico de composição em PNG Base64 para exportação em PDF. */
export async function capturarGraficoOrcamento(
  container: HTMLElement | null
): Promise<string | null> {
  if (!container) return null;

  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(container, {
    backgroundColor: '#020617',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}
