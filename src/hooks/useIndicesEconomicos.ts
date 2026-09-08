import { useEffect, useState } from 'react';
import {
  buscarIndicesEconomicos,
  type IndicesEconomicos,
} from '../lib/indices-economicos';

export function useIndicesEconomicos() {
  const [indices, setIndices] = useState<IndicesEconomicos | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    void buscarIndicesEconomicos()
      .then((r) => {
        if (vivo) setIndices(r);
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return { indices, loading };
}
