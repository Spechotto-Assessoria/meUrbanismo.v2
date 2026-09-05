export type PontoFluxo = { mes: number; liquido: number; acumulado: number };

/** VPL de série mensal. Índice 0 = mês 0 (não descontado). */
export function npv(rate: number, flows: number[]): number {
  return flows.reduce((acc, f, i) => acc + f / Math.pow(1 + rate, i), 0);
}

/**
 * TMA efetiva a.a. → equivalente a.m. (Fisher).
 * Não usar TMA/12 (taxa linear/nominal).
 */
export function taxaMensalEquivalente(tmaAaPct: number): number {
  return Math.pow(1 + tmaAaPct / 100, 1 / 12) - 1;
}

export function tirAnualEfetiva(irrMensal: number): number {
  return (Math.pow(1 + irrMensal, 12) - 1) * 100;
}

/**
 * Norstrom: TIR única se o acumulado muda de sinal no máximo uma vez.
 * Mais de uma inversão → múltiplas TIRs possíveis.
 */
export function norstromUnico(flows: number[]): boolean {
  let acc = 0;
  let prev = 0;
  let mudancas = 0;
  for (const f of flows) {
    acc += f;
    const s = acc > 1e-9 ? 1 : acc < -1e-9 ? -1 : 0;
    if (s !== 0) {
      if (prev !== 0 && s !== prev) mudancas++;
      prev = s;
    }
  }
  return mudancas <= 1;
}

function irrNewton(flows: number[], guess: number): number | null {
  let rate = guess;
  for (let i = 0; i < 80; i++) {
    if (rate <= -0.9999) return null;
    let v = 0;
    let d = 0;
    for (let t = 0; t < flows.length; t++) {
      const den = Math.pow(1 + rate, t);
      v += flows[t] / den;
      if (t > 0) d -= (t * flows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (!isFinite(v) || !isFinite(d) || Math.abs(d) < 1e-14) return null;
    const next = rate - v / d;
    if (!isFinite(next) || next <= -0.9999 || next > 12) return null;
    if (Math.abs(next - rate) < 1e-10) return next;
    rate = next;
  }
  return null;
}

function irrBissecao(flows: number[]): number | null {
  const f = (r: number) => npv(r, flows);
  let lo = -0.9999;
  let hi = 1;
  let flo = f(lo);
  let fhi = f(hi);

  let tentativas = 0;
  while (isFinite(flo) && isFinite(fhi) && flo * fhi > 0 && tentativas < 40) {
    hi *= 2;
    fhi = f(hi);
    tentativas++;
  }

  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) {
    let prevR = -0.99;
    let prevV = f(prevR);
    for (let r = -0.98; r <= 10; r += 0.01) {
      const v = f(r);
      if (isFinite(prevV) && isFinite(v) && prevV * v <= 0) {
        lo = prevR;
        hi = r;
        flo = prevV;
        fhi = v;
        break;
      }
      prevR = r;
      prevV = v;
    }
  }
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (!isFinite(fm)) return null;
    if (Math.abs(fm) < 1e-10) return mid;
    if (flo * fm <= 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  const r = (lo + hi) / 2;
  return isFinite(r) ? r : null;
}

function npvTol(flows: number[]): number {
  const soma = flows.reduce((a, f) => a + Math.abs(f), 0);
  return Math.max(1, soma * 1e-8);
}

/** TIR mensal: Newton-Raphson com fallback de bisseção. */
export function irr(flows: number[]): number | null {
  if (!flows.length || flows.every((x) => Math.abs(x) < 1e-12)) return null;
  const newton = irrNewton(flows, 0.01) ?? irrNewton(flows, 0.1);
  if (newton != null && isFinite(newton) && Math.abs(npv(newton, flows)) < npvTol(flows)) return newton;
  return irrBissecao(flows);
}

export function tirConfiavelFaixa(irrMensal: number | null, flows: number[]): boolean {
  if (irrMensal == null || !isFinite(irrMensal)) return false;
  if (!norstromUnico(flows)) return false;
  const aa = tirAnualEfetiva(irrMensal);
  return aa > -99 && aa < 200;
}

/**
 * Payback simples interpolado: n + |S_n| / CF_{n+1},
 * onde n é o último mês com acumulado negativo.
 */
export function paybackInterpolado(fluxo: PontoFluxo[]): number | null {
  for (let i = 1; i < fluxo.length; i++) {
    const prev = fluxo[i - 1];
    const cur = fluxo[i];
    if (prev.acumulado < 0 && cur.acumulado >= 0) {
      const cf = cur.liquido;
      if (cf <= 1e-12) return cur.mes;
      return prev.mes + -prev.acumulado / cf;
    }
  }
  return null;
}

/**
 * Payback descontado pela TMA mensal: mês em que o acumulado em VP passa a ≥ 0.
 * Interpolado: t-1 + |S_{t-1}| / PV_t. Se nunca ficou negativo, retorna 0.
 */
export function paybackDescontado(flows: number[], rate: number): number | null {
  if (!flows.length) return null;
  const EPS = 1e-12;
  let acc = 0;
  let everNeg = false;
  for (let t = 0; t < flows.length; t++) {
    const prev = acc;
    const den = Math.pow(1 + rate, t);
    const pv = isFinite(den) && den !== 0 ? flows[t] / den : 0;
    acc += pv;
    if (acc < -EPS) everNeg = true;
    if (prev < -EPS && acc >= -EPS) {
      if (pv <= EPS) return t;
      return t - 1 + -prev / pv;
    }
  }
  if (!everNeg) return 0;
  return null;
}

export function mesExposicaoMaxima<T extends { acumulado: number }>(fluxo: T[]): T {
  return fluxo.reduce((a, b) => (b.acumulado < a.acumulado ? b : a), fluxo[0]);
}
