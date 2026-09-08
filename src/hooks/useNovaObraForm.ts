import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadObraCapa } from '../lib/storage';
import { formatDecimal, maskDecimal, unmask } from '../components/viabilidade/formatters';
import {
  areaVendavelDivergente,
  campoObra,
  hidratarDecimal,
  hidratarInteiro,
  labelCidadeUf,
  maskInteiro,
  normalizarTipo,
  parseCidadeUf,
} from '../lib/obra-form';
import type { Obra } from '../types';

export type FeedbackObra = { type: 'error' | 'success' | 'warning'; message: string };

interface UseNovaObraFormArgs {
  obraToEdit?: Obra | null;
  preSelectedEmpresaId?: string;
  onBack?: () => void;
}

export function useNovaObraForm({ obraToEdit, preSelectedEmpresaId, onBack }: UseNovaObraFormArgs) {
  const { empresas, addObra, updateObra, updateObraFotoCapa, setActiveObra, isMasterAdmin } = useAuth();
  const [idPersistido, setIdPersistido] = useState(obraToEdit?.id || '');
  const [fotoCapaAtual, setFotoCapaAtual] = useState(obraToEdit?.foto_capa);
  const isEditing = Boolean(idPersistido);
  const obraRaw = obraToEdit ?? null;

  const [nome, setNome] = useState(obraToEdit?.nome ?? '');
  const [empresaId, setEmpresaId] = useState(
    campoObra(obraRaw, 'empresa_id', 'empresaId') || preSelectedEmpresaId || empresas[0]?.id || ''
  );
  const [status, setStatus] = useState(obraToEdit?.status || 'Planejamento');
  const [tipo, setTipo] = useState<string>(normalizarTipo(obraToEdit?.tipo));
  const [descricao, setDescricao] = useState(obraToEdit?.descricao || '');
  const [endereco, setEndereco] = useState(obraToEdit?.endereco || '');
  const [cidade, setCidade] = useState(obraToEdit?.cidade || '');
  const [uf, setUf] = useState(obraToEdit?.uf || 'SP');
  const [areaM2, setAreaM2] = useState(hidratarDecimal(campoObra(obraRaw, 'area_total_m2', 'areaM2')));
  const [valorGlobal, setValorGlobal] = useState(
    hidratarDecimal(campoObra(obraRaw, 'valor_vgv', 'valorGlobal'))
  );
  const [qtdLotes, setQtdLotes] = useState(hidratarInteiro(campoObra(obraRaw, 'total_lotes', 'qtdLotes')));
  const [metragemPadraoLote, setMetragemPadraoLote] = useState(
    hidratarDecimal(campoObra(obraRaw, 'metragem_padrao_lote', 'metragemPadraoLote'))
  );
  const [areaVendavel, setAreaVendavel] = useState(
    hidratarDecimal(campoObra(obraRaw, 'area_vendavel_m2'))
  );
  const [areaVendavelManual, setAreaVendavelManual] = useState(() =>
    areaVendavelDivergente(
      Number(campoObra(obraRaw, 'total_lotes', 'qtdLotes')) || 0,
      Number(campoObra(obraRaw, 'metragem_padrao_lote', 'metragemPadraoLote')) || 0,
      Number(campoObra(obraRaw, 'area_vendavel_m2')) || 0
    )
  );
  const [dataInicio, setDataInicio] = useState(campoObra(obraRaw, 'data_inicio', 'dataInicio'));
  const [dataEntrega, setDataEntrega] = useState(campoObra(obraRaw, 'data_previsao', 'dataEntrega'));
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreviewUrl, setCapaPreviewUrl] = useState<string | null>(obraToEdit?.foto_capa || null);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackObra | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!empresaId && (preSelectedEmpresaId || empresas[0]?.id)) {
      setEmpresaId(preSelectedEmpresaId || empresas[0].id);
    }
  }, [preSelectedEmpresaId, empresas, empresaId]);

  useEffect(() => {
    if (areaVendavelManual) return;
    const qtd = Math.round(unmask(qtdLotes));
    const media = unmask(metragemPadraoLote);
    if (qtd > 0 && media > 0) {
      setAreaVendavel(formatDecimal(qtd * media));
    }
  }, [qtdLotes, metragemPadraoLote, areaVendavelManual]);

  const handleEmpresaSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val !== 'NOVA_EMPRESA') setEmpresaId(val);
    return val;
  };

  const handleCidadeChange = (label: string) => {
    const parsed = parseCidadeUf(label, uf);
    setCidade(parsed.cidade);
    setUf(parsed.uf);
  };

  const handleQtdChange = (raw: string) => setQtdLotes(maskInteiro(raw));
  const handleMetragemChange = (raw: string) => setMetragemPadraoLote(maskDecimal(raw));
  const handleGlebaChange = (raw: string) => setAreaM2(maskDecimal(raw));
  const handleVgvChange = (raw: string) => setValorGlobal(maskDecimal(raw));
  const handleAreaVendavelChange = (raw: string) => {
    setAreaVendavelManual(true);
    setAreaVendavel(maskDecimal(raw));
  };

  const handleEscolherImagem = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCapaFile(file);
    setCapaPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : obraToEdit?.foto_capa || null;
    });
  };

  const handleCapaError = () => setCapaPreviewUrl(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isMasterAdmin) {
      setFeedback({ type: 'error', message: 'Apenas o administrador pode cadastrar ou editar obras.' });
      return;
    }
    if (!nome.trim()) {
      setFeedback({ type: 'error', message: 'Informe o Nome da Obra.' });
      return;
    }
    if (!empresaId) {
      setFeedback({ type: 'error', message: 'Selecione uma Empresa ou crie uma nova antes de continuar.' });
      return;
    }
    if (!cidade.trim()) {
      setFeedback({ type: 'error', message: 'Informe a cidade da obra.' });
      return;
    }

    const emp = empresas.find((item) => item.id === empresaId);
    const payload: Omit<Obra, 'id'> & { id?: string } = {
      nome: nome.trim(),
      empresaId,
      empresa_id: empresaId,
      empresaNome: emp?.nome || 'Empresa',
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase().slice(0, 2) || 'SP',
      tipo,
      status,
      descricao: descricao.trim(),
      endereco: endereco.trim(),
      areaM2: unmask(areaM2),
      area_total_m2: unmask(areaM2),
      area_vendavel_m2: unmask(areaVendavel),
      valorGlobal: unmask(valorGlobal),
      valor_vgv: unmask(valorGlobal),
      qtdLotes: Math.round(unmask(qtdLotes)),
      total_lotes: Math.round(unmask(qtdLotes)),
      metragemPadraoLote: unmask(metragemPadraoLote),
      metragem_padrao_lote: unmask(metragemPadraoLote),
      dataInicio: dataInicio || undefined,
      dataEntrega: dataEntrega || undefined,
      foto_capa: fotoCapaAtual,
    };

    setSalvando(true);
    try {
      const salva = idPersistido
        ? await updateObra({ ...obraToEdit, ...payload, id: idPersistido } as Obra)
        : await addObra(payload);
      setIdPersistido(salva.id);
      setFotoCapaAtual(salva.foto_capa);

      if (capaFile) {
        try {
          const url = await uploadObraCapa(capaFile, salva.id);
          const comCapa = await updateObraFotoCapa(salva.id, url);
          setFotoCapaAtual(comCapa.foto_capa);
          setActiveObra(comCapa);
        } catch (capaErr: unknown) {
          const message =
            capaErr instanceof Error
              ? capaErr.message
              : 'Obra salva, mas a imagem de capa não pôde ser enviada. Tente novamente na edição.';
          setActiveObra(salva);
          setFeedback({ type: 'warning', message });
          setSalvando(false);
          return;
        }
      } else {
        setActiveObra(salva);
      }

      setFeedback({ type: 'success', message: 'Obra salva.' });
      window.setTimeout(() => onBack?.(), 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar a obra. Tente novamente.';
      setFeedback({ type: 'error', message });
    } finally {
      setSalvando(false);
    }
  };

  return {
    isEditing,
    isMasterAdmin,
    empresas,
    nome, setNome,
    empresaId,
    status, setStatus,
    tipo, setTipo,
    descricao, setDescricao,
    endereco, setEndereco,
    cidadeLabel: labelCidadeUf(cidade, uf),
    handleCidadeChange,
    areaM2, handleGlebaChange,
    valorGlobal, handleVgvChange,
    qtdLotes, handleQtdChange,
    metragemPadraoLote, handleMetragemChange,
    areaVendavel, handleAreaVendavelChange,
    dataInicio, setDataInicio,
    dataEntrega, setDataEntrega,
    capaFile,
    capaPreviewUrl,
    salvando,
    feedback,
    fileInputRef,
    handleEmpresaSelectChange,
    handleEscolherImagem,
    handleFileChange,
    handleCapaError,
    handleSubmit,
  };
}
