import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { AppDestination, CoursePathWorkspace } from './components/CoursePathWorkspace';
import { SandboxWorkspace } from './components/SandboxWorkspace';
import { ExercisesMode, ExercisesWorkspace } from './components/ExercisesWorkspace';
import { AmortizationWorkspace } from './components/AmortizationWorkspace';
import { CompassWorkspace } from './components/CompassWorkspace';
import { TrapsWorkspace } from './components/TrapsWorkspace';
import type { ParcialId } from './data/exercises';
import type { HomeworkTaskId } from './data/homeworkTasks';

type WorkspaceId = 'course' | 'sandbox' | 'exercises' | 'amortization' | 'compass' | 'traps';

const NAV_ITEMS: { id: Exclude<WorkspaceId, 'traps'>; label: string }[] = [
  { id: 'course', label: 'Desde Cero' },
  { id: 'sandbox', label: 'Línea de Tiempo' },
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'amortization', label: 'Amortización' },
  { id: 'compass', label: 'Brújula y Tasas' },
];

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('course');
  const [sandboxPreset, setSandboxPreset] = useState<string | undefined>(undefined);
  const [exercisesMode, setExercisesMode] = useState<ExercisesMode | undefined>(undefined);
  const [exercisesParcial, setExercisesParcial] = useState<ParcialId | undefined>(undefined);
  const [exercisesTask, setExercisesTask] = useState<HomeworkTaskId | undefined>(undefined);
  const [compassFocus, setCompassFocus] = useState<'glossary' | 'converter' | 'compass' | undefined>(
    undefined
  );

  const handleNavigate = (dest: AppDestination) => {
    if (dest.tab === 'sandbox') {
      setSandboxPreset(dest.presetId);
      setActiveWorkspace('sandbox');
    } else if (dest.tab === 'exercises') {
      setExercisesMode(dest.mode);
      setExercisesParcial(dest.parcial);
      setExercisesTask(dest.taskId);
      setActiveWorkspace('exercises');
    } else if (dest.tab === 'compass') {
      setCompassFocus(dest.focusSection);
      setActiveWorkspace('compass');
    } else {
      setActiveWorkspace(dest.tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Bar: clean 3-zone single-row contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: 1-line brand wordmark */}
          <button
            onClick={() => setActiveWorkspace('course')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="1" y="1" width="26" height="26" rx="6" fill="#0F172A" />
              <line x1="6" y1="16" x2="22" y2="16" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="M8 14 Q 14 7 19 14"
                stroke="#38BDF8"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <polygon points="19,12 22,16 19,20 16,16" fill="#EA580C" />
            </svg>
            <span className="font-display font-bold text-[17px] tracking-tight text-[#0F172A] whitespace-nowrap">
              Cronos Interés
            </span>
          </button>

          {/* Center: 5 concise single-line nav links ordered from zero to mastery */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const active = activeWorkspace === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'compass') setCompassFocus(undefined);
                    setActiveWorkspace(item.id);
                  }}
                  className={`relative px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-underline"
                      className="absolute left-3 right-3 -bottom-[13px] h-[2.5px] bg-[#EA580C] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: 1 primary CTA */}
          <button
            onClick={() => setActiveWorkspace('traps')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeWorkspace === 'traps'
                ? 'bg-[#EA580C] text-white'
                : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Trampas de Examen
          </button>
        </div>

        {/* Tablet/mobile navigation row */}
        <nav
          className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-[#F1F5F9] bg-white"
          aria-label="Navegación móvil"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'compass') setCompassFocus(undefined);
                  setActiveWorkspace(item.id);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeWorkspace}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeWorkspace === 'course' && <CoursePathWorkspace onNavigate={handleNavigate} />}
            {activeWorkspace === 'sandbox' && <SandboxWorkspace initialPresetId={sandboxPreset} />}
            {activeWorkspace === 'exercises' && (
              <ExercisesWorkspace
                initialMode={exercisesMode}
                initialParcial={exercisesParcial}
                initialTask={exercisesTask}
              />
            )}
            {activeWorkspace === 'amortization' && <AmortizationWorkspace />}
            {activeWorkspace === 'compass' && <CompassWorkspace focusSection={compassFocus} />}
            {activeWorkspace === 'traps' && <TrapsWorkspace />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Minimal grounded academic footer */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-8">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
          <span>Teoría del Interés · Curso completo: Acumulación, Simple, Compuesto, Anualidades, Amortización y Fondos</span>
          <span className="font-mono text-[11px]">
            Parcial 1 · Parcial 2 · Parcial 3 · Asesorías
          </span>
        </div>
      </footer>
    </div>
  );
}
