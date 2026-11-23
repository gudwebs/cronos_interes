export type InterestRegime = 'compound' | 'simple' | 'force';
export type AnnuityPerspective = 'a' | 'a_due' | 's' | 's_due';
export type FlowSide = 'debt' | 'payment';
export type FlowKind = 'single' | 'annuity' | 'perpetuity';

export interface RateSegment {
  id: string;
  start: number;
  end: number;
  rate: number; // effective rate per timeline period
  label?: string;
}

export interface TimelineFlow {
  id: string;
  label: string;
  side: FlowSide; // 'debt' (arriba / lo que se debe) | 'payment' (abajo / lo que se paga)
  kind: FlowKind;
  amount: number;
  isUnknown?: boolean;
  unknownSymbol?: string;
  /** For 'single': time t. For 'annuity'/'perpetuity': time of FIRST payment */
  startTime: number;
  /** Only for 'annuity': number of payments */
  count?: number;
  /** Which formula perspective to display/evaluate for annuities */
  perspective?: AnnuityPerspective;
}

export interface EvaluatedFlow {
  flow: TimelineFlow;
  landingTime: number;
  /** Factor from annuity formula itself (1 for single flow) */
  baseFactor: number;
  /** Factor moving from landingTime to focalDate */
  moveFactor: number;
  /** Total multiplier applied to amount (baseFactor * moveFactor) */
  totalFactor: number;
  /** Numeric value at focalDate (if known) or coefficient multiplying X */
  valueAtFF: number;
  /** Direction from landingTime to focalDate */
  direction: 'forward' | 'backward' | 'at_ff';
  /** Distance |ff - landingTime| */
  stepsToFF: number;
  /** Readable formula fragment in Spanish/UDLAP notation */
  formulaLabel: string;
  moveFormulaLabel: string;
}

export interface FocalDateRecommendation {
  recommendedFF: number;
  reason: string;
  alternativeFF?: number;
  alternativeReason?: string;
}

/** v = 1 / (1 + i) */
export function vFactor(t: number, i: number): number {
  if (i === 0) return 1;
  return Math.pow(1 + i, -t);
}

/** (1 + i)^t */
export function accFactor(t: number, i: number): number {
  if (i === 0) return 1;
  return Math.pow(1 + i, t);
}

/** a_{n|i} = (1 - v^n) / i  (lands 1 period BEFORE first payment) */
export function aAngle(n: number, i: number): number {
  if (n <= 0) return 0;
  if (Math.abs(i) < 1e-12) return n;
  return (1 - Math.pow(1 + i, -n)) / i;
}

/** ä_{n|i} = (1 - v^n) / (1 - v)  (UDLAP formula! lands AT first payment) */
export function aDueAngle(n: number, i: number): number {
  if (n <= 0) return 0;
  if (Math.abs(i) < 1e-12) return n;
  const v = 1 / (1 + i);
  return (1 - Math.pow(v, n)) / (1 - v);
}

/** s_{n|i} = ((1 + i)^n - 1) / i  (lands AT last payment) */
export function sAngle(n: number, i: number): number {
  if (n <= 0) return 0;
  if (Math.abs(i) < 1e-12) return n;
  return (Math.pow(1 + i, n) - 1) / i;
}

/** s̈_{n|i} = ((1 + i)^n - 1) / (1 - v)  (UDLAP formula! lands 1 period AFTER last payment) */
export function sDueAngle(n: number, i: number): number {
  if (n <= 0) return 0;
  if (Math.abs(i) < 1e-12) return n;
  const v = 1 / (1 + i);
  return (Math.pow(1 + i, n) - 1) / (1 - v);
}

