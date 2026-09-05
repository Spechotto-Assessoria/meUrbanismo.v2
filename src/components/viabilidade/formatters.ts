export const formatDecimal = (val: number) =>
  val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const maskDecimal = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (!v) return '0,00';
  v = (Number(v) / 100).toFixed(2) + '';
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return v;
};

export const unmask = (val: string | number) =>
  typeof val === 'number' ? val : Number(val.replace(/\./g, '').replace(',', '.')) || 0;

export const pctSobre = (parte: number, total: number) =>
  total > 0 ? (parte / total) * 100 : 0;

/** Custo/m² = 25% da venda/m² → venda = custo × 4 */
export const vendaAPartirDoCusto = (custo: number) => custo * 4;
