export async function urlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function logoComFallback(paths: string[]): Promise<string | undefined> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  for (const p of paths) {
    const uri = await urlToDataUri(`${origin}${p}`);
    if (uri) return uri;
  }
  return undefined;
}

export async function preloadImagensRelatorio(
  fotosUrls: string[],
  limite = 12
): Promise<{ logoMeUrbanismo?: string; logoSpechotto?: string; fotos: string[] }> {
  const [logoMeUrbanismo, logoSpechotto] = await Promise.all([
    logoComFallback(['/logo-meurbanismo.jpg', '/logo-meurbanismo.png']),
    logoComFallback(['/logo-spechotto.png'])
  ]);

  const fotos: string[] = [];
  for (const url of fotosUrls.slice(0, limite)) {
    const dataUri = await urlToDataUri(url);
    if (dataUri) fotos.push(dataUri);
  }

  return { logoMeUrbanismo, logoSpechotto, fotos };
}