/** Move a unit amount from `fromT` to `toT` under chosen regime (or multi-rate segments) */
export function moveUnitFactor(
  fromT: number,
  toT: number,
  rate: number,
  regime: InterestRegime = 'compound',
  segments?: RateSegment[]
): number {
  const dt = toT - fromT;
  if (Math.abs(dt) < 1e-9) return 1;

  if (segments && segments.length > 0 && regime === 'compound') {
    const forward = dt > 0;
    const lo = Math.min(fromT, toT);
    const hi = Math.max(fromT, toT);
    let factor = 1;
    let covered = 0;

    for (const seg of segments) {
      const overlapStart = Math.max(lo, seg.start);
      const overlapEnd = Math.min(hi, seg.end);
      if (overlapEnd > overlapStart) {
        const span = overlapEnd - overlapStart;
        covered += span;
        factor *= forward
          ? Math.pow(1 + seg.rate, span)
          : Math.pow(1 + seg.rate, -span);
      }
    }
    const uncovered = hi - lo - covered;
    if (uncovered > 1e-9) {
      factor *= forward
        ? Math.pow(1 + rate, uncovered)
        : Math.pow(1 + rate, -uncovered);
    }
    return factor;
  }

  if (regime === 'simple') {
    if (dt > 0) return 1 + rate * dt;
    return 1 / (1 + rate * Math.abs(dt));
  }

  if (regime === 'force') {
    // Here `rate` represents delta (continuous force of interest)
    return Math.exp(rate * dt);
  }

  return Math.pow(1 + rate, dt);
}

/** Landing point of an annuity depending on perspective */
export function getAnnuityLandingTime(
  startTime: number,
  count: number,
  perspective: AnnuityPerspective
): number {
  const lastTime = startTime + count - 1;
  switch (perspective) {
    case 'a':
      return startTime - 1;
    case 'a_due':
      return startTime;
    case 's':
      return lastTime;
    case 's_due':
      return lastTime + 1;
  }
}

export function getPerspectiveInfo(perspective: AnnuityPerspective): {
  symbol: string;
  name: string;
  landingRule: string;
  formulaText: string;
} {
  switch (perspective) {
    case 'a':
      return {
        symbol: 'aₙ',
        name: 'VP Vencida',
        landingRule: '1 periodo ANTES del 1er pago',
        formulaText: '(1 - vⁿ) / i',
      };
    case 'a_due':
      return {
        symbol: 'äₙ',
        name: 'VP Anticipada',
        landingRule: 'AL MOMENTO del 1er pago',
        formulaText: '(1 - vⁿ) / (1 - v)',
      };
    case 's':
      return {
        symbol: 'sₙ',
        name: 'VF Vencida',
        landingRule: 'AL MOMENTO del último pago',
        formulaText: '((1 + i)ⁿ - 1) / i',
      };
    case 's_due':
      return {
        symbol: 's̈ₙ',
        name: 'VF Anticipada',
        landingRule: '1 periodo DESPUÉS del último pago',
        formulaText: '((1 + i)ⁿ - 1) / (1 - v)',
      };
  }
}

/** Get the effective rate active at a given time when segments are used */
export function getRateAtTime(
  t: number,
  fallbackRate: number,
  segments?: RateSegment[]
): number {
  if (!segments || segments.length === 0) return fallbackRate;
  const match = segments.find((s) => t >= s.start && t <= s.end);
  return match ? match.rate : fallbackRate;
}

