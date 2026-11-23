import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  AnnuityPerspective,
  InterestRegime,
  PERIOD_UNITS,
  RateInputType,
  RateSegment,
  TimelineFlow,
  convertInterestRate,
  formatCurrency,
  formatNum,
  formatPct,
  getPerspectiveInfo,
  recommendFocalDate,
  solveEquationOfValue,
} from '../lib/financeMath';
import { AnimationPhase, TimelineCanvas } from './TimelineCanvas';
import { ActuarialSymbol } from './MathExpr';

interface SandboxPreset {
  id: string;
  label: string;
  description: string;
  maxTime: number;
  ff: number;
  regime: InterestRegime;
  rateInputType: RateInputType;
  ratePercent: number;
  inputPeriodPerYear: number;
  compoundingSubM: number;
  timelinePeriodPerYear: number;
  periodLabel: string;
  useSegments?: boolean;
  segments?: RateSegment[];
  flows: TimelineFlow[];
}

const PRESETS: SandboxPreset[] = [
  {
    id: 'diferida-29oct',
    label: 'Diferida (29 Oct)',
    description: '6 pagos de $450 empezando en t = 4 al 3% mensual efectivo.',
    maxTime: 12,
    ff: 0,
    regime: 'compound',
    rateInputType: 'effective',
    ratePercent: 3,
    inputPeriodPerYear: 12,
    compoundingSubM: 12,
    timelinePeriodPerYear: 12,
    periodLabel: 'meses',
    flows: [
      {
        id: 'f-debt',
        label: 'Deuda D',
        side: 'debt',
        kind: 'single',
        amount: 2230.87,
        isUnknown: true,
        unknownSymbol: 'D',
        startTime: 0,
      },
      {
        id: 'f-ann',
        label: '6 pagos $450',
        side: 'payment',
        kind: 'annuity',
        amount: 450,
        startTime: 4,
        count: 6,
        perspective: 'a',
      },
    ],
  },
  {
    id: 'prestamo-trim',
    label: 'Nominal i⁽⁴⁾=16%',
    description: 'Préstamo $50,000, tasa nominal 16% convertible trimestralmente, 8 pagos desde t=4.',
    maxTime: 12,
    ff: 3,
    regime: 'compound',
    rateInputType: 'nominal_annual',
    ratePercent: 16,
    inputPeriodPerYear: 1,
    compoundingSubM: 4,
    timelinePeriodPerYear: 4,
    periodLabel: 'trimestres',
    flows: [
      { id: 'pt-debt', label: 'Préstamo', side: 'debt', kind: 'single', amount: 50000, startTime: 0 },
      {
        id: 'pt-ann',
        label: '8 pagos R',
        side: 'payment',
        kind: 'annuity',
        amount: 8353.68,
        isUnknown: true,
        unknownSymbol: 'R',
        startTime: 4,
        count: 8,
        perspective: 'a',
      },
    ],
  },
  {
    id: 'tramos-12nov',
    label: 'Por Partes (Tasas cambiantes)',
    description: 'Anualidad en 2 partes con cambio de tasa en t = 6 (1.5% → 2.5% mensual).',
    maxTime: 14,
    ff: 0,
    regime: 'compound',
    rateInputType: 'effective',
    ratePercent: 1.5,
    inputPeriodPerYear: 12,
    compoundingSubM: 12,
    timelinePeriodPerYear: 12,
    periodLabel: 'meses',
    useSegments: true,
    segments: [
      { id: 's-1', start: 0, end: 6, rate: 0.015, label: 'Parte 1: i = 1.5%/mes' },
      { id: 's-2', start: 6, end: 14, rate: 0.025, label: 'Parte 2: i = 2.5%/mes' },
    ],
    flows: [
      {
        id: 'tr-d',
        label: 'Deuda total',
        side: 'debt',
        kind: 'single',
        amount: 20000,
        isUnknown: true,
        unknownSymbol: 'D',
        startTime: 0,
      },
      {
        id: 'tr-p1',
        label: 'Parte 1 (6 pagos)',
        side: 'payment',
        kind: 'annuity',
        amount: 1500,
        startTime: 1,
        count: 6,
        perspective: 'a',
      },
      {
        id: 'tr-p2',
        label: 'Parte 2 (6 pagos)',
        side: 'payment',
        kind: 'annuity',
        amount: 2200,
        startTime: 7,
        count: 6,
        perspective: 'a',
      },
    ],
  },
  {
    id: 'asesorias-p1',
    label: 'Asesorías (Depósitos/Retiros)',
    description: '3 depósitos en t=0, 5, 10 para 3 retiros de $20,000 en t=14, 18, 22 al 2% mensual.',
    maxTime: 24,
    ff: 0,
    regime: 'compound',
    rateInputType: 'effective',
    ratePercent: 2,
    inputPeriodPerYear: 12,
    compoundingSubM: 12,
    timelinePeriodPerYear: 12,
    periodLabel: 'meses',
    flows: [
      { id: 'as-d1', label: 'Depósito 1 (X)', side: 'debt', kind: 'single', amount: 15442.48, isUnknown: true, unknownSymbol: 'X', startTime: 0 },
      { id: 'as-d2', label: 'Depósito 2 (X)', side: 'debt', kind: 'single', amount: 15442.48, isUnknown: true, unknownSymbol: 'X', startTime: 5 },
      { id: 'as-d3', label: 'Depósito 3 (X)', side: 'debt', kind: 'single', amount: 15442.48, isUnknown: true, unknownSymbol: 'X', startTime: 10 },
      { id: 'as-r1', label: 'Retiro 1', side: 'payment', kind: 'single', amount: 20000, startTime: 14 },
      { id: 'as-r2', label: 'Retiro 2', side: 'payment', kind: 'single', amount: 20000, startTime: 18 },
      { id: 'as-r3', label: 'Retiro 3', side: 'payment', kind: 'single', amount: 20000, startTime: 22 },
    ],
  },
  {
    id: 'simple-vs-comp',
    label: 'Simple vs Compuesto',
    description: 'Mueve la Fecha Focal en Interés Simple y mira cómo cambia X.',
    maxTime: 10,
    ff: 9,
    regime: 'simple',
    rateInputType: 'effective',
    ratePercent: 2,
    inputPeriodPerYear: 12,
    compoundingSubM: 12,
    timelinePeriodPerYear: 12,
    periodLabel: 'meses',
    flows: [
      { id: 'sc-d1', label: 'Deuda', side: 'debt', kind: 'single', amount: 10000, startTime: 6 },
      { id: 'sc-p1', label: 'Abono', side: 'payment', kind: 'single', amount: 4000, startTime: 2 },
      { id: 'sc-x', label: 'Liquidación', side: 'payment', kind: 'single', amount: 6040, isUnknown: true, unknownSymbol: 'X', startTime: 9 },
    ],
  },
  {
    id: 'blank',
    label: 'En blanco (Tu problema)',
    description: 'Empieza limpio con 1 deuda y 1 anualidad para escribir tu propio ejercicio.',
    maxTime: 12,
    ff: 0,
    regime: 'compound',
    rateInputType: 'nominal_annual',
    ratePercent: 12,
    inputPeriodPerYear: 1,
    compoundingSubM: 12,
    timelinePeriodPerYear: 12,
    periodLabel: 'meses',
    flows: [
      { id: 'bl-d', label: 'Mi deuda', side: 'debt', kind: 'single', amount: 10000, startTime: 0 },
      { id: 'bl-p', label: 'Mis pagos', side: 'payment', kind: 'annuity', amount: 1000, isUnknown: true, unknownSymbol: 'R', startTime: 1, count: 12, perspective: 'a' },
    ],
  },
];

