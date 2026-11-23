import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  HelpCircle,
  Lightbulb,
  NotebookPen,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { GUIDED_EXERCISES, GuidedExercise, ParcialId } from '../data/exercises';
import {
  HOMEWORK_TASK_META,
  HOMEWORK_TASKS,
  HomeworkExercise,
  HomeworkTaskId,
} from '../data/homeworkTasks';
import { AnnuityPerspective, solveEquationOfValue } from '../lib/financeMath';
import { AnimationPhase, TimelineCanvas } from './TimelineCanvas';
import { ActuarialSymbol } from './MathExpr';

export type ExercisesMode = 'preambulo' | 'tareas' | 'solucionario';

const PREAMBULO_STORAGE_KEY = 'cronos_interes_completed_exercises_v1';
const HOMEWORK_STORAGE_KEY = 'cronos_interes_completed_homework_v1';

const PARCIAL_TABS: { id: ParcialId; label: string; subtitle: string }[] = [
  { id: 'P3', label: 'Parcial 3 (Actual)', subtitle: 'Notas P3, Asesorías, Tablas y Fondos' },
  { id: 'P2', label: 'Parcial 2', subtitle: 'Asesorías y Diapositivas Compuesto' },
  { id: 'P1', label: 'Parcial 1', subtitle: 'Diapositivas Acumulación, Simple y Descuento' },
];

export interface ExercisesWorkspaceProps {
  initialMode?: ExercisesMode;
  initialParcial?: ParcialId;
  initialTask?: HomeworkTaskId;
}