/** Evaluate a flow at a given focal date */
export function evaluateFlowAtFF(
  flow: TimelineFlow,
  focalDate: number,
  rate: number,
  regime: InterestRegime = 'compound',
  segments?: RateSegment[]
): EvaluatedFlow {
  const effectiveRate =
    regime === 'force'
      ? Math.exp(rate) - 1
      : getRateAtTime(flow.startTime, rate, segments);

  let landingTime = flow.startTime;
  let baseFactor = 1;
  let formulaLabel = '';

  if (flow.kind === 'single') {
    landingTime = flow.startTime;
    baseFactor = 1;
    formulaLabel = flow.isUnknown ? flow.unknownSymbol || 'X' : formatCurrency(flow.amount);
  } else if (flow.kind === 'perpetuity') {
    const persp = flow.perspective === 'a_due' ? 'a_due' : 'a';
    landingTime = persp === 'a_due' ? flow.startTime : flow.startTime - 1;
    baseFactor =
      persp === 'a_due'
        ? effectiveRate > 0
          ? (1 + effectiveRate) / effectiveRate
          : 0
        : effectiveRate > 0
          ? 1 / effectiveRate
          : 0;
    const baseSym = persp === 'a_due' ? 'ä_∞' : 'a_∞';
    formulaLabel = `${flow.isUnknown ? flow.unknownSymbol || 'R' : formatCurrency(flow.amount)} · ${baseSym}`;
  } else {
    const n = Math.max(1, flow.count || 1);
    const persp: AnnuityPerspective = flow.perspective || 'a';
    landingTime = getAnnuityLandingTime(flow.startTime, n, persp);

    if (regime === 'simple') {
      // Under simple interest, sum each individual payment directly moved to FF
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += moveUnitFactor(flow.startTime + k, focalDate, rate, 'simple');
      }
      const stepsToFF = Math.abs(focalDate - landingTime);
      const direction =
        focalDate > landingTime ? 'forward' : focalDate < landingTime ? 'backward' : 'at_ff';
      const amtLabel = flow.isUnknown ? flow.unknownSymbol || 'R' : formatCurrency(flow.amount);
      return {
        flow,
        landingTime,
        baseFactor: sum,
        moveFactor: 1,
        totalFactor: sum,
        valueAtFF: flow.isUnknown ? sum : flow.amount * sum,
        direction,
        stepsToFF,
        formulaLabel: `Σ ${amtLabel} (interés simple)`,
        moveFormulaLabel: 'flujo por flujo',
      };
    }

    switch (persp) {
      case 'a':
        baseFactor = aAngle(n, effectiveRate);
        break;
      case 'a_due':
        baseFactor = aDueAngle(n, effectiveRate);
        break;
      case 's':
        baseFactor = sAngle(n, effectiveRate);
        break;
      case 's_due':
        baseFactor = sDueAngle(n, effectiveRate);
        break;
    }
    const pInfo = getPerspectiveInfo(persp);
    const amtLabel = flow.isUnknown ? flow.unknownSymbol || 'R' : formatCurrency(flow.amount);
    formulaLabel = `${amtLabel} · ${pInfo.symbol.replace('ₙ', '')}${n}`;
  }

  const dt = focalDate - landingTime;
  const stepsToFF = Math.abs(dt);
  const direction: 'forward' | 'backward' | 'at_ff' =
    stepsToFF < 1e-9 ? 'at_ff' : dt > 0 ? 'forward' : 'backward';

  const moveFactor = moveUnitFactor(landingTime, focalDate, rate, regime, segments);
  const totalFactor = baseFactor * moveFactor;

  let moveFormulaLabel = 'en FF (×1)';
  if (direction === 'forward') {
    if (regime === 'simple') {
      moveFormulaLabel = `(1 + i·${formatNum(stepsToFF, 2)})`;
    } else if (regime === 'force') {
      moveFormulaLabel = `e^(δ·${formatNum(stepsToFF, 2)})`;
    } else {
      moveFormulaLabel = `(1 + i)^${formatNum(stepsToFF, 2)}`;
    }
  } else if (direction === 'backward') {
    if (regime === 'simple') {
      moveFormulaLabel = `1 / (1 + i·${formatNum(stepsToFF, 2)})`;
    } else if (regime === 'force') {
      moveFormulaLabel = `e^(-δ·${formatNum(stepsToFF, 2)})`;
    } else {
      moveFormulaLabel = `v^${formatNum(stepsToFF, 2)}`;
    }
  }

  return {
    flow,
    landingTime,
    baseFactor,
    moveFactor,
    totalFactor,
    valueAtFF: flow.isUnknown ? totalFactor : flow.amount * totalFactor,
    direction,
    stepsToFF,
    formulaLabel,
    moveFormulaLabel,
  };
}

