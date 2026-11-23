import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  Layers,
  PiggyBank,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  aAngle,
  aDueAngle,
  buildAmortizationSchedule,
  buildSinkingFundSchedule,
  computeInterpolation,
  formatCurrency,
  formatNum,
  formatPct,
  sAngle,
} from '../lib/financeMath';
import { ActuarialSymbol } from './MathExpr';

type LabTab = 'amortizacion' | 'fondo' | 'interpolacion';

export const AmortizationWorkspace: React.FC = () => {
  const [labTab, setLabTab] = useState<LabTab>('amortizacion');

  // Amortization state
  const [debt, setDebt] = useState<number>(200000);
  const [ratePct, setRatePct] = useState<number>(2.5);
  const [periods, setPeriods] = useState<number>(12);
  const [isDue, setIsDue] = useState<boolean>(false);
  const [selectedK, setSelectedK] = useState<number>(4);

  // Sinking Fund state
  const [fundTarget, setFundTarget] = useState<number>(150000);
  const [fundRatePct, setFundRatePct] = useState<number>(1.5);
  const [fundN, setFundN] = useState<number>(10);

  // Interpolation Lab state (classic UDLAP example: VP=50000, P=6000, n=12)
  const [interpMode, setInterpMode] = useState<'vp' | 'vf'>('vp');
  const [interpTarget, setInterpTarget] = useState<number>(50000);
  const [interpPmt, setInterpPmt] = useState<number>(6000);
  const [interpN, setInterpN] = useState<number>(12);
  const [rateAPct, setRateAPct] = useState<number>(5.0);
  const [rateBPct, setRateBPct] = useState<number>(7.0);

  const amortRate = ratePct / 100;
  const amort = useMemo(
    () => buildAmortizationSchedule(debt, amortRate, periods, isDue),
    [debt, amortRate, periods, isDue]
  );

  const safeK = Math.max(1, Math.min(periods, selectedK));

  // Prospective & Retrospective verification at row k (for vencida)
  const kVerification = useMemo(() => {
    if (isDue) return null;
    const R = amort.payment;
    const remaining = periods - safeK;
    const prospective = R * aAngle(remaining, amortRate);
    const retrospective =
      debt * Math.pow(1 + amortRate, safeK) - R * sAngle(safeK, amortRate);
    const justBefore = R * aDueAngle(remaining + 1, amortRate);
    return { R, remaining, prospective, retrospective, justBefore };
  }, [amort.payment, amortRate, debt, isDue, periods, safeK]);

  const sinking = useMemo(
    () => buildSinkingFundSchedule(fundTarget, fundRatePct / 100, fundN),
    [fundTarget, fundRatePct, fundN]
  );

  const interp = useMemo(
    () =>
      computeInterpolation(
        interpMode,
        interpPmt,
        interpTarget,
        interpN,
        rateAPct / 100,
        rateBPct / 100
      ),
    [interpMode, interpPmt, interpTarget, interpN, rateAPct, rateBPct]
  );

  // Build SVG points for interpolation curve
  const interpSvg = useMemo(() => {
    const W = 680;
    const H = 260;
    const PL = 54;
    const PR = 24;
    const PT = 20;
    const PB = 38;
    const pw = W - PL - PR;
    const ph = H - PT - PB;

    const minR = Math.max(0.002, Math.min(rateAPct, rateBPct, interp.exactRate * 100) / 100 - 0.03);
    const maxR = Math.min(0.4, Math.max(rateAPct, rateBPct, interp.exactRate * 100) / 100 + 0.03);

    const evalFn = (r: number) => (interpMode === 'vp' ? aAngle(interpN, r) : sAngle(interpN, r));
    const samples: { r: number; y: number }[] = [];
    const steps = 48;
    for (let s = 0; s <= steps; s++) {
      const r = minR + (s / steps) * (maxR - minR);
      samples.push({ r, y: evalFn(r) });
    }
    const yVals = [...samples.map((s) => s.y), interp.targetRatio];
    const minY = Math.min(...yVals) * 0.94;
    const maxY = Math.max(...yVals) * 1.06;

    const xOf = (r: number) => PL + ((r - minR) / Math.max(1e-6, maxR - minR)) * pw;
    const yOf = (y: number) => PT + ph - ((y - minY) / Math.max(1e-6, maxY - minY)) * ph;

    const pathD = samples
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${xOf(pt.r).toFixed(1)} ${yOf(pt.y).toFixed(1)}`)
      .join(' ');

    return { W, H, PL, PR, PT, PB, minR, maxR, minY, maxY, xOf, yOf, pathD };
  }, [interp.exactRate, interp.targetRatio, interpMode, interpN, rateAPct, rateBPct]);

  return (
    <div className="space-y-5">
      {/* Header & Lab Selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Amortización, Fondos e Interpolación
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Visualiza cómo baja el interés y sube el abono a capital, comprueba SIₖ y domina la interpolación lineal para hallar i.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'amortizacion', label: 'Tabla de Amortización y SIₖ', icon: TrendingDown },
              { id: 'fondo', label: 'Fondo de Acumulación', icon: PiggyBank },
              { id: 'interpolacion', label: 'Interpolación de Tasa i', icon: ArrowLeftRight },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = labTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setLabTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#94A3B8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= LAB 1: AMORTIZACIÓN + SALDO INSOLUTO ================= */}
      {labTab === 'amortizacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Stage (8 cols): Stacked Bar Chart + Interactive Table */}
          <div className="lg:col-span-8 space-y-4">
            {/* Summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Pago periódico ({isDue ? 'Anticipado' : 'Vencido'})
                </div>
                <div className="font-mono text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
                  {formatCurrency(amort.payment)}
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Intereses totales
                </div>
                <div className="font-mono text-xl font-bold text-[#EA580C] mt-1 tabular-nums">
                  {formatCurrency(amort.totalInterest)}
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Total desembolsado
                </div>
                <div className="font-mono text-xl font-bold text-[#047857] mt-1 tabular-nums">
                  {formatCurrency(amort.totalPaid)}
                </div>
              </div>
            </div>

            {/* Visual Stacked Bar Breakdown: Principal vs Interest per period */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                    Composición de cada pago (haz clic en cualquier barra o fila para inspeccionar SIₖ)
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    El pago P es constante, pero el interés baja cada periodo y el abono a capital crece geométricamente por (1+i).
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#047857] font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />
                    Abono a Capital (ACₜ)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#EA580C] font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#F97316]" />
                    Interés (Iₜ)
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-1.5 h-36 pt-2 px-1 border-b border-[#E2E8F0]">
                {amort.rows.slice(0, 24).map((row) => {
                  const prinPct = amort.payment > 0 ? (row.principal / amort.payment) * 100 : 0;
                  const intPct = amort.payment > 0 ? (row.interest / amort.payment) * 100 : 0;
                  const active = !isDue && row.period === safeK;
                  return (
                    <button
                      key={row.period}
                      onClick={() => !isDue && setSelectedK(row.period)}
                      className={`flex-1 flex flex-col justify-end h-full group cursor-pointer rounded-t transition-opacity ${
                        active ? 'ring-2 ring-[#0F172A] ring-offset-1' : 'opacity-90 hover:opacity-100'
                      }`}
                      title={`Periodo ${row.period}: Interés ${formatCurrency(row.interest)} · Capital ${formatCurrency(row.principal)}`}
                    >
                      <motion.div
                        layout
                        style={{ height: `${intPct}%` }}
                        className="w-full bg-[#FB923C] rounded-t-[2px]"
                      />
                      <motion.div
                        layout
                        style={{ height: `${prinPct}%` }}
                        className="w-full bg-[#10B981]"
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10.5px] font-mono text-[#64748B] mt-1.5 px-1">
                <span>Periodo {amort.rows[0]?.period ?? 1}</span>
                {amort.rows.length > 24 && (
                  <span>Mostrando primeros 24 periodos en gráfica (tabla completa abajo)</span>
                )}
                <span>Periodo {Math.min(24, amort.rows.length)}</span>
              </div>
            </div>

            {/* Interactive Amortization Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Tabla de Amortización (UDLAP: Iₜ = SIₜ₋₁ · i · ACₜ = P − Iₜ)
                </h2>
                <span className="text-xs font-mono text-[#64748B]">{amort.rows.length} periodos</span>
              </div>
              <div className="overflow-x-auto max-h-[340px]">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#475569] sticky top-0 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-semibold">t</th>
                      <th className="py-2.5 px-3 font-semibold">Pago (P)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#C2410C]">Interés (Iₜ)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#047857]">Abono Capital (ACₜ)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#0F172A]">Saldo Insoluto (SIₜ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] font-mono tabular-nums">
                    {!isDue && (
                      <tr className="bg-[#F8FAFC]/60 text-[#64748B]">
                        <td className="py-2 px-3 text-left font-semibold">0</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">
                          {formatCurrency(debt)}
                        </td>
                      </tr>
                    )}
                    {amort.rows.map((row) => {
                      const active = !isDue && row.period === safeK;
                      return (
                        <tr
                          key={row.period}
                          onClick={() => !isDue && setSelectedK(row.period)}
                          className={`transition-colors ${
                            !isDue ? 'cursor-pointer' : ''
                          } ${
                            active
                              ? 'bg-[#FFF7ED] font-semibold'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="py-2 px-3 text-left text-[#0F172A]">{row.period}</td>
                          <td className="py-2 px-3 text-[#334155]">{formatCurrency(row.payment)}</td>
                          <td className="py-2 px-3 text-[#C2410C]">{formatCurrency(row.interest)}</td>
                          <td className="py-2 px-3 text-[#047857]">{formatCurrency(row.principal)}</td>
                          <td className="py-2 px-3 text-[#0F172A] font-semibold">
                            {formatCurrency(row.balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Deck (4 cols): Controls + Prospective vs Retrospective Inspector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
              <div className="space-y-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Parámetros del Préstamo
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setDebt(12000);
                      setRatePct(15);
                      setPeriods(10);
                      setIsDue(false);
                      setSelectedK(4);
                    }}
                    className="px-2 py-1 text-[10.5px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
                  >
                    Diap. pág 8 ($12k, 15%)
                  </button>
                  <button
                    onClick={() => {
                      setDebt(71000);
                      setRatePct(7);
                      setPeriods(32);
                      setIsDue(false);
                      setSelectedK(26);
                    }}
                    className="px-2 py-1 text-[10.5px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
                  >
                    Diap. pág 16 (SI₂₆)
                  </button>
                  <button
                    onClick={() => {
                      setDebt(200000);
                      setRatePct(2.5);
                      setPeriods(48);
                      setIsDue(false);
                      setSelectedK(12);
                    }}
                    className="px-2 py-1 text-[10.5px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
                  >
                    Notas 5 Nov ($200k)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-[#F1F5F9] p-1 rounded-lg">
                <button
                  onClick={() => setIsDue(false)}
                  className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    !isDue ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Vencida (aₙ)
                </button>
                <button
                  onClick={() => setIsDue(true)}
                  className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    isDue ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Anticipada (äₙ)
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="am-debt" className="font-medium text-[#475569]">
                    Deuda inicial (D)
                  </label>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {formatCurrency(debt)}
                  </span>
                </div>
                <input
                  id="am-debt"
                  type="range"
                  min={10000}
                  max={500000}
                  step={5000}
                  value={debt}
                  onChange={(e) => setDebt(Number(e.target.value))}
                  className="cronos-slider w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="am-rate" className="font-medium text-[#475569]">
                    Tasa efectiva por periodo (i)
                  </label>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {ratePct.toFixed(2)}%
                  </span>
                </div>
                <input
                  id="am-rate"
                  type="range"
                  min={0.5}
                  max={20}
                  step={0.25}
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  className="cronos-slider w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="am-n" className="font-medium text-[#475569]">
                    Número de pagos (n)
                  </label>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {periods} periodos
                  </span>
                </div>
                <input
                  id="am-n"
                  type="range"
                  min={3}
                  max={48}
                  step={1}
                  value={periods}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPeriods(next);
                    if (selectedK > next) setSelectedK(next);
                  }}
                  className="cronos-slider w-full"
                />
              </div>
            </div>

            {/* Prospective vs Retrospective Inspector for Row k */}
            {!isDue && kVerification && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#EA580C]" />
                    Inspector en Corte k = {safeK}
                  </h3>
                  <span className="font-mono text-xs text-[#64748B]">
                    Quedan {kVerification.remaining} pagos
                  </span>
                </div>

                <div>
                  <label htmlFor="am-k" className="block text-[11px] text-[#64748B] mb-1">
                    Mover corte k (o haz clic en la tabla):
                  </label>
                  <input
                    id="am-k"
                    type="range"
                    min={1}
                    max={periods}
                    step={1}
                    value={safeK}
                    onChange={(e) => setSelectedK(Number(e.target.value))}
                    className="cronos-slider cronos-slider-ff w-full"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                    <div className="font-semibold text-[#1D4ED8] flex items-center justify-between">
                      <span>Prospectivo (hacia adelante)</span>
                      <span className="font-mono">{formatCurrency(kVerification.prospective)}</span>
                    </div>
                    <div className="text-[#1E3A8A] mt-1 font-mono text-[11px]">
                      P · <ActuarialSymbol type="a" n={kVerification.remaining} /> ={' '}
                      {formatCurrency(kVerification.R)} × {formatNum(aAngle(kVerification.remaining, amortRate), 4)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                    <div className="font-semibold text-[#047857] flex items-center justify-between">
                      <span>Retrospectivo (hacia atrás)</span>
                      <span className="font-mono">{formatCurrency(kVerification.retrospective)}</span>
                    </div>
                    <div className="text-[#065F46] mt-1 font-mono text-[11px]">
                      D(1+i)^{safeK} − P · <ActuarialSymbol type="s" n={safeK} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE]">
                    <div className="font-semibold text-[#6D28D9] flex items-center justify-between">
                      <span>Trampa: JUSTO ANTES (SI{safeK}⁻)</span>
                      <span className="font-mono">{formatCurrency(kVerification.justBefore)}</span>
                    </div>
                    <div className="text-[#4C1D95] mt-1 text-[11px]">
                      P · <ActuarialSymbol type="a_due" n={kVerification.remaining + 1} /> = SI{safeK}⁺ + P (exactamente 1 pago más)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= LAB 2: FONDO DE ACUMULACIÓN ================= */}
      {labTab === 'fondo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Depósito periódico (R = M / sₙ)
                </div>
                <div className="font-mono text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
                  {formatCurrency(sinking.deposit)}
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Aportado de tu bolsillo
                </div>
                <div className="font-mono text-xl font-bold text-[#1D4ED8] mt-1 tabular-nums">
                  {formatCurrency(sinking.totalDeposited)}
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                  Intereses ganados por el fondo
                </div>
                <div className="font-mono text-xl font-bold text-[#047857] mt-1 tabular-nums">
                  {formatCurrency(sinking.totalInterestEarned)}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Tabla de Fondo de Acumulación (Iₜ = Fondoₜ₋₁ · i · Incremento = R + Iₜ)
                </h2>
              </div>
              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#475569] sticky top-0 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-semibold">t</th>
                      <th className="py-2.5 px-3 font-semibold">Depósito (R)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#047857]">Interés ganado (Iₜ)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#1D4ED8]">Incremento total</th>
                      <th className="py-2.5 px-3 font-semibold text-[#0F172A]">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] font-mono tabular-nums">
                    {sinking.rows.map((r) => (
                      <tr key={r.period} className="hover:bg-[#F8FAFC]">
                        <td className="py-2 px-3 text-left font-semibold text-[#0F172A]">{r.period}</td>
                        <td className="py-2 px-3 text-[#334155]">{formatCurrency(r.deposit)}</td>
                        <td className="py-2 px-3 text-[#047857]">{formatCurrency(r.interest)}</td>
                        <td className="py-2 px-3 text-[#1D4ED8]">{formatCurrency(r.increment)}</td>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">
                          {formatCurrency(r.fundBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
            <h2 className="font-display text-sm font-semibold text-[#0F172A]">
              Meta del Fondo de Acumulación
            </h2>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="sf-target" className="font-medium text-[#475569]">
                  Meta a reunir (M)
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  {formatCurrency(fundTarget)}
                </span>
              </div>
              <input
                id="sf-target"
                type="range"
                min={20000}
                max={500000}
                step={5000}
                value={fundTarget}
                onChange={(e) => setFundTarget(Number(e.target.value))}
                className="cronos-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="sf-rate" className="font-medium text-[#475569]">
                  Tasa efectiva del fondo (i)
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  {fundRatePct.toFixed(2)}%
                </span>
              </div>
              <input
                id="sf-rate"
                type="range"
                min={0.25}
                max={15}
                step={0.25}
                value={fundRatePct}
                onChange={(e) => setFundRatePct(Number(e.target.value))}
                className="cronos-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="sf-n" className="font-medium text-[#475569]">
                  Depósitos (n)
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  {fundN} periodos
                </span>
              </div>
              <input
                id="sf-n"
                type="range"
                min={3}
                max={36}
                step={1}
                value={fundN}
                onChange={(e) => setFundN(Number(e.target.value))}
                className="cronos-slider w-full"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] space-y-1">
              <div className="font-semibold text-[#0F172A]">Diferencia clave con Amortización</div>
              <p>
                En <strong>Amortización</strong> usas <ActuarialSymbol type="a" n="n" /> y el saldo baja hasta $0. En{' '}
                <strong>Fondo de Acumulación</strong> usas <ActuarialSymbol type="s" n="n" /> y el saldo sube desde $0 hasta tu meta M.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= LAB 3: INTERPOLACIÓN LINEAL (TASA i) ================= */}
      {labTab === 'interpolacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Interactive Curve */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0F172A]">
                  Gráfica de Interpolación Lineal ({interpMode === 'vp' ? 'aₙ|i = VP/P' : 'sₙ|i = VF/P'})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Acercar tus dos tasas de prueba (i_A y i_B) alrededor del objetivo reduce el error de la recta secante casi a cero.
                </p>
              </div>
              <div className="inline-flex bg-[#F1F5F9] p-1 rounded-lg text-xs">
                <button
                  onClick={() => {
                    setInterpMode('vp');
                    setInterpTarget(50000);
                    setInterpPmt(6000);
                    setInterpN(12);
                    setRateAPct(5);
                    setRateBPct(7);
                  }}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    interpMode === 'vp' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Valor Presente (aₙ)
                </button>
                <button
                  onClick={() => {
                    setInterpMode('vf');
                    setInterpTarget(90000);
                    setInterpPmt(6000);
                    setInterpN(12);
                    setRateAPct(3);
                    setRateBPct(5);
                  }}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    interpMode === 'vf' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Valor Futuro (sₙ)
                </button>
              </div>
            </div>

            {/* Live SVG Curve */}
            <svg
              viewBox={`0 0 ${interpSvg.W} ${interpSvg.H}`}
              className="w-full h-auto block border border-[#F1F5F9] rounded-lg bg-[#FCFDFF]"
            >
              {/* Axes */}
              <line
                x1={interpSvg.PL}
                y1={interpSvg.PT}
                x2={interpSvg.PL}
                y2={interpSvg.H - interpSvg.PB}
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <line
                x1={interpSvg.PL}
                y1={interpSvg.H - interpSvg.PB}
                x2={interpSvg.W - interpSvg.PR}
                y2={interpSvg.H - interpSvg.PB}
                stroke="#94A3B8"
                strokeWidth="1.5"
              />

              {/* Horizontal Target Ratio Line */}
              <line
                x1={interpSvg.PL}
                y1={interpSvg.yOf(interp.targetRatio)}
                x2={interpSvg.W - interpSvg.PR}
                y2={interpSvg.yOf(interp.targetRatio)}
                stroke="#EA580C"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={interpSvg.W - interpSvg.PR - 4}
                y={interpSvg.yOf(interp.targetRatio) - 6}
                textAnchor="end"
                className="font-mono fill-[#EA580C]"
                fontSize="10.5"
                fontWeight="700"
              >
                Objetivo = {formatNum(interp.targetRatio, 4)}
              </text>

              {/* True Nonlinear Curve */}
              <path d={interpSvg.pathD} fill="none" stroke="#1D4ED8" strokeWidth="2.5" />

              {/* Secant Line between A and B */}
              <line
                x1={interpSvg.xOf(rateAPct / 100)}
                y1={interpSvg.yOf(interp.valAtA)}
                x2={interpSvg.xOf(rateBPct / 100)}
                y2={interpSvg.yOf(interp.valAtB)}
                stroke="#047857"
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* Point A */}
              <circle
                cx={interpSvg.xOf(rateAPct / 100)}
                cy={interpSvg.yOf(interp.valAtA)}
                r="5"
                fill="#047857"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={interpSvg.xOf(rateAPct / 100)}
                y={interpSvg.yOf(interp.valAtA) - 10}
                textAnchor="middle"
                className="font-mono fill-[#047857]"
                fontSize="10"
                fontWeight="700"
              >
                A ({rateAPct.toFixed(2)}%)
              </text>

              {/* Point B */}
              <circle
                cx={interpSvg.xOf(rateBPct / 100)}
                cy={interpSvg.yOf(interp.valAtB)}
                r="5"
                fill="#047857"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={interpSvg.xOf(rateBPct / 100)}
                y={interpSvg.yOf(interp.valAtB) + 16}
                textAnchor="middle"
                className="font-mono fill-[#047857]"
                fontSize="10"
                fontWeight="700"
              >
                B ({rateBPct.toFixed(2)}%)
              </text>

              {/* Interpolated Intersection */}
              <circle
                cx={interpSvg.xOf(interp.interpolatedRate)}
                cy={interpSvg.yOf(interp.targetRatio)}
                r="5.5"
                fill="#EA580C"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Axis labels */}
              <text
                x={interpSvg.W / 2}
                y={interpSvg.H - 10}
                textAnchor="middle"
                className="font-sans fill-[#475569]"
                fontSize="11"
                fontWeight="600"
              >
                Tasa efectiva por periodo (i)
              </text>
              <text
                x={16}
                y={interpSvg.H / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${interpSvg.H / 2})`}
                className="font-mono fill-[#475569]"
                fontSize="11"
                fontWeight="600"
              >
                {interpMode === 'vp' ? 'aₙ|i' : 'sₙ|i'}
              </text>
            </svg>

            {/* 5-Step UDLAP Interpolation Output */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[#64748B] font-medium">Aproximación inicial UDLAP</div>
                <div className="font-mono text-base font-bold text-[#1D4ED8] mt-0.5 tabular-nums">
                  i₀ ≈ {formatPct(interp.approxStartRate, 2)}
                </div>
                <div className="font-mono text-[10.5px] text-[#64748B] mt-1">
                  {interpMode === 'vp' ? '2(n − VP/P) / ((VP/P)(n+1))' : '2(VF/P − n) / (n(n−1))'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FFF7ED] border border-[#FDBA74]">
                <div className="text-[#9A3412] font-medium">Tasa interpolada (recta)</div>
                <div className="font-mono text-base font-bold text-[#EA580C] mt-0.5 tabular-nums">
                  i ≈ {formatPct(interp.interpolatedRate, 4)}
                </div>
                <div className="font-mono text-[10.5px] text-[#C2410C] mt-1">
                  Error vs real: {interp.errorBps.toFixed(1)} pb
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                <div className="text-[#065F46] font-medium">Tasa exacta (real)</div>
                <div className="font-mono text-base font-bold text-[#047857] mt-0.5 tabular-nums">
                  i = {formatPct(interp.exactRate, 4)}
                </div>
                <div className="text-[10.5px] text-[#047857] mt-1 flex items-center gap-1">
                  {interp.bracketsTarget ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> A y B encierran el objetivo ✓
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-[#D97706]" /> Ajusta A y B para encerrar
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls for Interpolation */}
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
            <h2 className="font-display text-sm font-semibold text-[#0F172A]">
              Tus Dos Tasas de Prueba (A y B)
            </h2>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-[#64748B] mb-1">
                  {interpMode === 'vp' ? 'Valor Presente (VP)' : 'Valor Futuro (VF)'}
                </label>
                <input
                  type="number"
                  value={interpTarget}
                  onChange={(e) => setInterpTarget(Math.max(100, Number(e.target.value)))}
                  className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-[#64748B] mb-1">Pago (P)</label>
                <input
                  type="number"
                  value={interpPmt}
                  onChange={(e) => setInterpPmt(Math.max(10, Number(e.target.value)))}
                  className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="in-n" className="font-medium text-[#475569]">
                  Número de pagos (n)
                </label>
                <span className="font-mono font-semibold text-[#0F172A]">{interpN}</span>
              </div>
              <input
                id="in-n"
                type="range"
                min={3}
                max={36}
                step={1}
                value={interpN}
                onChange={(e) => setInterpN(Number(e.target.value))}
                className="cronos-slider w-full"
              />
            </div>

            <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="in-a" className="font-medium text-[#047857]">
                    Tasa de prueba A (i_A)
                  </label>
                  <span className="font-mono font-semibold text-[#047857] tabular-nums">
                    {rateAPct.toFixed(2)}% → {formatNum(interp.valAtA, 4)}
                  </span>
                </div>
                <input
                  id="in-a"
                  type="range"
                  min={0.5}
                  max={25}
                  step={0.25}
                  value={rateAPct}
                  onChange={(e) => setRateAPct(Number(e.target.value))}
                  className="cronos-slider w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="in-b" className="font-medium text-[#047857]">
                    Tasa de prueba B (i_B)
                  </label>
                  <span className="font-mono font-semibold text-[#047857] tabular-nums">
                    {rateBPct.toFixed(2)}% → {formatNum(interp.valAtB, 4)}
                  </span>
                </div>
                <input
                  id="in-b"
                  type="range"
                  min={0.5}
                  max={25}
                  step={0.25}
                  value={rateBPct}
                  onChange={(e) => setRateBPct(Number(e.target.value))}
                  className="cronos-slider w-full"
                />
              </div>

              <button
                onClick={() => {
                  const base = Math.max(0.5, Math.round(interp.approxStartRate * 100 * 2) / 2);
                  setRateAPct(Math.max(0.5, base - 0.5));
                  setRateBPct(base + 0.5);
                }}
                className="w-full py-2 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
              >
                Auto-encerrar alrededor de i₀ ({formatPct(interp.approxStartRate, 1)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
