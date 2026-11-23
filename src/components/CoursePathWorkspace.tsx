import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calculator,
  Compass,
  Layers,
  PlayCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatPct } from '../lib/financeMath';
import { ActuarialSymbol, MathFraction } from './MathExpr';
import { GUIDED_EXERCISES, type ParcialId } from '../data/exercises';
import { HOMEWORK_TASKS, type HomeworkTaskId } from '../data/homeworkTasks';
import type { ExercisesMode } from './ExercisesWorkspace';

export type AppDestination =
  | { tab: 'sandbox'; presetId?: string }
  | {
      tab: 'exercises';
      mode?: ExercisesMode;
      parcial?: ParcialId;
      taskId?: HomeworkTaskId;
    }
  | { tab: 'amortization' }
  | { tab: 'compass'; focusSection?: 'glossary' | 'converter' | 'compass' }
  | { tab: 'traps' };

interface CoursePathWorkspaceProps {
  onNavigate: (dest: AppDestination) => void;
}

export const CoursePathWorkspace: React.FC<CoursePathWorkspaceProps> = ({ onNavigate }) => {
  // Interactive mini-lab 1: Simple vs Compound crossover (Tarea P2 Ej 2 & Ej 4)
  const [compMonths, setCompMonths] = useState<number>(0.87); // 26/30 = 0.87 meses!
  const [compRatePct, setCompRatePct] = useState<number>(6.3);
  const compCapital = 5000;

  const simpleVsCompound = useMemo(() => {
    const r = compRatePct / 100;
    const mSimple = compCapital * (1 + r * compMonths);
    const mComp = compCapital * Math.pow(1 + r, compMonths);
    const diff = mSimple - mComp;
    return { mSimple, mComp, diff };
  }, [compMonths, compRatePct]);

  // Interactive mini-lab 2: Blackboard derivation of a_{n|i} from notas_asesorias p.4
  const [derivationStep, setDerivationStep] = useState<1 | 2 | 3 | 4>(1);

  // Live dynamic counts (never mismatched!)
  const counts = useMemo(
    () => ({
      preP1: GUIDED_EXERCISES.filter((e) => e.parcial === 'P1').length,
      preP2: GUIDED_EXERCISES.filter((e) => e.parcial === 'P2').length,
      preP3: GUIDED_EXERCISES.filter((e) => e.parcial === 'P3').length,
      t1: HOMEWORK_TASKS.filter((h) => h.taskId === 'T1').length,
      t2: HOMEWORK_TASKS.filter((h) => h.taskId === 'T2').length,
      t3: HOMEWORK_TASKS.filter((h) => h.taskId === 'T3').length,
      totalAll: GUIDED_EXERCISES.length + HOMEWORK_TASKS.length,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Friendly Welcome & 30-Second Visual Orientation */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs font-mono font-semibold text-[#EA580C] uppercase tracking-wider">
              Ruta guiada desde cero · Todo tu semestre en un solo lugar
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
              Entiende Teoría del Interés paso a paso, sin memorizar a ciegas
            </h1>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Si sientes que las fórmulas se mezclan, empieza aquí. Toda la materia se reduce a{' '}
              <strong className="text-[#0F172A]">4 reglas visuales</strong> sobre una línea de tiempo. Domina esas 4 reglas y el resto del curso fluye solo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate({ tab: 'sandbox', presetId: 'blank' })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#EA580C] text-white rounded-lg hover:bg-[#C2410C] transition-colors cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              Armar mi propio problema
            </button>
            <button
              onClick={() => onNavigate({ tab: 'exercises', mode: 'tareas', taskId: 'T3' })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Tareas Completas ({counts.t1 + counts.t2 + counts.t3}) y Solucionario
            </button>
          </div>
        </div>

        {/* 4 Visual Rules Strip ("How to read the app & timelines in 30 seconds") */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#F1F5F9]">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1">1. Arriba vs Abajo</div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Arriba van tus <strong>Deudas o Depósitos (↑)</strong>. Abajo van tus{' '}
              <strong>Pagos o Retiros (↓)</strong>. Al final siempre igualas: <em>Arriba = Abajo</em>.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#FFF7ED] border border-[#FDBA74]">
            <div className="text-xs font-bold text-[#C2410C] mb-1">2. Fecha Focal (FF naranja)</div>
            <p className="text-xs text-[#9A3412] leading-relaxed">
              Es el «punto de encuentro» donde comparas todo el dinero. En interés compuesto puedes arrastrarla a donde te ahorre más cuentas.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
            <div className="text-xs font-bold text-[#047857] mb-1 flex items-center gap-1">
              3. Hacia adelante <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-[#065F46] leading-relaxed">
              Si el dinero viaja a la <strong>derecha</strong> hacia la FF, gana intereses: multiplicas por{' '}
              <span className="font-mono font-semibold">(1 + i)ᵗ</span>.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
            <div className="text-xs font-bold text-[#1D4ED8] mb-1 flex items-center gap-1">
              4. Hacia atrás <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-[#1E3A8A] leading-relaxed">
              Si el dinero viaja a la <strong>izquierda</strong> hacia la FF, le quitas intereses: multiplicas por{' '}
              <span className="font-mono font-semibold">vᵗ = (1 + i)⁻ᵗ</span>.
            </p>
          </div>
        </div>
      </section>

      {/* THE 4 PROGRESSIVE COURSE STAGES (FROM ZERO TO FULL MASTERY) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-[#0F172A]">
            Camino Completo del Semestre (en orden)
          </h2>
          <span className="text-xs font-mono text-[#64748B]">
            Basado en todas tus notas, asesorías, tareas y diapositivas
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* STAGE 1: PARCIAL 1 */}
          <article className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#EA580C]">ETAPA 1 · PARCIAL 1</span>
                <span className="text-[#64748B]">Tarea 01 · Diapositivas Simple y Descuento</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                Funciones de Acumulación, Interés Simple y Descuento
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Aquí aprendes cómo crece $1 peso con <span className="font-mono text-[#0F172A]">a(t)</span>, cómo calcular intereses de un periodo <span className="font-mono text-[#0F172A]">Iₙ = A(n) − A(n−1)</span>, la tasa real con inflación (Fisher), el año comercial de 360 días y los pagarés con descuento.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[#0F172A]">
                <div>Simple: M = C(1 + it)</div>
                <div>Descuento: C = M(1 − dt)</div>
                <div>Relación: d = i / (1 + i)</div>
                <div>Real: 1+iᵣ = (1+i)/(1+r)</div>
              </div>
              <p className="text-[11.5px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-md px-3 py-2">
                <strong>Recuerda:</strong> En Interés Simple, cambiar la Fecha Focal <strong>sí cambia</strong> el resultado. Siempre respeta la FF del enunciado.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'preambulo', parcial: 'P1' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
              >
                Preámbulo P1 ({counts.preP1})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'tareas', taskId: 'T1' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#EA580C] text-white rounded-md hover:bg-[#C2410C] cursor-pointer"
              >
                Tarea 01 completa ({counts.t1}/{counts.t1})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'sandbox', presetId: 'simple-vs-comp' })}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-[#CBD5E1] text-[#334155] rounded-md hover:border-[#0F172A] cursor-pointer"
              >
                FF en Simple
              </button>
            </div>
          </article>

          {/* STAGE 2: PARCIAL 2 */}
          <article className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#1D4ED8]">ETAPA 2 · PARCIAL 2</span>
                <span className="text-[#64748B]">Tarea P2 · Notas P2 · Asesorías P1–P2</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                Interés Compuesto, Tasas Convertibles y Ecuaciones de Valor
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Los intereses generan nuevos intereses. Aquí dominas la diferencia entre <strong>tasa efectiva</strong> y <strong>tasa nominal/convertible</strong> (<span className="font-mono text-[#0F172A]">i⁽ᵐ⁾</span> e incluso no anuales como <span className="font-mono text-[#0F172A]">i_s⁽⁶⁾</span>), fuerza de interés <span className="font-mono text-[#0F172A]">δ</span>, y reestructuraciones de deuda.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[#0F172A]">
                <div>Compuesto: M = C(1 + i)ᵗ</div>
                <div>Nominal: i_cap = i⁽ᵐ⁾ / m</div>
                <div>Equiv: (1+i₂) = (1+i₁)^(p₁/p₂)</div>
                <div>Fuerza δ: 1 + iₐ = e^δ</div>
              </div>
              <p className="text-[11.5px] text-[#1E3A8A] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-3 py-2">
                <strong>Truco clave:</strong> «Convertible / capitalizable» = divide primero. «Efectiva» = convierte con potencia/raíz.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'preambulo', parcial: 'P2' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
              >
                Preámbulo P2 ({counts.preP2})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'tareas', taskId: 'T2' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#EA580C] text-white rounded-md hover:bg-[#C2410C] cursor-pointer"
              >
                Tarea 02 completa ({counts.t2}/{counts.t2})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'compass', focusSection: 'converter' })}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-[#CBD5E1] text-[#334155] rounded-md hover:border-[#0F172A] cursor-pointer"
              >
                Convertidor de Tasas
              </button>
            </div>
          </article>

          {/* STAGE 3: PARCIAL 3 — ANUALIDADES */}
          <article className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#6D28D9]">ETAPA 3 · PARCIAL 3 (ACTUAL)</span>
                <span className="text-[#64748B]">Notas P3 · Asesorías P3–P5 · Tarea Anualidades</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                Anualidades, Diferidas, Por Partes, Pago Extra y Perpetuidades
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                En vez de descontar 36 pagos uno por uno, una fórmula los colapsa todos en un solo punto de aterrizaje. Aprendes las <strong>4 formas equivalentes</strong>, pagos por partes con tasas cambiantes, cambio de frecuencia (trimestral → mensual), despeje de <span className="font-mono text-[#0F172A]">n</span> con pago extra e interpolación de <span className="font-mono text-[#0F172A]">i</span>.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[#0F172A]">
                <div><ActuarialSymbol type="a" n="n" /> → 1 antes del 1ro</div>
                <div><ActuarialSymbol type="a_due" n="n" /> → En el 1er pago</div>
                <div><ActuarialSymbol type="s" n="n" /> → En el último pago</div>
                <div><ActuarialSymbol type="s_due" n="n" /> → 1 después del último</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'preambulo', parcial: 'P3' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
              >
                Preámbulo Notas P3 ({counts.preP3})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'tareas', taskId: 'T3' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#EA580C] text-white rounded-md hover:bg-[#C2410C] cursor-pointer"
              >
                Tarea 03 completa ({counts.t3}/{counts.t3})
              </button>
              <button
                onClick={() => onNavigate({ tab: 'exercises', mode: 'solucionario' })}
                className="px-3 py-1.5 text-xs font-medium bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] rounded-md hover:bg-[#D1FAE5] cursor-pointer"
              >
                Solucionario ({counts.totalAll})
              </button>
            </div>
          </article>

          {/* STAGE 4: PARCIAL 3 — AMORTIZACIÓN Y FONDOS */}
          <article className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#047857]">ETAPA 4 · PARCIAL 3 (ACTUAL)</span>
                <span className="text-[#64748B]">Tablas y Fondos UDLAP · Notas 5 Nov</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                Saldos Insolutos, Tablas de Amortización y Fondos de Acumulación
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Cada pago fijo <span className="font-mono text-[#0F172A]">P</span> se divide en intereses del saldo anterior (<span className="font-mono text-[#0F172A]">Iₜ = SIₜ₋₁·i</span>) y abono a capital (<span className="font-mono text-[#0F172A]">ACₜ = P − Iₜ</span>). Sabes cuándo usar <strong>Prospectivo</strong> (mirar hacia adelante), <strong>Retrospectivo</strong> (si no sabes <span className="font-mono">n</span>) y cómo evitar la trampa de <em>justo antes</em> (<span className="font-mono">SIₖ⁻</span>).
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[#0F172A]">
                <div>Prospectivo: R·a_(n−k)</div>
                <div>Retrosp.: D(1+i)ᵏ − R·s_k</div>
                <div>Justo antes: R·ä_(n−k+1)</div>
                <div>Fondo: R = M / s_n</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => onNavigate({ tab: 'amortization' })}
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] cursor-pointer"
              >
                Abrir Laboratorio de Amortización
              </button>
              <button
                onClick={() => onNavigate({ tab: 'compass', focusSection: 'glossary' })}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-[#CBD5E1] text-[#334155] rounded-md hover:border-[#0F172A] cursor-pointer"
              >
                Ver Glosario Visual
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* TWO INTERACTIVE CONCEPT LABS DIRECTLY FROM CLASS NOTES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mini-lab A: Simple vs Compuesto Crossover (Tarea P2 Ej 4) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div>
            <div className="text-[11px] font-mono font-semibold text-[#1D4ED8] uppercase">
              Experimento interactivo · Tarea P2 Ej. 2 y Ej. 4
            </div>
            <h3 className="font-display text-base font-semibold text-[#0F172A] mt-0.5">
              ¿Cuándo conviene Interés Simple y cuándo Compuesto?
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Mueve el tiempo <span className="font-mono">t</span> alrededor de <strong>1 periodo</strong> (ej. 26 días = 0.87 meses, igual que en tu Tarea P2):
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="cross-t" className="font-medium text-[#475569]">
                  Tiempo transcurrido (t en periodos)
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  t = {compMonths.toFixed(2)} {compMonths < 1 ? '(< 1 periodo)' : compMonths === 1 ? '(= 1 exacto)' : '(> 1 periodo)'}
                </span>
              </div>
              <input
                id="cross-t"
                type="range"
                min={0.1}
                max={3}
                step={0.05}
                value={compMonths}
                onChange={(e) => setCompMonths(Number(e.target.value))}
                className="cronos-slider cronos-slider-ff w-full"
              />
              <div className="flex justify-between text-[10.5px] font-mono text-[#94A3B8] mt-0.5">
                <button
                  onClick={() => setCompMonths(26 / 30)}
                  className="underline hover:text-[#0F172A] cursor-pointer"
                >
                  26 días (0.87)
                </button>
                <button
                  onClick={() => setCompMonths(1)}
                  className="underline hover:text-[#0F172A] cursor-pointer"
                >
                  Cruce exacto (t = 1)
                </button>
                <button
                  onClick={() => setCompMonths(2.5)}
                  className="underline hover:text-[#0F172A] cursor-pointer"
                >
                  t = 2.5
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="cross-i" className="font-medium text-[#475569]">
                  Tasa por periodo (i) sobre $5,000
                </label>
                <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                  {formatPct(compRatePct / 100, 1)}
                </span>
              </div>
              <input
                id="cross-i"
                type="range"
                min={1}
                max={15}
                step={0.1}
                value={compRatePct}
                onChange={(e) => setCompRatePct(Number(e.target.value))}
                className="cronos-slider w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className={`p-3 rounded-lg border ${
                simpleVsCompound.mSimple > simpleVsCompound.mComp + 0.005
                  ? 'bg-[#ECFDF5] border-[#059669]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            >
              <div className="text-[#475569] font-medium">Interés Simple</div>
              <div className="font-mono text-lg font-bold text-[#0F172A] mt-0.5 tabular-nums">
                {formatCurrency(simpleVsCompound.mSimple)}
              </div>
              <div className="font-mono text-[10.5px] text-[#64748B]">5,000(1 + i·t)</div>
            </div>
            <div
              className={`p-3 rounded-lg border ${
                simpleVsCompound.mComp > simpleVsCompound.mSimple + 0.005
                  ? 'bg-[#ECFDF5] border-[#059669]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            >
              <div className="text-[#475569] font-medium">Interés Compuesto</div>
              <div className="font-mono text-lg font-bold text-[#0F172A] mt-0.5 tabular-nums">
                {formatCurrency(simpleVsCompound.mComp)}
              </div>
              <div className="font-mono text-[10.5px] text-[#64748B]">5,000(1 + i)ᵗ</div>
            </div>
          </div>

          <div className="text-xs p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155]">
            {Math.abs(simpleVsCompound.diff) < 0.01 ? (
              <span>
                <strong>Empate exacto en t = 1:</strong> ambos dan {formatCurrency(simpleVsCompound.mSimple)}.
              </span>
            ) : simpleVsCompound.diff > 0 ? (
              <span>
                <strong>Gana Interés Simple</strong> por {formatCurrency(simpleVsCompound.diff)} porque{' '}
                <span className="font-mono">0 &lt; t &lt; 1</span> (la recta queda encima de la curva).
              </span>
            ) : (
              <span>
                <strong>Gana Interés Compuesto</strong> por {formatCurrency(Math.abs(simpleVsCompound.diff))} porque{' '}
                <span className="font-mono">t &gt; 1</span> (los intereses empiezan a generar intereses).
              </span>
            )}
          </div>
        </div>

        {/* Mini-lab B: Blackboard Derivation of a_{n|i} (notas_asesorias p.4) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono font-semibold text-[#6D28D9] uppercase">
                De la pizarra de tus asesorías · 20 Nov (pág. 4)
              </div>
              <h3 className="font-display text-base font-semibold text-[#0F172A] mt-0.5">
                ¿De dónde sale realmente la fórmula de <ActuarialSymbol type="a" n="n" rateLabel="i" />?
              </h3>
            </div>
            <Sparkles className="w-4 h-4 text-[#6D28D9] shrink-0 mt-1" />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {([1, 2, 3, 4] as const).map((st) => (
              <button
                key={st}
                onClick={() => setDerivationStep(st)}
                className={`py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors ${
                  derivationStep === st
                    ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#C4B5FD]'
                }`}
              >
                Paso {st}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-[#0F172A] text-white space-y-2.5 min-h-[146px] flex flex-col justify-center">
            {derivationStep === 1 && (
              <>
                <div className="text-xs text-[#94A3B8]">
                  Sumamos el Valor Presente de n pagos de $1 descontados a t = 0 (con v = 1/(1+i)):
                </div>
                <div className="font-mono text-sm sm:text-base text-[#F8FAFC]">
                  aₙ|ᵢ = v + v² + v³ + ⋯ + vⁿ
                </div>
              </>
            )}
            {derivationStep === 2 && (
              <>
                <div className="text-xs text-[#94A3B8]">
                  Multiplicamos toda la ecuación por v para recorrer cada término un exponente:
                </div>
                <div className="font-mono text-sm sm:text-base text-[#38BDF8]">
                  v · aₙ|ᵢ = v² + v³ + ⋯ + vⁿ + vⁿ⁺¹
                </div>
              </>
            )}
            {derivationStep === 3 && (
              <>
                <div className="text-xs text-[#94A3B8]">
                  Restamos la segunda a la primera (¡se cancelan todos los términos de en medio!):
                </div>
                <div className="font-mono text-sm sm:text-base text-[#FDBA74]">
                  aₙ|ᵢ(1 − v) = v − vⁿ⁺¹ = v(1 − vⁿ)
                </div>
              </>
            )}
            {derivationStep === 4 && (
              <>
                <div className="text-xs text-[#94A3B8]">
                  Como 1 − v = i/(1+i) y v = 1/(1+i), al dividir v / (1 − v) queda 1/i:
                </div>
                <div className="text-base sm:text-lg text-[#6EE7B7] flex flex-wrap items-center gap-3">
                  <span>
                    <ActuarialSymbol type="a" n="n" rateLabel="i" /> ={' '}
                    <MathFraction num="1 − vⁿ" den="i" />
                  </span>
                  <span className="text-[#64748B]">|</span>
                  <span>
                    <ActuarialSymbol type="a_due" n="n" rateLabel="i" /> ={' '}
                    <MathFraction num="1 − vⁿ" den="1 − v" />
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#475569]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
              Así ya sabes por qué äₙ lleva (1 − v) abajo.
            </span>
            {derivationStep < 4 ? (
              <button
                onClick={() => setDerivationStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                className="font-semibold text-[#6D28D9] hover:underline cursor-pointer"
              >
                Siguiente paso →
              </button>
            ) : (
              <button
                onClick={() => setDerivationStep(1)}
                className="font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Ver desde el inicio
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Tools Map */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate({ tab: 'compass', focusSection: 'glossary' })}
          className="text-left p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#0F172A] transition-colors cursor-pointer flex items-start gap-3"
        >
          <Compass className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">Glosario Visual y Brújula</div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Consulta cualquier símbolo (aₙ, äₙ, i⁽ᵐ⁾, SIₖ, δ) filtrado por Anualidades, Tasas o Amortización.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate({ tab: 'sandbox', presetId: 'blank' })}
          className="text-left p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#0F172A] transition-colors cursor-pointer flex items-start gap-3"
        >
          <Calculator className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">Constructor Libre (Por Partes)</div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Escribe tu tasa nominal/convertible o efectiva, arma pagos por tramos y prueba Fechas Focales.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate({ tab: 'traps' })}
          className="text-left p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#0F172A] transition-colors cursor-pointer flex items-start gap-3"
        >
          <Layers className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">10 Trampas de Examen</div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ponte a prueba con los errores más frecuentes de Parcial 1, 2 y 3 antes del examen.
            </p>
          </div>
        </button>
      </section>
    </div>
  );
};