/** Solve Equation of Value: Sum(debt) = Sum(payment), supporting one or multiple equal unknown flows (e.g. 3 deposits of X) */
export function solveEquationOfValue(
  flows: TimelineFlow[],
  focalDate: number,
  rate: number,
  regime: InterestRegime = 'compound',
  segments?: RateSegment[]
): {
  evaluated: EvaluatedFlow[];
  knownDebtSum: number;
  knownPaymentSum: number;
  unknownFlow?: EvaluatedFlow;
  unknownCount: number;
  solvedUnknownValue?: number;
  balanceDiff: number;
} {
  const evaluated = flows.map((f) => evaluateFlowAtFF(f, focalDate, rate, regime, segments));

  let knownDebtSum = 0;
  let knownPaymentSum = 0;
  let unknownDebtCoeff = 0;
  let unknownPaymentCoeff = 0;
  let unknownFlow: EvaluatedFlow | undefined;
  let unknownCount = 0;

  for (const ev of evaluated) {
    if (ev.flow.isUnknown) {
      if (!unknownFlow) unknownFlow = ev;
      unknownCount += 1;
      if (ev.flow.side === 'debt') unknownDebtCoeff += ev.totalFactor;
      else unknownPaymentCoeff += ev.totalFactor;
    } else if (ev.flow.side === 'debt') {
      knownDebtSum += ev.valueAtFF;
    } else {
      knownPaymentSum += ev.valueAtFF;
    }
  }

  // Equation: knownDebtSum + unknownDebtCoeff * X = knownPaymentSum + unknownPaymentCoeff * X
  // => (unknownDebtCoeff - unknownPaymentCoeff) * X = knownPaymentSum - knownDebtSum
  const netCoeff = unknownDebtCoeff - unknownPaymentCoeff;
  let solvedUnknownValue: number | undefined;
  if (unknownCount > 0 && Math.abs(netCoeff) > 1e-12) {
    solvedUnknownValue = (knownPaymentSum - knownDebtSum) / netCoeff;
  }

  const totalDebt =
    knownDebtSum + (solvedUnknownValue !== undefined ? solvedUnknownValue * unknownDebtCoeff : 0);
  const totalPay =
    knownPaymentSum +
    (solvedUnknownValue !== undefined ? solvedUnknownValue * unknownPaymentCoeff : 0);

  return {
    evaluated,
    knownDebtSum,
    knownPaymentSum,
    unknownFlow,
    unknownCount,
    solvedUnknownValue,
    balanceDiff: totalDebt - totalPay,
  };
}

/** Recommend the cleanest Focal Date for the student */
export function recommendFocalDate(
  flows: TimelineFlow[],
  regime: InterestRegime
): FocalDateRecommendation {
  if (regime === 'simple') {
    return {
      recommendedFF: 0,
      reason:
        'En Interés Simple la Fecha Focal SÍ cambia el resultado: usa exactamente la fecha que indica el enunciado (si no especifica, suele usarse t = 0 o la fecha de liquidación).',
    };
  }

  const unknown = flows.find((f) => f.isUnknown);
  if (unknown) {
    if (unknown.kind === 'single') {
      return {
        recommendedFF: unknown.startTime,
        reason: `Colocar FF = ${unknown.startTime} deja a tu incógnita ${unknown.unknownSymbol || 'X'} completamente sola (sin multiplicarla ni descontarla), ahorrándote el despeje final.`,
        alternativeFF: 0,
        alternativeReason: 't = 0 también funciona y siempre da el mismo resultado en interés compuesto.',
      };
    }
    const persp = unknown.perspective || 'a';
    const landing = getAnnuityLandingTime(unknown.startTime, unknown.count || 1, persp);
    return {
      recommendedFF: Math.max(0, landing),
      reason: `En FF = ${Math.max(0, landing)} la anualidad de ${unknown.unknownSymbol || 'R'} cae directamente sobre la Fecha Focal sin factor puente adicional.`,
      alternativeFF: 0,
      alternativeReason: 'Si prefieres FF = 0, simplemente aplica v^k para traer el aterrizaje al origen.',
    };
  }

  const annuity = flows.find((f) => f.kind === 'annuity');
  if (annuity) {
    const landing = getAnnuityLandingTime(
      annuity.startTime,
      annuity.count || 1,
      annuity.perspective || 'a'
    );
    return {
      recommendedFF: Math.max(0, landing),
      reason: `En FF = ${Math.max(0, landing)} evitas mover la anualidad porque ahí aterriza exactamente tu fórmula (${getPerspectiveInfo(annuity.perspective || 'a').symbol}).`,
      alternativeFF: 0,
      alternativeReason: 't = 0 es el estándar del curso cuando el préstamo se entrega hoy.',
    };
  }

  return {
    recommendedFF: 0,
    reason: 'En interés compuesto cualquier Fecha Focal da el mismo resultado; t = 0 suele ser la referencia más ordenada.',
  };
}