const PERSPECTIVES: { id: AnnuityPerspective; label: string; where: string }[] = [
  { id: 'a', label: 'VP Vencida', where: '1 antes del 1ro' },
  { id: 'a_due', label: 'VP Anticipada', where: 'En el 1er pago' },
  { id: 's', label: 'VF Vencida', where: 'En el último' },
  { id: 's_due', label: 'VF Anticipada', where: '1 después del último' },
];

interface SandboxWorkspaceProps {
  initialPresetId?: string;
}

export const SandboxWorkspace: React.FC<SandboxWorkspaceProps> = ({ initialPresetId }) => {
  const [activePresetId, setActivePresetId] = useState<string>(PRESETS[0].id);
  const [maxTime, setMaxTime] = useState<number>(PRESETS[0].maxTime);
  const [focalDate, setFocalDate] = useState<number>(PRESETS[0].ff);
  const [regime, setRegime] = useState<InterestRegime>(PRESETS[0].regime);

  // Full student-friendly rate configuration (effective, nominal annual, nominal non-annual, discount, force)
  const [rateInputType, setRateInputType] = useState<RateInputType>(PRESETS[0].rateInputType);
  const [ratePercent, setRatePercent] = useState<number>(PRESETS[0].ratePercent);
  const [inputPeriodPerYear, setInputPeriodPerYear] = useState<number>(PRESETS[0].inputPeriodPerYear);
  const [compoundingSubM, setCompoundingSubM] = useState<number>(PRESETS[0].compoundingSubM);
  const [timelinePeriodPerYear, setTimelinePeriodPerYear] = useState<number>(
    PRESETS[0].timelinePeriodPerYear
  );
  const [periodLabel, setPeriodLabel] = useState<string>(PRESETS[0].periodLabel);

  // Piecewise / multi-rate segments support
  const [useSegments, setUseSegments] = useState<boolean>(false);
  const [segments, setSegments] = useState<RateSegment[]>([
    { id: 's-1', start: 0, end: 6, rate: 0.015, label: 'Parte 1: 1.5%' },
    { id: 's-2', start: 6, end: 12, rate: 0.025, label: 'Parte 2: 2.5%' },
  ]);

  const [flows, setFlows] = useState<TimelineFlow[]>(PRESETS[0].flows);
  const [phase, setPhase] = useState<AnimationPhase>('all');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState<boolean>(false);

  const loadPreset = (preset: SandboxPreset) => {
    setActivePresetId(preset.id);
    setMaxTime(preset.maxTime);
    setFocalDate(preset.ff);
    setRegime(preset.regime);
    setRateInputType(preset.rateInputType);
    setRatePercent(preset.ratePercent);
    setInputPeriodPerYear(preset.inputPeriodPerYear);
    setCompoundingSubM(preset.compoundingSubM);
    setTimelinePeriodPerYear(preset.timelinePeriodPerYear);
    setPeriodLabel(preset.periodLabel);
    setUseSegments(Boolean(preset.useSegments));
    if (preset.segments) {
      setSegments(preset.segments.map((s) => ({ ...s })));
    }
    setFlows(preset.flows.map((f) => ({ ...f })));
    setSelectedFlowId(null);
    setPhase('all');
  };

  useEffect(() => {
    if (initialPresetId) {
      const match = PRESETS.find((p) => p.id === initialPresetId);
      if (match) loadPreset(match);
    }
  }, [initialPresetId]);

  // Compute effective rate per timeline period from whatever rate the student typed
  const rateConversion = useMemo(() => {
    if (regime === 'simple') {
      const rPerPeriod =
        rateInputType === 'nominal_annual'
          ? (ratePercent / 100) / Math.max(1, timelinePeriodPerYear)
          : ratePercent / 100;
      return {
        effectivePerPeriod: rPerPeriod,
        note:
          rateInputType === 'nominal_annual'
            ? `Simple proporcional: ${ratePercent}% / ${timelinePeriodPerYear} = ${formatPct(rPerPeriod, 4)}`
            : `Simple directa por periodo: ${formatPct(rPerPeriod, 4)}`,
      };
    }

    if (regime === 'force') {
      const deltaPeriod = (ratePercent / 100) / Math.max(1, timelinePeriodPerYear);
      return {
        effectivePerPeriod: deltaPeriod,
        note: `δ por ${periodLabel}: ${ratePercent}% / ${timelinePeriodPerYear} = ${formatPct(deltaPeriod, 4)}`,
      };
    }

    const res = convertInterestRate({
      inputType: rateInputType,
      ratePercent,
      inputPeriodPerYear,
      compoundingPerInputPeriod: compoundingSubM,
      targetPeriodPerYear: timelinePeriodPerYear,
    });
    const lastStep = res.steps[res.steps.length - 1];
    return {
      effectivePerPeriod: res.targetEffective,
      note: `${res.steps[0]?.formula || ''} → i efectiva = ${formatPct(res.targetEffective, 4)} (${lastStep?.formula || ''})`,
    };
  }, [
    regime,
    rateInputType,
    ratePercent,
    inputPeriodPerYear,
    compoundingSubM,
    timelinePeriodPerYear,
    periodLabel,
  ]);

  const activeSegments = useSegments && regime === 'compound' ? segments : undefined;

  const solution = useMemo(
    () =>
      solveEquationOfValue(
        flows,
        focalDate,
        rateConversion.effectivePerPeriod,
        regime,
        activeSegments
      ),
    [flows, focalDate, rateConversion.effectivePerPeriod, regime, activeSegments]
  );

  const simpleRefAtZero = useMemo(() => {
    if (regime !== 'simple') return null;
    return solveEquationOfValue(flows, 0, rateConversion.effectivePerPeriod, 'simple');
  }, [flows, rateConversion.effectivePerPeriod, regime]);

  const recommendation = useMemo(() => recommendFocalDate(flows, regime), [flows, regime]);

  const firstAnnuity = flows.find((f) => f.kind === 'annuity' || f.kind === 'perpetuity');

  const handleGlobalPerspective = (p: AnnuityPerspective) => {
    setFlows((prev) =>
      prev.map((f) => {
        if (f.kind === 'annuity') return { ...f, perspective: p };
        if (f.kind === 'perpetuity') {
          return { ...f, perspective: p === 'a_due' || p === 's_due' ? 'a_due' : 'a' };
        }
        return f;
      })
    );
  };

  const replayAnimation = () => {
    setPhase('flows');
    window.setTimeout(() => setPhase('landing'), 520);
    window.setTimeout(() => setPhase('all'), 1120);
  };

  const updateFlow = (id: string, patch: Partial<TimelineFlow>) => {
    setFlows((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return { ...f, ...patch };
      })
    );
  };

  const addFlow = (kind: 'single' | 'annuity' | 'perpetuity') => {
    const newId = `flow-${Date.now()}`;
    const hasUnknown = flows.some((f) => f.isUnknown);
    const lastAnnuity = [...flows].reverse().find((f) => f.kind === 'annuity');
    const suggestedStart = lastAnnuity
      ? Math.min(maxTime, lastAnnuity.startTime + (lastAnnuity.count || 1))
      : 1;

    const newFlow: TimelineFlow =
      kind === 'single'
        ? {
            id: newId,
            label: 'Pago / flujo puntual',
            side: 'payment',
            kind: 'single',
            amount: 5000,
            isUnknown: !hasUnknown,
            unknownSymbol: !hasUnknown ? 'X' : undefined,
            startTime: Math.min(maxTime, suggestedStart),
          }
        : kind === 'perpetuity'
          ? {
              id: newId,
              label: 'Perpetuidad',
              side: 'payment',
              kind: 'perpetuity',
              amount: 2000,
              startTime: 1,
              perspective: 'a',
            }
          : {
              id: newId,
              label: `Anualidad parte ${flows.filter((f) => f.kind === 'annuity').length + 1}`,
              side: 'payment',
              kind: 'annuity',
              amount: 1500,
              isUnknown: !hasUnknown,
              unknownSymbol: !hasUnknown ? 'R' : undefined,
              startTime: suggestedStart,
              count: Math.min(6, Math.max(2, maxTime - suggestedStart + 1)),
              perspective: 'a',
            };
    setFlows((prev) => [...prev, newFlow]);
    setSelectedFlowId(newId);
  };

  const deleteFlow = (id: string) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
    if (selectedFlowId === id) setSelectedFlowId(null);
  };

  const addSegment = () => {
    const lastEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
    const nextEnd = Math.min(maxTime, lastEnd + 6);
    setSegments((prev) => [
      ...prev,
      {
        id: `seg-${Date.now()}`,
        start: lastEnd,
        end: Math.max(lastEnd + 1, nextEnd),
        rate: 0.02,
        label: `Parte ${prev.length + 1}: 2%`,
      },
    ]);
  };

  const updateSegment = (id: string, patch: Partial<RateSegment>) => {
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...patch };
        return {
          ...merged,
          label: `t=${merged.start}..${merged.end}: ${formatPct(merged.rate, 2)}`,
        };
      })
    );
  };

  const deleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Clear 3-step onboarding header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Constructor Interactivo de Líneas de Tiempo
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            <strong>Paso 1:</strong> Escribe tu tasa (efectiva o nominal/convertible) ·{' '}
            <strong>Paso 2:</strong> Agrega deudas, pagos o anualidades por partes ·{' '}
            <strong>Paso 3:</strong> Arrastra la Fecha Focal naranja.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#94A3B8] hover:text-[#0F172A]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Zone Educational Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT ZONE (8 cols): Interactive Stage + Live Equation */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
            {/* Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mr-1">
                  Ver por pasos:
                </span>
                {(
                  [
                    { id: 'flows', label: '1. Solo flujos' },
                    { id: 'landing', label: '2. Dónde cae anualidad' },
                    { id: 'all', label: '3. Viaje a FF' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPhase(item.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                      phase === item.id
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={replayAnimation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#EA580C] bg-[#FFF7ED] border border-[#FDBA74] rounded hover:bg-[#FFEDD5] transition-colors cursor-pointer ml-1"
                >
                  <Play className="w-3 h-3" />
                  Animar
                </button>
              </div>

              <button
                onClick={() => setShowAdvisor((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] rounded hover:bg-[#DBEAFE] transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                ¿Qué Fecha Focal me conviene?
              </button>
            </div>

            {showAdvisor && (
              <div className="mb-3 p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#1E3A8A] space-y-1 max-w-xl">
                  <div className="font-semibold flex items-center gap-1.5 text-[#1D4ED8]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recomendación para este problema: FF = {recommendation.recommendedFF}
                  </div>
                  <p>{recommendation.reason}</p>
                  {recommendation.alternativeReason && (
                    <p className="text-[#3B82F6]">{recommendation.alternativeReason}</p>
                  )}
                </div>
                <button
                  onClick={() => setFocalDate(recommendation.recommendedFF)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#1D4ED8] text-white rounded hover:bg-[#1E40AF] transition-colors cursor-pointer shrink-0"
                >
                  Mover a FF = {recommendation.recommendedFF}
                </button>
              </div>
            )}

            {/* 4 Perspectives Switcher */}
            {firstAnnuity && regime !== 'simple' && (
              <div className="mb-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    Cambia la fórmula de tus anualidades (las 4 dan el mismo resultado):
                  </span>
                  <span className="text-[11px] font-mono text-[#6D28D9]">
                    {getPerspectiveInfo(firstAnnuity.perspective || 'a').landingRule}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERSPECTIVES.map((p) => {
                    const disabled =
                      firstAnnuity.kind === 'perpetuity' && (p.id === 's' || p.id === 's_due');
                    const isActive = (firstAnnuity.perspective || 'a') === p.id;
                    return (
                      <button
                        key={p.id}
                        disabled={disabled}
                        onClick={() => handleGlobalPerspective(p.id)}
                        className={`text-left px-2.5 py-2 rounded-md border transition-colors ${
                          disabled
                            ? 'opacity-40 cursor-not-allowed bg-white border-[#E2E8F0]'
                            : isActive
                              ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#4C1D95] cursor-pointer'
                              : 'bg-white border-[#E2E8F0] hover:border-[#C4B5FD] text-[#334155] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <ActuarialSymbol
                            type={p.id}
                            n={firstAnnuity.kind === 'perpetuity' ? '∞' : firstAnnuity.count || 'n'}
                            className="text-base"
                          />
                          <span className="text-[10.5px] font-medium">{p.label}</span>
                        </div>
                        <div className="text-[10.5px] text-[#64748B] mt-0.5">{p.where}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <TimelineCanvas
              maxTime={maxTime}
              focalDate={focalDate}
              onFocalDateChange={setFocalDate}
              evaluatedFlows={solution.evaluated}
              periodLabel={periodLabel}
              rate={rateConversion.effectivePerPeriod}
              regime={regime}
              segments={activeSegments}
              phase={phase}
              highlightFlowId={selectedFlowId}
              onSelectFlow={(id) => setSelectedFlowId((cur) => (cur === id ? null : id))}
            />

            {/* Precision Fecha Focal Slider */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="ff-slider"
                className="text-xs font-semibold text-[#EA580C] whitespace-nowrap font-mono tabular-nums"
              >
                Fecha Focal (FF): t = {focalDate} {periodLabel}
              </label>
              <input
                id="ff-slider"
                type="range"
                min={0}
                max={maxTime}
                step={1}
                value={focalDate}
                onChange={(e) => setFocalDate(Number(e.target.value))}
                className="cronos-slider cronos-slider-ff flex-1"
              />
              <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
                0 — {maxTime}
              </span>
            </div>
          </div>

          {/* Live Ecuación de Valor */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0F172A]">
                  Ecuación de Valor en FF = {focalDate}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Regla de tus notas:{' '}
                  <span className="font-medium text-[#0F172A]">
                    Deudas / Depósitos (↑) = Pagos / Retiros (↓)
                  </span>
                </p>
              </div>
              {solution.unknownFlow && solution.solvedUnknownValue !== undefined && (
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                    {solution.unknownCount > 1
                      ? `Resultado despejado (${solution.unknownCount} flujos iguales)`
                      : 'Resultado despejado'}
                  </div>
                  <div className="font-mono text-xl font-bold text-[#EA580C] tabular-nums">
                    {solution.unknownFlow.flow.unknownSymbol || 'X'} ={' '}
                    {formatCurrency(solution.solvedUnknownValue)}
                  </div>
                </div>
              )}
            </div>

            {regime === 'simple' &&
              simpleRefAtZero?.solvedUnknownValue !== undefined &&
              solution.solvedUnknownValue !== undefined &&
              Math.abs(simpleRefAtZero.solvedUnknownValue - solution.solvedUnknownValue) > 0.01 && (
                <div className="mb-3 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  <div>
                    <span className="font-semibold">¡Ojo en Interés Simple!</span> Con{' '}
                    <span className="font-mono font-semibold">FF = {focalDate}</span> sale{' '}
                    <span className="font-mono font-semibold">
                      {formatCurrency(solution.solvedUnknownValue)}
                    </span>
                    , pero en <span className="font-mono font-semibold">FF = 0</span> da{' '}
                    <span className="font-mono font-semibold">
                      {formatCurrency(simpleRefAtZero.solvedUnknownValue)}
                    </span>
                    . Cambia a <strong>Compuesto</strong> para ver cómo deja de depender de la FF.
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['debt', 'payment'] as const).map((side) => {
                const items = solution.evaluated.filter((e) => e.flow.side === side);
                return (
                  <div key={side} className="border border-[#E2E8F0] rounded-lg p-3 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {side === 'debt' ? 'Deudas / Depósitos (↑)' : 'Pagos / Retiros (↓)'}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
                        {items.length} {items.length === 1 ? 'flujo' : 'flujos'}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs text-[#94A3B8] py-2">Sin flujos de este lado.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((ev) => (
                          <li
                            key={ev.flow.id}
                            className="flex items-center justify-between gap-2 text-xs bg-white border border-[#E2E8F0] rounded px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-[#0F172A] truncate">
                                {ev.flow.label || 'Flujo'}
                              </div>
                              <div className="font-mono text-[11px] text-[#475569] flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>{ev.formulaLabel}</span>
                                {ev.direction !== 'at_ff' && (
                                  <span
                                    className={
                                      ev.direction === 'forward'
                                        ? 'text-[#047857] font-semibold inline-flex items-center gap-0.5'
                                        : 'text-[#1D4ED8] font-semibold inline-flex items-center gap-0.5'
                                    }
                                  >
                                    {ev.direction === 'forward' ? (
                                      <ArrowRight className="w-3 h-3" />
                                    ) : (
                                      <ArrowLeft className="w-3 h-3" />
                                    )}
                                    {ev.moveFormulaLabel}
                                  </span>
                                )}
                                {ev.direction === 'at_ff' && (
                                  <span className="text-[#6D28D9] font-semibold inline-flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> en FF
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums shrink-0">
                              {ev.flow.isUnknown ? (
                                <span className="text-[#EA580C] font-semibold">
                                  {formatNum(ev.totalFactor, 4)} · {ev.flow.unknownSymbol || 'X'}
                                </span>
                              ) : (
                                <span className="font-semibold text-[#0F172A]">
                                  {formatCurrency(ev.valueAtFF)}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT ZONE (4 cols): Real Rate Builder + Piecewise Segments + Flows Editor */}
        <div className="lg:col-span-4 space-y-4">
          {/* STEP A: Rate & Regime Card (write your exact problem rate!) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                A. Escribe la Tasa de tu Problema
              </h2>
              <button
                onClick={() => {
                  const found = PRESETS.find((p) => p.id === activePresetId) || PRESETS[0];
                  loadPreset(found);
                }}
                className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>

            {/* Regime toggle */}
            <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded-lg">
              {(
                [
                  { id: 'compound', label: 'Compuesto' },
                  { id: 'simple', label: 'Simple' },
                  { id: 'force', label: 'Fuerza δ' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRegime(r.id);
                    if (r.id === 'force') setRateInputType('force');
                    else if (rateInputType === 'force') setRateInputType('effective');
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    regime === r.id
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Single Rate vs Piecewise Segments switch (compound only) */}
            {regime === 'compound' && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs font-medium text-[#475569] inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#6D28D9]" />
                  ¿Cambia la tasa por partes?
                </span>
                <button
                  onClick={() => setUseSegments((v) => !v)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded border cursor-pointer transition-colors ${
                    useSegments
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]'
                  }`}
                >
                  {useSegments ? 'Sí · Tasas por tramos' : 'No · Tasa única'}
                </button>
              </div>
            )}

            {/* Single rate detailed builder */}
            {!useSegments ? (
              <div className="space-y-3 text-xs">
                {regime === 'compound' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">
                      ¿Cómo te dan la tasa en el enunciado?
                    </label>
                    <select
                      value={rateInputType}
                      onChange={(e) => setRateInputType(e.target.value as RateInputType)}
                      className="w-full px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="effective">Efectiva (ej. 3% mensual o 12% anual)</option>
                      <option value="nominal_annual">
                        Nominal anual convertible i⁽ᵐ⁾ (ej. 16% anual cap. trimestral)
                      </option>
                      <option value="nominal_custom">
                        Nominal NO anual (ej. 8% semestral cap. mensual i_s⁽⁶⁾)
                      </option>
                      <option value="discount">Tasa de descuento efectivo (d)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">
                      Tasa (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.25}
                      value={ratePercent}
                      onChange={(e) => setRatePercent(Math.max(0, Number(e.target.value)))}
                      className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">
                      Unidad de tu línea
                    </label>
                    <select
                      value={timelinePeriodPerYear}
                      onChange={(e) => {
                        const perY = Number(e.target.value);
                        setTimelinePeriodPerYear(perY);
                        const found = PERIOD_UNITS.find((u) => u.perYear === perY);
                        if (found) setPeriodLabel(found.plural);
                      }}
                      className="w-full px-2 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      {PERIOD_UNITS.filter((u) => u.perYear <= 52).map((u) => (
                        <option key={u.id} value={u.perYear}>
                          {u.plural}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {regime === 'compound' &&
                  (rateInputType === 'effective' ||
                    rateInputType === 'discount' ||
                    rateInputType === 'nominal_custom') && (
                    <div>
                      <label className="block text-[11px] font-medium text-[#475569] mb-1">
                        Periodo de la tasa que escribiste
                      </label>
                      <select
                        value={inputPeriodPerYear}
                        onChange={(e) => setInputPeriodPerYear(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                      >
                        {PERIOD_UNITS.filter((u) => u.perYear <= 52).map((u) => (
                          <option key={u.id} value={u.perYear}>
                            {u.label} ({u.perYear}/año)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {regime === 'compound' &&
                  (rateInputType === 'nominal_annual' || rateInputType === 'nominal_custom') && (
                    <div>
                      <label className="block text-[11px] font-medium text-[#475569] mb-1">
                        {rateInputType === 'nominal_annual'
                          ? 'Capitalizable m veces al año (ej. 12 mensual, 4 trimestral)'
                          : 'Sub-periodos dentro del periodo cotizado (ej. 6 meses/sem)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={360}
                        value={compoundingSubM}
                        onChange={(e) => setCompoundingSubM(Math.max(1, Number(e.target.value)))}
                        className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                      />
                    </div>
                  )}

                {/* Live converted effective rate feedback */}
                <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1E3A8A]">
                  <div className="font-semibold text-[#1D4ED8] flex items-center justify-between">
                    <span>Tasa efectiva aplicada en la línea:</span>
                    <span className="font-mono text-xs">
                      {formatPct(rateConversion.effectivePerPeriod, 4)}
                    </span>
                  </div>
                  <div className="font-mono text-[10.5px] text-[#3B82F6] mt-0.5 truncate" title={rateConversion.note}>
                    {rateConversion.note}
                  </div>
                </div>
              </div>
            ) : (
              /* Piecewise rate segments editor */
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Define cada tramo de tiempo y su tasa efectiva por periodo:
                  </span>
                  <button
                    onClick={addSegment}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] rounded cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tramo
                  </button>
                </div>
                {segments.map((seg, i) => (
                  <div
                    key={seg.id}
                    className="grid grid-cols-12 gap-1.5 items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2"
                  >
                    <span className="col-span-2 font-mono text-[10.5px] font-semibold text-[#6D28D9]">
                      P{i + 1}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={maxTime}
                      value={seg.start}
                      onChange={(e) => updateSegment(seg.id, { start: Number(e.target.value) })}
                      className="col-span-3 font-mono text-[11px] px-1.5 py-1 rounded border border-[#CBD5E1] bg-white"
                      title="Inicio del tramo"
                    />
                    <input
                      type="number"
                      min={1}
                      max={maxTime}
                      value={seg.end}
                      onChange={(e) => updateSegment(seg.id, { end: Number(e.target.value) })}
                      className="col-span-3 font-mono text-[11px] px-1.5 py-1 rounded border border-[#CBD5E1] bg-white"
                      title="Fin del tramo"
                    />
                    <input
                      type="number"
                      step={0.1}
                      value={Number((seg.rate * 100).toFixed(3))}
                      onChange={(e) =>
                        updateSegment(seg.id, { rate: Math.max(0, Number(e.target.value)) / 100 })
                      }
                      className="col-span-3 font-mono text-[11px] px-1.5 py-1 rounded border border-[#CBD5E1] bg-white"
                      title="Tasa % por periodo"
                    />
                    <button
                      onClick={() => deleteSegment(seg.id)}
                      className="col-span-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer flex justify-center"
                      title="Quitar tramo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Horizon Slider */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="sandbox-horizon" className="font-medium text-[#475569]">
                  Largo de la línea de tiempo
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  {maxTime} {periodLabel}
                </span>
              </div>
              <input
                id="sandbox-horizon"
                type="range"
                min={6}
                max={60}
                step={1}
                value={maxTime}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMaxTime(next);
                  if (focalDate > next) setFocalDate(next);
                }}
                className="cronos-slider w-full"
              />
            </div>
          </div>

          {/* STEP B: Flows & Piecewise Annuities Editor */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                B. Tus Flujos / Anualidades por Partes
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addFlow('single')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] text-[#0F172A] cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Puntual
                </button>
                <button
                  onClick={() => addFlow('annuity')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#F5F3FF] border border-[#C4B5FD] rounded hover:border-[#6D28D9] text-[#4C1D95] cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Parte/Anualidad
                </button>
                <button
                  onClick={() => addFlow('perpetuity')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] text-[#0F172A] cursor-pointer"
                  title="Agregar perpetuidad (∞)"
                >
                  <Plus className="w-3 h-3" /> ∞
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
              {flows.map((flow) => {
                const isSelected = selectedFlowId === flow.id;
                return (
                  <div
                    key={flow.id}
                    onClick={() => setSelectedFlowId(flow.id)}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-[#0F172A] bg-[#F8FAFC]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <input
                        type="text"
                        value={flow.label}
                        onChange={(e) => updateFlow(flow.id, { label: e.target.value })}
                        className="text-xs font-semibold text-[#0F172A] bg-transparent border-b border-transparent focus:border-[#94A3B8] focus:outline-none w-36"
                        aria-label="Nombre del flujo"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFlow(flow.id, {
                              side: flow.side === 'debt' ? 'payment' : 'debt',
                            });
                          }}
                          className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded border border-[#CBD5E1] bg-white text-[#334155] cursor-pointer"
                        >
                          {flow.side === 'debt' ? '↑ Arriba' : '↓ Abajo'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFlow(flow.id);
                          }}
                          className="text-[#94A3B8] hover:text-[#DC2626] p-0.5 cursor-pointer"
                          title="Eliminar flujo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10.5px] text-[#64748B] mb-0.5">
                          {flow.isUnknown ? 'Incógnita' : 'Monto ($)'}
                        </label>
                        {flow.isUnknown ? (
                          <input
                            type="text"
                            value={flow.unknownSymbol || 'X'}
                            onChange={(e) =>
                              updateFlow(flow.id, { unknownSymbol: e.target.value || 'X' })
                            }
                            className="w-full font-mono text-xs px-2 py-1 rounded border border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C] font-semibold"
                          />
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={flow.amount}
                            onChange={(e) =>
                              updateFlow(flow.id, { amount: Math.max(0, Number(e.target.value)) })
                            }
                            className="w-full font-mono text-xs px-2 py-1 rounded border border-[#CBD5E1] bg-white text-[#0F172A] tabular-nums"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[10.5px] text-[#64748B] mb-0.5">
                          {flow.kind === 'single' ? `Tiempo t` : '1er pago en t ='}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={maxTime}
                          value={flow.startTime}
                          onChange={(e) =>
                            updateFlow(flow.id, {
                              startTime: Math.max(0, Math.min(maxTime, Number(e.target.value))),
                            })
                          }
                          className="w-full font-mono text-xs px-2 py-1 rounded border border-[#CBD5E1] bg-white text-[#0F172A] tabular-nums"
                        />
                      </div>

                      {flow.kind === 'annuity' && (
                        <div>
                          <label className="block text-[10.5px] text-[#64748B] mb-0.5">
                            Núm. pagos (n)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={flow.count || 1}
                            onChange={(e) =>
                              updateFlow(flow.id, {
                                count: Math.max(1, Math.min(60, Number(e.target.value))),
                              })
                            }
                            className="w-full font-mono text-xs px-2 py-1 rounded border border-[#CBD5E1] bg-white text-[#0F172A] tabular-nums"
                          />
                        </div>
                      )}

                      {flow.kind === 'annuity' && (
                        <div>
                          <label className="block text-[10.5px] text-[#64748B] mb-0.5">
                            Tipo de anualidad
                          </label>
                          <select
                            value={flow.perspective || 'a'}
                            onChange={(e) =>
                              updateFlow(flow.id, {
                                perspective: e.target.value as AnnuityPerspective,
                              })
                            }
                            className="w-full text-[11px] px-1.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                          >
                            <option value="a">Vencida VP (aₙ)</option>
                            <option value="a_due">Anticipada VP (äₙ)</option>
                            <option value="s">Vencida VF (sₙ)</option>
                            <option value="s_due">Anticipada VF (s̈ₙ)</option>
                          </select>
                        </div>
                      )}

                      <div className="col-span-2 flex items-center justify-between pt-1">
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#334155] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(flow.isUnknown)}
                            onChange={(e) =>
                              updateFlow(flow.id, {
                                isUnknown: e.target.checked,
                                unknownSymbol: flow.kind === 'annuity' ? 'R' : 'X',
                              })
                            }
                            className="accent-[#EA580C]"
                          />
                          Marcar como incógnita a resolver
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