export const ExercisesWorkspace: React.FC<ExercisesWorkspaceProps> = ({
  initialMode,
  initialParcial,
  initialTask,
}) => {
  const [mode, setMode] = useState<ExercisesMode>(initialMode || 'preambulo');

  // --- PREÁMBULO STATE ---
  const [activeParcial, setActiveParcial] = useState<ParcialId>(initialParcial || 'P3');
  const filteredPreambulo = useMemo(
    () => GUIDED_EXERCISES.filter((e) => e.parcial === activeParcial),
    [activeParcial]
  );
  const [selectedPreId, setSelectedPreId] = useState<string>(
    (GUIDED_EXERCISES.find((e) => e.parcial === (initialParcial || 'P3')) || GUIDED_EXERCISES[0]).id
  );
  const preExercise: GuidedExercise =
    GUIDED_EXERCISES.find((e) => e.id === selectedPreId) || filteredPreambulo[0];

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [focalDate, setFocalDate] = useState<number>(preExercise.timeline.defaultFF);
  const [perspectiveOverride, setPerspectiveOverride] = useState<AnnuityPerspective | null>(null);
  const [step1Answer, setStep1Answer] = useState<number | null>(null);
  const [step3Answer, setStep3Answer] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);

  // --- TAREAS COMPLETAS STATE ---
  const [activeTaskId, setActiveTaskId] = useState<HomeworkTaskId>(initialTask || 'T3');
  const filteredHomework = useMemo(
    () => HOMEWORK_TASKS.filter((h) => h.taskId === activeTaskId),
    [activeTaskId]
  );
  const [selectedHwId, setSelectedHwId] = useState<string>(
    (HOMEWORK_TASKS.find((h) => h.taskId === (initialTask || 'T3')) || HOMEWORK_TASKS[0]).id
  );
  const hwExercise: HomeworkExercise =
    HOMEWORK_TASKS.find((h) => h.id === selectedHwId) || filteredHomework[0];
  const [hwRevealLevel, setHwRevealLevel] = useState<0 | 1 | 2>(0); // 0=nada, 1=pista, 2=solución
  const [hwFocalDate, setHwFocalDate] = useState<number>(hwExercise.timeline?.defaultFF ?? 0);
  const [hwPerspectiveOverride, setHwPerspectiveOverride] = useState<AnnuityPerspective | null>(null);

  // --- SOLUCIONARIO STATE ---
  const [solFilter, setSolFilter] = useState<'ALL' | 'T1' | 'T2' | 'T3' | 'PRE'>('T3');
  const [solQuery, setSolQuery] = useState<string>('');
  const [expandedSolIds, setExpandedSolIds] = useState<Record<string, boolean>>({});

  // --- COMPLETION STORAGE ---
  const [completedPreIds, setCompletedPreIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PREAMBULO_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [completedHwIds, setCompletedHwIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HOMEWORK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Sync deep-link props from CoursePathWorkspace / App
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialParcial) {
      setActiveParcial(initialParcial);
      const first = GUIDED_EXERCISES.find((e) => e.parcial === initialParcial);
      if (first) selectPreExercise(first);
    }
  }, [initialParcial]);

  useEffect(() => {
    if (initialTask) {
      setActiveTaskId(initialTask);
      const first = HOMEWORK_TASKS.find((h) => h.taskId === initialTask);
      if (first) selectHwExercise(first);
    }
  }, [initialTask]);

  const selectPreExercise = (ex: GuidedExercise) => {
    setSelectedPreId(ex.id);
    setActiveParcial(ex.parcial);
    setActiveStep(1);
    setFocalDate(ex.timeline.defaultFF);
    setPerspectiveOverride(null);
    setStep1Answer(null);
    setStep3Answer(null);
    setHintLevel(0);
  };

  const selectHwExercise = (hw: HomeworkExercise) => {
    setSelectedHwId(hw.id);
    setActiveTaskId(hw.taskId);
    setHwRevealLevel(0);
    setHwFocalDate(hw.timeline?.defaultFF ?? 0);
    setHwPerspectiveOverride(null);
  };

  const togglePreCompleted = (id: string) => {
    setCompletedPreIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(PREAMBULO_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const toggleHwCompleted = (id: string) => {
    setCompletedHwIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Preámbulo timeline evaluation
  const activePreFlows = useMemo(() => {
    if (!perspectiveOverride) return preExercise.timeline.flows;
    return preExercise.timeline.flows.map((f) =>
      f.kind === 'annuity' ? { ...f, perspective: perspectiveOverride } : f
    );
  }, [preExercise, perspectiveOverride]);

  const preSolution = useMemo(
    () =>
      solveEquationOfValue(
        activePreFlows,
        focalDate,
        preExercise.timeline.rate,
        preExercise.timeline.regime || 'compound',
        preExercise.timeline.segments
      ),
    [activePreFlows, focalDate, preExercise]
  );

  // Homework timeline evaluation (when present)
  const activeHwFlows = useMemo(() => {
    if (!hwExercise.timeline) return [];
    if (!hwPerspectiveOverride) return hwExercise.timeline.flows;
    return hwExercise.timeline.flows.map((f) =>
      f.kind === 'annuity' ? { ...f, perspective: hwPerspectiveOverride } : f
    );
  }, [hwExercise, hwPerspectiveOverride]);

  const hwSolution = useMemo(() => {
    if (!hwExercise.timeline) return null;
    return solveEquationOfValue(
      activeHwFlows,
      hwFocalDate,
      hwExercise.timeline.rate,
      hwExercise.timeline.regime || 'compound'
    );
  }, [activeHwFlows, hwFocalDate, hwExercise]);

  // Solucionario unified list
  const solucionarioItems = useMemo(() => {
    const hwItems = HOMEWORK_TASKS.map((h) => ({
      id: h.id,
      group: h.taskId as 'T1' | 'T2' | 'T3',
      sourceLabel:
        h.taskId === 'T1'
          ? `Tarea 01 · Ej. ${h.number}`
          : h.taskId === 'T2'
            ? `Tarea 02 · Ej. ${h.number}`
            : `Tarea 03 · Ej. ${h.number}`,
      section: h.section,
      title: h.title,
      topicTag: h.topicTag,
      statement: h.statement,
      formula: h.formula,
      steps: h.steps,
      finalAnswer: h.finalAnswer,
      note: h.examTip || h.rateNote,
      origin: 'homework' as const,
      rawHw: h,
    }));

    const preItems = GUIDED_EXERCISES.map((g, idx) => ({
      id: g.id,
      group: 'PRE' as const,
      sourceLabel: `Preámbulo ${g.parcial} · ${g.sourceRef}`,
      section: `Preámbulo ${g.parcial} (#${idx + 1})`,
      title: g.title,
      topicTag: g.topicTag,
      statement: g.statement,
      formula: g.step4.equationDisplay,
      steps: g.step4.algebraSteps,
      finalAnswer: g.step4.finalAnswer,
      note: g.step4.notebookNote || g.step1.rateConversion,
      origin: 'preambulo' as const,
      rawPre: g,
    }));

    const all = [...hwItems, ...preItems];
    const byGroup = solFilter === 'ALL' ? all : all.filter((item) => item.group === solFilter);

    const q = solQuery.trim().toLowerCase();
    if (!q) return byGroup;
    return byGroup.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.statement.toLowerCase().includes(q) ||
        item.topicTag.toLowerCase().includes(q) ||
        item.finalAnswer.toLowerCase().includes(q) ||
        item.sourceLabel.toLowerCase().includes(q)
    );
  }, [solFilter, solQuery]);

  const phaseForStep: AnimationPhase =
    activeStep === 1 ? 'flows' : activeStep === 2 ? 'landing' : 'all';

  const isPreCompleted = completedPreIds.includes(preExercise.id);
  const isHwCompleted = completedHwIds.includes(hwExercise.id);

  const activeHwIndex = filteredHomework.findIndex((h) => h.id === hwExercise.id);
  const activeTaskMeta =
    HOMEWORK_TASK_META.find((m) => m.id === activeTaskId) || HOMEWORK_TASK_META[2];

  const totalHomeworkCount = HOMEWORK_TASKS.length;
  const totalPreambuloCount = GUIDED_EXERCISES.length;

  return (
    <div className="space-y-5">
      {/* Top Workspace Header & 3 Clear Section Switchers */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Ejercicios, Tareas Completas y Solucionario
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Primero calienta en el <strong>Preámbulo</strong> con tus notas, asesorías y diapositivas; luego resuelve las{' '}
            <strong>3 Tareas completas ({totalHomeworkCount}/{totalHomeworkCount})</strong> y verifica en el{' '}
            <strong>Solucionario</strong>.
          </p>
        </div>

        {/* 3 Primary Modes */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => setMode('preambulo')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'preambulo'
                ? 'bg-[#0F172A] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <NotebookPen className="w-3.5 h-3.5" />
            Preámbulo: Notas y Diap. ({totalPreambuloCount})
          </button>
          <button
            onClick={() => setMode('tareas')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'tareas'
                ? 'bg-[#EA580C] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Tareas Completas ({totalHomeworkCount})
          </button>
          <button
            onClick={() => setMode('solucionario')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'solucionario'
                ? 'bg-[#047857] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Solucionario ({totalHomeworkCount + totalPreambuloCount})
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODE 1: PREÁMBULO (TUS NOTAS, ASESORÍAS Y DIAPOSITIVAS)           */}
      {/* ================================================================= */}
      {mode === 'preambulo' && (
        <div className="space-y-4">
          {/* Subheader + Parcial Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
            <div className="text-xs text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Preámbulo guiado:</span>{' '}
              ejercicios de tus cuadernos (<span className="font-mono">INTERES3NOTAS</span>),{' '}
              <span className="font-mono">Asesorías 20 Nov</span> y diapositivas del profesor para entender el método antes de entrar a las tareas.
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {PARCIAL_TABS.map((tab) => {
                const count = GUIDED_EXERCISES.filter((e) => e.parcial === tab.id).length;
                const active = activeParcial === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveParcial(tab.id);
                      const first = GUIDED_EXERCISES.find((e) => e.parcial === tab.id);
                      if (first) selectPreExercise(first);
                    }}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}
                  >
                    {tab.label} · {count}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Preámbulo Picker */}
            <aside className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-[#F1F5F9]">
                <span className="text-xs font-semibold text-[#0F172A]">
                  Preámbulo {activeParcial} ({filteredPreambulo.length})
                </span>
                <span className="text-[11px] font-mono text-[#047857] tabular-nums">
                  {completedPreIds.filter((id) => filteredPreambulo.some((e) => e.id === id)).length}/
                  {filteredPreambulo.length} listos
                </span>
              </div>
              {filteredPreambulo.map((ex, idx) => {
                const active = ex.id === preExercise.id;
                const done = completedPreIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectPreExercise(ex)}
                    className={`w-full text-left px-2.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F8FAFC] border-[#0F172A]'
                        : 'bg-white border-transparent hover:bg-[#F8FAFC] hover:border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0F172A] leading-snug">
                        {idx + 1}. {ex.title}
                      </span>
                      {done && <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />}
                    </div>
                    <div className="mt-1 text-[11px] text-[#64748B] flex items-center gap-1.5">
                      <span>{ex.difficulty}</span>
                      <span>·</span>
                      <span className="truncate">{ex.sourceRef}</span>
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Right Interactive Preámbulo Studio */}
            <div className="lg:col-span-9 space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#64748B] flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>{preExercise.sourceRef}</span>
                      <span>·</span>
                      <span className="font-medium text-[#334155]">{preExercise.topicTag}</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0F172A] mt-1">
                      {preExercise.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => togglePreCompleted(preExercise.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      isPreCompleted
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isPreCompleted ? 'Dominado' : 'Marcar dominado'}
                  </button>
                </div>

                <p className="text-sm text-[#1E293B] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
                  {preExercise.statement}
                </p>

                {/* Quick Interactive Controls above Timeline */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {preExercise.timeline.altFF !== undefined && (
                      <button
                        onClick={() =>
                          setFocalDate((cur) =>
                            cur === preExercise.timeline.defaultFF
                              ? preExercise.timeline.altFF!
                              : preExercise.timeline.defaultFF
                          )
                        }
                        className="px-2.5 py-1 text-xs font-medium bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] rounded hover:bg-[#FFEDD5] transition-colors cursor-pointer"
                      >
                        {focalDate === preExercise.timeline.defaultFF
                          ? preExercise.timeline.altFFLabel || `Probar FF = ${preExercise.timeline.altFF}`
                          : `Volver a FF = ${preExercise.timeline.defaultFF}`}
                      </button>
                    )}

                    {preExercise.timeline.allowPerspectiveSwitch && (
                      <div className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-0.5">
                        {(['a', 'a_due', 's', 's_due'] as AnnuityPerspective[]).map((p) => {
                          const active =
                            (perspectiveOverride ||
                              preExercise.timeline.flows.find((f) => f.kind === 'annuity')?.perspective ||
                              'a') === p;
                          return (
                            <button
                              key={p}
                              onClick={() => setPerspectiveOverride(p)}
                              className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                                active
                                  ? 'bg-[#6D28D9] text-white'
                                  : 'text-[#475569] hover:text-[#0F172A]'
                              }`}
                            >
                              <ActuarialSymbol type={p} n="n" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {focalDate !== preExercise.timeline.defaultFF && (
                    <button
                      onClick={() => setFocalDate(preExercise.timeline.defaultFF)}
                      className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> FF original ({preExercise.timeline.defaultFF})
                    </button>
                  )}
                </div>

                <TimelineCanvas
                  maxTime={preExercise.timeline.maxTime}
                  focalDate={focalDate}
                  onFocalDateChange={setFocalDate}
                  evaluatedFlows={preSolution.evaluated}
                  periodLabel={preExercise.timeline.periodLabel}
                  rate={preExercise.timeline.rate}
                  regime={preExercise.timeline.regime || 'compound'}
                  segments={preExercise.timeline.segments}
                  phase={phaseForStep}
                  compact
                />
              </div>

              {/* 4-Step Scaffolded Coaching Deck */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {(
                    [
                      { n: 1, title: '1. Datos y Tasa' },
                      { n: 2, title: '2. Línea y Aterrizaje' },
                      { n: 3, title: '3. Fecha Focal' },
                      { n: 4, title: '4. Ecuación (Si te trabas)' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.n}
                      onClick={() => setActiveStep(st.n)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold transition-colors cursor-pointer ${
                        activeStep === st.n
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8] hover:text-[#0F172A]'
                      }`}
                    >
                      {st.title}
                    </button>
                  ))}
                </div>

                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-sm text-[#1E293B]">{preExercise.step1.summary}</p>
                      <div className="font-mono text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-[#0F172A]">
                        {preExercise.step1.rateConversion}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                      <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-[#1D4ED8]" />
                        Comprueba antes de avanzar: {preExercise.step1.checkpoint.prompt}
                      </div>
                      <div className="space-y-1.5">
                        {preExercise.step1.checkpoint.options.map((opt, i) => {
                          const picked = step1Answer === i;
                          const isCorrect = i === preExercise.step1.checkpoint.correctIndex;
                          const showResult = step1Answer !== null;
                          return (
                            <button
                              key={opt}
                              onClick={() => setStep1Answer(i)}
                              className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors cursor-pointer ${
                                showResult && isCorrect
                                  ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-medium'
                                  : showResult && picked && !isCorrect
                                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                                    : 'bg-white border-[#CBD5E1] hover:border-[#0F172A] text-[#1E293B]'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {step1Answer !== null && (
                        <p className="text-xs text-[#334155] pt-1">
                          {preExercise.step1.checkpoint.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
                      >
                        Siguiente: Línea y aterrizaje <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#1E293B]">{preExercise.step2.summary}</p>
                    <div className="p-3.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#4C1D95] space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#6D28D9]" />
                        Fíjate en el punto morado del diagrama arriba
                      </div>
                      <p>{preExercise.step2.landingInsight}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
                      >
                        Siguiente: Fecha Focal y dirección <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-sm text-[#1E293B]">{preExercise.step3.summary}</p>
                      <p className="text-xs text-[#475569]">
                        <span className="font-semibold text-[#EA580C]">¿Por qué conviene esta FF? </span>
                        {preExercise.step3.whyThisFF}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                      <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-[#1D4ED8]" />
                        Decide la dirección: {preExercise.step3.checkpoint.prompt}
                      </div>
                      <div className="space-y-1.5">
                        {preExercise.step3.checkpoint.options.map((opt, i) => {
                          const picked = step3Answer === i;
                          const isCorrect = i === preExercise.step3.checkpoint.correctIndex;
                          const showResult = step3Answer !== null;
                          return (
                            <button
                              key={opt}
                              onClick={() => setStep3Answer(i)}
                              className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors cursor-pointer ${
                                showResult && isCorrect
                                  ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-medium'
                                  : showResult && picked && !isCorrect
                                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                                    : 'bg-white border-[#CBD5E1] hover:border-[#0F172A] text-[#1E293B]'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {step3Answer !== null && (
                        <p className="text-xs text-[#334155] pt-1">
                          {preExercise.step3.checkpoint.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveStep(4)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
                      >
                        Siguiente: Plantear y despejar <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-[#334155]">
                        Intenta plantear tu ecuación en papel primero. Si te trabas, destapa una pista a la vez:
                      </p>
                      <div className="flex items-center gap-2">
                        {hintLevel < 3 && (
                          <button
                            onClick={() => setHintLevel((lvl) => Math.min(3, lvl + 1) as 0 | 1 | 2 | 3)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#EA580C] text-white rounded-md hover:bg-[#C2410C] transition-colors cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            {hintLevel === 0
                              ? 'Me trabé → Ver Pista 1'
                              : hintLevel === 1
                                ? 'Sigo trabado → Ver Pista 2'
                                : 'Ver ecuación y desarrollo completo'}
                          </button>
                        )}
                        {hintLevel > 0 && (
                          <button
                            onClick={() => setHintLevel(0)}
                            className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                          >
                            Ocultar pistas
                          </button>
                        )}
                      </div>
                    </div>

                    {hintLevel >= 1 && (
                      <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#78350F]">
                        <span className="font-semibold text-[#B45309]">Pista 1: </span>
                        {preExercise.step4.hint1}
                      </div>
                    )}

                    {hintLevel >= 2 && (
                      <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A8A]">
                        <span className="font-semibold text-[#1D4ED8]">Pista 2: </span>
                        {preExercise.step4.hint2}
                      </div>
                    )}

                    {hintLevel >= 3 && (
                      <div className="space-y-3 pt-1">
                        <div className="p-3.5 rounded-lg bg-[#0F172A] text-white font-mono text-xs sm:text-sm overflow-x-auto">
                          {preExercise.step4.equationDisplay}
                        </div>

                        <ol className="space-y-1.5 text-xs font-mono text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
                          {preExercise.step4.algebraSteps.map((st, idx) => (
                            <li key={st} className="flex items-start gap-2">
                              <span className="text-[#64748B] font-semibold">{idx + 1}.</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ol>

                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#047857]">
                              Resultado verificado
                            </span>
                            <div className="font-mono text-base font-bold text-[#065F46] tabular-nums">
                              {preExercise.step4.finalAnswer}
                            </div>
                          </div>
                          <button
                            onClick={() => togglePreCompleted(preExercise.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#047857] text-white rounded-md hover:bg-[#065F46] cursor-pointer"
                          >
                            {isPreCompleted ? 'Ya marcado como dominado ✓' : '¡Lo entendí! Marcar dominado'}
                          </button>
                        </div>

                        {preExercise.step4.notebookNote && (
                          <div className="p-3.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#4C1D95]">
                            <span className="font-semibold text-[#6D28D9]">Nota sobre tu cuaderno: </span>
                            {preExercise.step4.notebookNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODE 2: TAREAS COMPLETAS (T1: 20/20 · T2: 24/24 · T3: 13/13)      */}
      {/* ================================================================= */}
      {mode === 'tareas' && (
        <div className="space-y-4">
          {/* Task Sheet Picker Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#EA580C] font-semibold">
                {activeTaskMeta.sourceFile}
              </div>
              <div className="font-display text-base font-semibold text-[#0F172A] mt-0.5">
                {activeTaskMeta.fullTitle}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{activeTaskMeta.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {HOMEWORK_TASK_META.map((task) => {
                const count = HOMEWORK_TASKS.filter((h) => h.taskId === task.id).length;
                const doneCount = HOMEWORK_TASKS.filter(
                  (h) => h.taskId === task.id && completedHwIds.includes(h.id)
                ).length;
                const active = activeTaskId === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      setActiveTaskId(task.id);
                      const first = HOMEWORK_TASKS.find((h) => h.taskId === task.id);
                      if (first) selectHwExercise(first);
                    }}
                    className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EA580C] text-white border-[#EA580C]'
                        : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F172A]'
                    }`}
                  >
                    {task.shortTitle} · {doneCount}/{count}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Complete Numbered List (1..N) */}
            <aside className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-1.5 max-h-[760px] overflow-y-auto">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-[#F1F5F9] sticky top-0 bg-white z-10">
                <span className="text-xs font-semibold text-[#0F172A]">
                  Todos los ejercicios ({filteredHomework.length}/{filteredHomework.length})
                </span>
                <span className="text-[11px] font-mono text-[#047857] tabular-nums">
                  {completedHwIds.filter((id) => filteredHomework.some((h) => h.id === id)).length}/
                  {filteredHomework.length} listos
                </span>
              </div>
              {filteredHomework.map((hw) => {
                const active = hw.id === hwExercise.id;
                const done = completedHwIds.includes(hw.id);
                return (
                  <button
                    key={hw.id}
                    onClick={() => selectHwExercise(hw)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#FFF7ED] border-[#EA580C]'
                        : 'bg-white border-transparent hover:bg-[#F8FAFC] hover:border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0F172A] leading-snug">
                        <span className="font-mono text-[#EA580C] mr-1">#{hw.number}</span>
                        {hw.title}
                      </span>
                      {done && <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#64748B] flex items-center gap-1.5">
                      <span className="truncate">{hw.section}</span>
                      {hw.timeline && (
                        <>
                          <span>·</span>
                          <span className="text-[#1D4ED8] font-medium shrink-0">Con línea</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Right Active Homework Exercise Card */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#64748B] flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#EA580C]">
                        {activeTaskMeta.shortTitle} · Ejercicio {hwExercise.number} de {filteredHomework.length}
                      </span>
                      <span>·</span>
                      <span>{hwExercise.section}</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0F172A] mt-1">
                      {hwExercise.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => toggleHwCompleted(hwExercise.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      isHwCompleted
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isHwCompleted ? 'Completado' : 'Marcar completado'}
                  </button>
                </div>

                {/* Statement */}
                <p className="text-sm text-[#1E293B] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                  {hwExercise.statement}
                </p>

                {/* Rate / Data Note */}
                <div className="font-mono text-xs bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] rounded-lg px-3.5 py-2.5">
                  <strong className="font-sans text-[#1D4ED8]">Datos y tasa: </strong>
                  {hwExercise.rateNote}
                </div>

                {/* Optional Interactive Timeline */}
                {hwExercise.timeline && hwSolution && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {hwExercise.timeline.altFF !== undefined && (
                          <button
                            onClick={() =>
                              setHwFocalDate((cur) =>
                                cur === hwExercise.timeline!.defaultFF
                                  ? hwExercise.timeline!.altFF!
                                  : hwExercise.timeline!.defaultFF
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] rounded hover:bg-[#FFEDD5] transition-colors cursor-pointer"
                          >
                            {hwFocalDate === hwExercise.timeline.defaultFF
                              ? hwExercise.timeline.altFFLabel || `Probar FF = ${hwExercise.timeline.altFF}`
                              : `Volver a FF = ${hwExercise.timeline.defaultFF}`}
                          </button>
                        )}
                        {hwExercise.timeline.allowPerspectiveSwitch && (
                          <div className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-0.5">
                            {(['a', 'a_due', 's', 's_due'] as AnnuityPerspective[]).map((p) => {
                              const active =
                                (hwPerspectiveOverride ||
                                  hwExercise.timeline!.flows.find((f) => f.kind === 'annuity')?.perspective ||
                                  'a') === p;
                              return (
                                <button
                                  key={p}
                                  onClick={() => setHwPerspectiveOverride(p)}
                                  className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                                    active
                                      ? 'bg-[#6D28D9] text-white'
                                      : 'text-[#475569] hover:text-[#0F172A]'
                                  }`}
                                >
                                  <ActuarialSymbol type={p} n="n" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {hwFocalDate !== hwExercise.timeline.defaultFF && (
                        <button
                          onClick={() => setHwFocalDate(hwExercise.timeline!.defaultFF)}
                          className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> FF original ({hwExercise.timeline.defaultFF})
                        </button>
                      )}
                    </div>

                    <TimelineCanvas
                      maxTime={hwExercise.timeline.maxTime}
                      focalDate={hwFocalDate}
                      onFocalDateChange={setHwFocalDate}
                      evaluatedFlows={hwSolution.evaluated}
                      periodLabel={hwExercise.timeline.periodLabel}
                      rate={hwExercise.timeline.rate}
                      regime={hwExercise.timeline.regime || 'compound'}
                      phase="all"
                      compact
                    />
                  </div>
                )}

                {/* Progressive Reveal Controls */}
                <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#475569]">
                      Resuélvelo primero en tu libreta y destapa la ayuda solo cuando la necesites:
                    </span>
                    <div className="flex items-center gap-2">
                      {hwRevealLevel < 1 && (
                        <button
                          onClick={() => setHwRevealLevel(1)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D] rounded-md hover:bg-[#FEF3C7] cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          Ver pista
                        </button>
                      )}
                      {hwRevealLevel < 2 && (
                        <button
                          onClick={() => setHwRevealLevel(2)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          Ver solución completa
                        </button>
                      )}
                      {hwRevealLevel > 0 && (
                        <button
                          onClick={() => setHwRevealLevel(0)}
                          className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                        >
                          Ocultar
                        </button>
                      )}
                    </div>
                  </div>

                  {hwRevealLevel >= 1 && (
                    <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#78350F]">
                      <span className="font-semibold text-[#B45309]">Pista clave: </span>
                      {hwExercise.hint}
                    </div>
                  )}

                  {hwRevealLevel >= 2 && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg bg-[#0F172A] text-white font-mono text-xs sm:text-sm overflow-x-auto">
                        {hwExercise.formula}
                      </div>

                      <ol className="space-y-1.5 text-xs font-mono text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
                        {hwExercise.steps.map((st, idx) => (
                          <li key={st} className="flex items-start gap-2">
                            <span className="text-[#64748B] font-semibold">{idx + 1}.</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#047857]">
                            Respuesta verificada
                          </span>
                          <div className="font-mono text-sm sm:text-base font-bold text-[#065F46] tabular-nums">
                            {hwExercise.finalAnswer}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleHwCompleted(hwExercise.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#047857] text-white rounded-md hover:bg-[#065F46] cursor-pointer"
                        >
                          {isHwCompleted ? 'Completado ✓' : 'Marcar listo'}
                        </button>
                      </div>

                      {hwExercise.examTip && (
                        <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#4C1D95]">
                          <span className="font-semibold text-[#6D28D9]">Tip de examen: </span>
                          {hwExercise.examTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Prev / Next Homework Navigation */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <button
                    disabled={activeHwIndex <= 0}
                    onClick={() => {
                      if (activeHwIndex > 0) selectHwExercise(filteredHomework[activeHwIndex - 1]);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-[#CBD5E1] text-[#334155] hover:border-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </button>
                  <span className="text-xs font-mono text-[#64748B] tabular-nums">
                    Ejercicio {hwExercise.number} / {filteredHomework.length}
                  </span>
                  <button
                    disabled={activeHwIndex >= filteredHomework.length - 1}
                    onClick={() => {
                      if (activeHwIndex < filteredHomework.length - 1) {
                        selectHwExercise(filteredHomework[activeHwIndex + 1]);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-[#CBD5E1] text-[#334155] hover:border-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODE 3: SOLUCIONARIO COMPLETO (FILTRABLE Y BUSCABLE)              */}
      {/* ================================================================= */}
      {mode === 'solucionario' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#0F172A]">
                  Solucionario Completo Paso a Paso
                </h2>
                <p className="text-xs text-[#475569]">
                  Consulta el planteamiento exacto, desarrollo algebraico y respuesta verificada de las 3 Tareas completas y del Preámbulo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    solucionarioItems.forEach((it) => {
                      next[it.id] = true;
                    });
                    setExpandedSolIds(next);
                  }}
                  className="px-2.5 py-1 text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] rounded hover:border-[#0F172A] cursor-pointer"
                >
                  Expandir todos
                </button>
                <button
                  onClick={() => setExpandedSolIds({})}
                  className="px-2.5 py-1 text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] rounded hover:border-[#0F172A] cursor-pointer"
                >
                  Colapsar todos
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9]">
              {/* Group filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'T1', label: `Tarea 01 (${HOMEWORK_TASKS.filter((h) => h.taskId === 'T1').length})` },
                    { id: 'T2', label: `Tarea 02 (${HOMEWORK_TASKS.filter((h) => h.taskId === 'T2').length})` },
                    { id: 'T3', label: `Tarea 03 (${HOMEWORK_TASKS.filter((h) => h.taskId === 'T3').length})` },
                    { id: 'PRE', label: `Preámbulo (${GUIDED_EXERCISES.length})` },
                    { id: 'ALL', label: `Todos (${HOMEWORK_TASKS.length + GUIDED_EXERCISES.length})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSolFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border cursor-pointer transition-colors ${
                      solFilter === f.id
                        ? 'bg-[#047857] text-white border-[#047857]'
                        : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F172A]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={solQuery}
                  onChange={(e) => setSolQuery(e.target.value)}
                  placeholder="Buscar por tema, monto o fórmula..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:border-[#047857]"
                />
              </div>
            </div>
          </div>

          {solucionarioItems.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-sm text-[#64748B]">
              No se encontraron ejercicios que coincidan con «{solQuery}».
            </div>
          ) : (
            <div className="space-y-2.5">
              {solucionarioItems.map((item) => {
                const open = Boolean(expandedSolIds[item.id]);
                return (
                  <article
                    key={item.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedSolIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                          <span className="font-mono font-semibold text-[#047857]">
                            {item.sourceLabel}
                          </span>
                          <span>·</span>
                          <span>{item.topicTag}</span>
                        </div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">
                          {item.title}
                        </div>
                        <div className="text-xs font-mono text-[#065F46] mt-0.5 truncate">
                          Respuesta: {item.finalAnswer}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {open && (
                      <div className="px-4 pb-4 pt-2 border-t border-[#F1F5F9] space-y-3 bg-[#FCFDFF]">
                        <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                          {item.statement}
                        </p>

                        <div className="p-3 rounded-lg bg-[#0F172A] text-white font-mono text-xs overflow-x-auto">
                          {item.formula}
                        </div>

                        <ol className="space-y-1.5 text-xs font-mono text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg p-3">
                          {item.steps.map((st, idx) => (
                            <li key={st} className="flex items-start gap-2">
                              <span className="text-[#64748B] font-semibold">{idx + 1}.</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ol>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="text-xs text-[#475569]">
                            <strong className="text-[#047857]">Resultado: </strong>
                            <span className="font-mono font-bold text-[#065F46]">
                              {item.finalAnswer}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (item.origin === 'homework' && item.rawHw) {
                                selectHwExercise(item.rawHw);
                                setMode('tareas');
                              } else if (item.origin === 'preambulo' && item.rawPre) {
                                selectPreExercise(item.rawPre);
                                setMode('preambulo');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
                          >
                            Practicar en modo interactivo <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.note && (
                          <div className="text-[11.5px] text-[#4C1D95] bg-[#F5F3FF] border border-[#DDD6FE] rounded-md px-3 py-2">
                            <strong>Nota: </strong>
                            {item.note}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