/** Rate conversion engine (Parcial 2 & 3) */
export type RateInputType =
  | 'effective'
  | 'nominal_annual'
  | 'nominal_custom'
  | 'discount'
  | 'force';

export interface PeriodUnit {
  id: string;
  label: string;
  plural: string;
  perYear: number;
}

export const PERIOD_UNITS: PeriodUnit[] = [
  { id: 'anual', label: 'Anual', plural: 'años', perYear: 1 },
  { id: 'semestral', label: 'Semestral', plural: 'semestres', perYear: 2 },
  { id: 'cuatrimestral', label: 'Cuatrimestral', plural: 'cuatrimestres', perYear: 3 },
  { id: 'trimestral', label: 'Trimestral', plural: 'trimestres', perYear: 4 },
  { id: 'bimestral', label: 'Bimestral', plural: 'bimestres', perYear: 6 },
  { id: 'mensual', label: 'Mensual', plural: 'meses', perYear: 12 },
  { id: 'quincenal', label: 'Quincenal', plural: 'quincenas', perYear: 24 },
  { id: 'semanal', label: 'Semanal', plural: 'semanas', perYear: 52 },
  { id: 'diaria', label: 'Diaria (360)', plural: 'días', perYear: 360 },
];

export interface RateConversionResult {
  effectiveAnnual: number;
  targetEffective: number;
  targetNominalAnnual: number;
  effectiveDiscount: number;
  forceOfInterest: number;
  steps: { title: string; formula: string; value: string }[];
}

