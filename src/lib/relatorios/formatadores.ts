export const brl = (valor: number | null | undefined, incluiFinanceiro: boolean): string => {
  if (!incluiFinanceiro) return '—';
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

export const pct = (valor: number | null | undefined): string => {
  const n = Number(valor) || 0;
  return `${n.toFixed(1)}%`;
};

export const dataPt = (valor?: string | null): string => {
  if (!valor) return '—';
  const d = new Date(valor.includes('T') ? valor : `${valor}T12:00:00`);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString('pt-BR');
};

/** Data e hora exata — uso exclusivo da UI web (não enviar ao PDF). */
export const dataHoraPt = (valor?: string | null): string => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
};

export const mesAnoPt = (valor?: string | null): string => {
  if (!valor) return '—';
  const [ano, mes] = valor.split('-');
  if (!ano || !mes) return valor;
  const d = new Date(Number(ano), Number(mes) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const periodoLabel = (inicio?: string | null, fim?: string | null): string => {
  if (!inicio && !fim) return 'Período completo';

  const ini = inicio?.slice(0, 10) || '';
  const fin = fim?.slice(0, 10) || ini;

  // Compatível com registros antigos (YYYY-MM-01) e novos (YYYY-MM-DD)
  const iniDia = ini.slice(8, 10);
  const finDia = fin.slice(8, 10);
  const mesmoMes = ini.slice(0, 7) === fin.slice(0, 7);

  if (mesmoMes && iniDia === '01' && finDia === '01') {
    return mesAnoPt(inicio);
  }

  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('pt-BR');
  };

  if (ini === fin) return fmt(ini);
  return `${fmt(ini)} — ${fmt(fin)}`;
};
