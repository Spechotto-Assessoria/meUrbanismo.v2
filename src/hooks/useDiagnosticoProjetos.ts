import { useState } from 'react';
import type {
  CalibracaoEscala,
  CategoriaLevantamento,
  FerramentaDiagnostico,
  MedicaoDiagnostico,
  PontoPdf
} from '../types/diagnostico';
import { CATEGORIAS_LEVANTAMENTO } from '../types/diagnostico';
import { idMedicao, metrosLineares, metrosQuadrados } from '../lib/diagnostico-medicao';

const MOCK_EDIFICACOES: Pick<MedicaoDiagnostico, 'nome' | 'valor'>[] = [
  { nome: 'Portaria Social', valor: 85 },
  { nome: 'Salão de Festas', valor: 240 },
  { nome: 'Casa de Máquinas', valor: 32 }
];

const MOCK_LAZER: Pick<MedicaoDiagnostico, 'nome' | 'valor'>[] = [
  { nome: 'Praça de Eventos', valor: 420 },
  { nome: 'Pet Place', valor: 95 },
  { nome: 'Playground', valor: 160 }
];

export function useDiagnosticoProjetos() {
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [ferramenta, setFerramenta] = useState<FerramentaDiagnostico>('selecao');
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaLevantamento>('ruas');
  const [rascunho, setRascunho] = useState<PontoPdf[]>([]);
  const [calibracao, setCalibracao] = useState<CalibracaoEscala | null>(null);
  const [pendenteCalibracao, setPendenteCalibracao] = useState<PontoPdf[] | null>(null);
  const [pendenteNome, setPendenteNome] = useState<{
    pontos: PontoPdf[];
    pagina: number;
    valor: number;
  } | null>(null);
  const [medicoes, setMedicoes] = useState<MedicaoDiagnostico[]>([]);
  const [extraindo, setExtraindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const configAtiva = CATEGORIAS_LEVANTAMENTO.find((c) => c.id === categoriaAtiva);

  const carregarArquivo = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setAviso('Envie um arquivo PDF.');
      return;
    }
    if (url) URL.revokeObjectURL(url);
    setArquivoNome(file.name);
    setUrl(URL.createObjectURL(file));
    setMedicoes([]);
    setCalibracao(null);
    setRascunho([]);
    setPendenteCalibracao(null);
    setPendenteNome(null);
    setFerramenta('calibrar');
    setAviso('Calibre a escala antes de medir (ex.: largura da rua = 7 m).');
  };

  const limparRascunho = () => setRascunho([]);

  const selecionarCategoria = (id: CategoriaLevantamento) => {
    setCategoriaAtiva(id);
    const cfg = CATEGORIAS_LEVANTAMENTO.find((c) => c.id === id);
    if (cfg?.tipo === 'linha') setFerramenta('linha');
    else if (cfg?.tipo === 'area' || cfg?.tipo === 'lista') setFerramenta('area');
  };

  const registrarMedicao = (
    pontos: PontoPdf[],
    pagina: number,
    tipo: 'linha' | 'area',
    nome?: string
  ) => {
    if (!calibracao) {
      setAviso('Calibre a escala antes de registrar medições.');
      return;
    }
    const valor =
      tipo === 'linha'
        ? metrosLineares(pontos, calibracao.metrosPorUnidade)
        : metrosQuadrados(pontos, calibracao.metrosPorUnidade);

    if (categoriaAtiva === 'edificacoes' || categoriaAtiva === 'lazer') {
      setPendenteNome({ pontos, pagina, valor });
      setRascunho([]);
      return;
    }

    setMedicoes((prev) => [
      ...prev,
      {
        id: idMedicao(),
        categoria: categoriaAtiva,
        tipo,
        pontos,
        pagina,
        valor,
        nome
      }
    ]);
    setRascunho([]);
    setAviso(null);
  };

  const adicionarPonto = (ponto: PontoPdf, pagina: number) => {
    if (ferramenta === 'selecao') return;
    const proximo = [...rascunho, ponto];

    if (ferramenta === 'calibrar' && proximo.length >= 2) {
      setPendenteCalibracao(proximo.slice(0, 2));
      setFerramenta('selecao');
      setRascunho([]);
      return;
    }

    if (ferramenta === 'linha' && proximo.length >= 2) {
      registrarMedicao(proximo.slice(0, 2), pagina, 'linha');
      return;
    }

    setRascunho(proximo);
  };

  const confirmarArea = (pagina: number) => {
    if (rascunho.length < 3) {
      setAviso('A área precisa de pelo menos 3 pontos. Clique no polígono e depois em Concluir área.');
      return;
    }
    registrarMedicao(rascunho, pagina, 'area');
  };

  const confirmarCalibracao = (metros: number, rotulo: string, pagina: number) => {
    if (!pendenteCalibracao || pendenteCalibracao.length < 2 || metros <= 0) return;
    const unidades = metrosLineares(pendenteCalibracao, 1);
    if (unidades <= 0) return;
    setCalibracao({
      metrosPorUnidade: metros / unidades,
      rotulo: rotulo.trim() || 'Referência',
      metrosReferencia: metros,
      pontos: pendenteCalibracao,
      pagina
    });
    setPendenteCalibracao(null);
    setFerramenta('area');
    setAviso('Escala calibrada. Use Medir linha ou Medir área.');
  };

  const confirmarNomeItem = (nome: string) => {
    if (!pendenteNome) return;
    setMedicoes((prev) => [
      ...prev,
      {
        id: idMedicao(),
        categoria: categoriaAtiva,
        tipo: 'area',
        pontos: pendenteNome.pontos,
        pagina: pendenteNome.pagina,
        valor: pendenteNome.valor,
        nome: nome.trim() || 'Sem nome'
      }
    ]);
    setPendenteNome(null);
    setAviso(null);
  };

  const removerMedicao = (id: string) => {
    setMedicoes((prev) => prev.filter((m) => m.id !== id));
  };

  const extrairQuadroAreas = async () => {
    setExtraindo(true);
    setAviso('Lendo legendas do PDF…');
    await new Promise((r) => setTimeout(r, 1400));
    const agora = Date.now();
    const novas: MedicaoDiagnostico[] = [
      ...MOCK_EDIFICACOES.map((item, i) => ({
        id: `ia-ed-${agora}-${i}`,
        categoria: 'edificacoes' as const,
        tipo: 'area' as const,
        pontos: [],
        pagina: 1,
        valor: item.valor,
        nome: item.nome
      })),
      ...MOCK_LAZER.map((item, i) => ({
        id: `ia-lz-${agora}-${i}`,
        categoria: 'lazer' as const,
        tipo: 'area' as const,
        pontos: [],
        pagina: 1,
        valor: item.valor,
        nome: item.nome
      }))
    ];
    setMedicoes((prev) => [
      ...prev.filter((m) => m.categoria !== 'edificacoes' && m.categoria !== 'lazer'),
      ...novas
    ]);
    setExtraindo(false);
    setAviso('Quadro de áreas extraído (protótipo). Conectaremos Claude/OpenAI em seguida.');
  };

  return {
    arquivoNome,
    url,
    ferramenta,
    setFerramenta,
    categoriaAtiva,
    selecionarCategoria,
    configAtiva,
    rascunho,
    limparRascunho,
    calibracao,
    pendenteCalibracao,
    setPendenteCalibracao,
    pendenteNome,
    setPendenteNome,
    medicoes,
    extraindo,
    aviso,
    setAviso,
    carregarArquivo,
    adicionarPonto,
    confirmarArea,
    confirmarCalibracao,
    confirmarNomeItem,
    removerMedicao,
    extrairQuadroAreas
  };
}