export function convertInterestRate(params: {
  inputType: RateInputType;
  ratePercent: number; // e.g., 16 for 16%
  inputPeriodPerYear: number; // e.g., 12 for mensual, 2 for semestral
  compoundingPerInputPeriod: number; // e.g., m in i^(m) or 6 in i_s^(6)
  targetPeriodPerYear: number;
}): RateConversionResult {
  const r = params.ratePercent / 100;
  const steps: { title: string; formula: string; value: string }[] = [];

  let iAnnual = 0;

  if (params.inputType === 'effective') {
    const p = params.inputPeriodPerYear;
    iAnnual = Math.pow(1 + r, p) - 1;
    steps.push({
      title: 'Paso 1: Partimos de tasa efectiva del periodo dado',
      formula: `i_periodo = ${formatPct(r)} (${p} periodos/año)`,
      value: formatPct(r),
    });
    if (p !== 1) {
      steps.push({
        title: 'Paso 2: Llevamos a tasa efectiva anual equivalente',
        formula: `i_a = (1 + ${r.toFixed(6)})^${p} − 1`,
        value: formatPct(iAnnual),
      });
    }
  } else if (params.inputType === 'nominal_annual') {
    const m = Math.max(1, params.compoundingPerInputPeriod);
    const iCap = r / m;
    iAnnual = Math.pow(1 + iCap, m) - 1;
    steps.push({
      title: 'Paso 1: Dividir la tasa nominal entre sus capitalizaciones m',
      formula: `i_cap = i^(${m}) / ${m} = ${formatPct(r)} / ${m}`,
      value: `${formatPct(iCap)} efectiva por periodo de cap.`,
    });
    steps.push({
      title: 'Paso 2: Tasa efectiva anual equivalente',
      formula: `i_a = (1 + ${iCap.toFixed(6)})^${m} − 1`,
      value: formatPct(iAnnual),
    });
  } else if (params.inputType === 'nominal_custom') {
    // Non-annual nominal rate like i_s^(6) = 8% (semestral convertible mensualmente)
    const pQuote = params.inputPeriodPerYear; // e.g. 2 for semestral
    const subM = Math.max(1, params.compoundingPerInputPeriod); // e.g. 6 months per semester
    const iCap = r / subM;
    const capPerYear = pQuote * subM;
    iAnnual = Math.pow(1 + iCap, capPerYear) - 1;
    steps.push({
      title: 'Paso 1: ¡Tasa nominal NO anual! Divide entre sub-periodos dentro del periodo cotizado',
      formula: `i_cap = ${formatPct(r)} / ${subM}`,
      value: `${formatPct(iCap)} efectiva (${capPerYear} veces/año)`,
    });
    steps.push({
      title: 'Paso 2: Equivalente anual',
      formula: `i_a = (1 + ${iCap.toFixed(6)})^${capPerYear} − 1`,
      value: formatPct(iAnnual),
    });
  } else if (params.inputType === 'discount') {
    const p = params.inputPeriodPerYear;
    const iPeriod = r < 1 ? r / (1 - r) : 0;
    iAnnual = Math.pow(1 + iPeriod, p) - 1;
    steps.push({
      title: 'Paso 1: Convertir tasa de descuento d a tasa de interés efectiva i',
      formula: `i = d / (1 − d) = ${r.toFixed(6)} / (1 − ${r.toFixed(6)})`,
      value: formatPct(iPeriod),
    });
    if (p !== 1) {
      steps.push({
        title: 'Paso 2: Tasa efectiva anual equivalente',
        formula: `i_a = (1 + ${iPeriod.toFixed(6)})^${p} − 1`,
        value: formatPct(iAnnual),
      });
    }
  } else {
    // Force of interest delta (annual)
    iAnnual = Math.exp(r) - 1;
    steps.push({
      title: 'Paso 1: Relación entre fuerza de interés δ y tasa efectiva anual',
      formula: `1 + i_a = e^δ  ⇒  i_a = e^(${r.toFixed(6)}) − 1`,
      value: formatPct(iAnnual),
    });
  }

  const targetP = params.targetPeriodPerYear;
  const targetEffective = Math.pow(1 + iAnnual, 1 / targetP) - 1;
  const targetNominalAnnual = targetEffective * targetP;
  const effectiveDiscount = targetEffective / (1 + targetEffective);
  const forceOfInterest = Math.log(1 + iAnnual);

  steps.push({
    title: 'Paso final: Tasa efectiva para el periodo de tus pagos',
    formula: `i_pago = (1 + ${iAnnual.toFixed(6)})^(1/${targetP}) − 1`,
    value: formatPct(targetEffective),
  });

  return {
    effectiveAnnual: iAnnual,
    targetEffective,
    targetNominalAnnual,
    effectiveDiscount,
    forceOfInterest,
    steps,
  };
}

/** Amortization & Sinking Fund tables */
export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export function buildAmortizationSchedule(
  debt: number,
  rate: number,
  n: number,
  isDue = false
): {
  payment: number;
  rows: AmortizationRow[];
  totalPaid: number;
  totalInterest: number;
} {
  const safeN = Math.max(1, Math.min(120, Math.round(n)));
  const factor = isDue ? aDueAngle(safeN, rate) : aAngle(safeN, rate);
  const payment = factor > 0 ? debt / factor : 0;

  const rows: AmortizationRow[] = [];
  let balance = debt;
  let cumInt = 0;
  let cumPrin = 0;

  if (isDue) {
    // Period 0 payment goes 100% to principal
    for (let t = 0; t < safeN; t++) {
      const interest = t === 0 ? 0 : balance * rate;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      cumInt += interest;
      cumPrin += principal;
      rows.push({
        period: t,
        payment,
        interest,
        principal,
        balance: Math.abs(balance) < 1e-4 ? 0 : balance,
        cumulativeInterest: cumInt,
        cumulativePrincipal: cumPrin,
      });
    }
  } else {
    for (let t = 1; t <= safeN; t++) {
      const interest = balance * rate;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      cumInt += interest;
      cumPrin += principal;
      rows.push({
        period: t,
        payment,
        interest,
        principal,
        balance: Math.abs(balance) < 1e-4 ? 0 : balance,
        cumulativeInterest: cumInt,
        cumulativePrincipal: cumPrin,
      });
    }
  }

  return {
    payment,
    rows,
    totalPaid: payment * safeN,
    totalInterest: cumInt,
  };
}

