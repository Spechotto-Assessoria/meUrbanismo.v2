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

export const mesAnoPt = (valor?: string | null): string => {
  if (!valor) return '—';
  const [ano, mes] = valor.split('-');
  if (!ano || !mes) return valor;
  const d = new Date(Number(ano), Number(mes) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const periodoLabel = (inicio?: string | null, fim?: string | null): string => {
  if (!inicio && !fim) return 'Período completo';
  return `${mesAnoPt(inicio)} — ${mesAnoPt(fim)}`;
};