export interface SinkingFundRow {
  period: number;
  deposit: number;
  interest: number;
  increment: number;
  fundBalance: number;
}

export function buildSinkingFundSchedule(
  targetAmount: number,
  rate: number,
  n: number
): {
  deposit: number;
  rows: SinkingFundRow[];
  totalDeposited: number;
  totalInterestEarned: number;
} {
  const safeN = Math.max(1, Math.min(120, Math.round(n)));
  const factor = sAngle(safeN, rate);
  const deposit = factor > 0 ? targetAmount / factor : 0;

  const rows: SinkingFundRow[] = [];
  let fund = 0;
  let totalInt = 0;

  for (let t = 1; t <= safeN; t++) {
    const interest = fund * rate;
    const increment = deposit + interest;
    fund += increment;
    totalInt += interest;
    rows.push({
      period: t,
      deposit,
      interest,
      increment,
      fundBalance: fund,
    });
  }

  return {
    deposit,
    rows,
    totalDeposited: deposit * safeN,
    totalInterestEarned: totalInt,
  };
}

/** Linear Interpolation Lab (UDLAP 5-step method for finding unknown rate i) */
export interface InterpolationAnalysis {
  targetRatio: number; // VP/P or VF/P
  approxStartRate: number; // UDLAP starting guess formula
  exactRate: number; // Newton-Raphson ground truth
  valAtA: number;
  valAtB: number;
  interpolatedRate: number;
  errorBps: number;
  bracketsTarget: boolean;
}

export function computeInterpolation(
  mode: 'vp' | 'vf',
  payment: number,
  targetValue: number,
  n: number,
  rateA: number,
  rateB: number
): InterpolationAnalysis {
  const targetRatio = payment > 0 ? targetValue / payment : 0;

  // UDLAP starting approximation from Anualidades_Prim21 slides:
  // VP: i ≈ 2(n - VP/P) / ((VP/P)(n+1))
  // VF: i ≈ 2(VF/P - n) / (n(n-1))
  const approxStartRate =
    mode === 'vp'
      ? Math.max(0.0005, (2 * (n - targetRatio)) / (Math.max(0.001, targetRatio) * (n + 1)))
      : Math.max(0.0005, (2 * (targetRatio - n)) / Math.max(1, n * (n - 1)));

  const evalFn = (r: number) => (mode === 'vp' ? aAngle(n, r) : sAngle(n, r));

  // Find true rate via bisection in [0.00001, 2.0]
  let lo = 0.00001;
  let hi = 2.0;
  for (let iter = 0; iter < 80; iter++) {
    const mid = (lo + hi) / 2;
    const fMid = evalFn(mid);
    if (mode === 'vp') {
      // aAngle is strictly decreasing in i
      if (fMid > targetRatio) lo = mid;
      else hi = mid;
    } else {
      // sAngle is strictly increasing in i
      if (fMid < targetRatio) lo = mid;
      else hi = mid;
    }
  }
  const exactRate = (lo + hi) / 2;

  const valAtA = evalFn(rateA);
  const valAtB = evalFn(rateB);

  const bracketsTarget =
    (valAtA >= targetRatio && valAtB <= targetRatio) ||
    (valAtA <= targetRatio && valAtB >= targetRatio);

  const denom = valAtB - valAtA;
  const interpolatedRate =
    Math.abs(denom) > 1e-12
      ? rateA + ((targetRatio - valAtA) / denom) * (rateB - rateA)
      : rateA;

  const errorBps = Math.abs(interpolatedRate - exactRate) * 10000;

  return {
    targetRatio,
    approxStartRate,
    exactRate,
    valAtA,
    valAtB,
    interpolatedRate,
    errorBps,
    bracketsTarget,
  };
}

/** Formatting helpers */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPct(decimalRate: number, digits = 4): string {
  if (!Number.isFinite(decimalRate)) return '—';
  return `${(decimalRate * 100).toFixed(digits)}%`;
}

export function formatNum(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(digits));
  return rounded.toString();
}
