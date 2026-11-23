import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { EXAM_TRAPS, ExamTrap } from '../data/traps';

const TRAPS_STORAGE_KEY = 'cronos_interes_traps_mastered_v1';

export const TrapsWorkspace: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'P3' | 'P2' | 'P1'>('ALL');
  const [index, setIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TRAPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const list = useMemo(
    () => (filter === 'ALL' ? EXAM_TRAPS : EXAM_TRAPS.filter((t) => t.parcial === filter)),
    [filter]
  );

  const safeIdx = Math.min(index, Math.max(0, list.length - 1));
  const trap: ExamTrap = list[safeIdx];

  const handleSelectOption = (optIdx: number) => {
    setSelectedOption(optIdx);
    if (optIdx === trap.correctIndex && !masteredIds.includes(trap.id)) {
      const next = [...masteredIds, trap.id];
      setMasteredIds(next);
      try {
        localStorage.setItem(TRAPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const goTo = (nextIdx: number) => {
    setIndex(nextIdx);
    setSelectedOption(null);
  };

  const isCorrect = selectedOption !== null && selectedOption === trap.correctIndex;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Detector de Trampas de Examen
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Entrena tu ojo para cachar los 10 errores más comunes de Parcial 1, 2 y 3 antes de perder puntos en el examen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[#047857] mr-2 tabular-nums">
            Dominadas: {masteredIds.length}/{EXAM_TRAPS.length}
          </span>
          {(
            [
              { id: 'ALL', label: 'Todas (10)' },
              { id: 'P3', label: 'Parcial 3' },
              { id: 'P2', label: 'Parcial 2' },
              { id: 'P1', label: 'Parcial 1' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setIndex(0);
                setSelectedOption(null);
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
                filter === f.id
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#94A3B8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Training Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Question & Interactive Visual Feedback (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-mono font-semibold text-[#EA580C]">
              Trampa {safeIdx + 1} de {list.length} · {trap.parcial}
            </span>
            {masteredIds.includes(trap.id) && (
              <span className="inline-flex items-center gap-1 text-[#047857] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Ya detectada
              </span>
            )}
          </div>

          <h2 className="font-display text-xl font-semibold text-[#0F172A]">{trap.title}</h2>

          <p className="text-sm text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 leading-relaxed">
            {trap.scenario}
          </p>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-[#0F172A]">{trap.question}</div>
            <div className="space-y-2">
              {trap.options.map((opt, idx) => {
                const picked = selectedOption === idx;
                const right = idx === trap.correctIndex;
                const revealed = selectedOption !== null;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left px-3.5 py-3 rounded-lg border text-sm transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      revealed && right
                        ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-medium'
                        : revealed && picked && !right
                          ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                          : 'bg-white border-[#CBD5E1] hover:border-[#0F172A] text-[#1E293B]'
                    }`}
                  >
                    <span>{opt}</span>
                    {revealed && right && (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    )}
                    {revealed && picked && !right && (
                      <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant Visual Diagnostic Breakdown */}
          {selectedOption !== null && (
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <div
                className={`p-3.5 rounded-lg border text-xs ${
                  isCorrect
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                    : 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]'
                }`}
              >
                <div className="font-semibold mb-1">
                  {isCorrect
                    ? '¡Excelente ojo! No caíste en la trampa.'
                    : '¡Casi! Justo aquí suele caer la mayoría en el examen:'}
                </div>
                <p>{trap.whyStudentsFall}</p>
              </div>

              {/* Mini Visual Timeline Strip */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Esquema visual: {trap.miniTimeline.highlight}
                </div>
                <div className="relative flex items-center justify-between gap-2 pt-3 pb-1">
                  <div className="absolute left-3 right-3 top-6 h-0.5 bg-[#CBD5E1]" />
                  {trap.miniTimeline.points.map((pt) => {
                    const dotColor =
                      pt.tone === 'ff'
                        ? 'bg-[#EA580C]'
                        : pt.tone === 'landing'
                          ? 'bg-[#6D28D9]'
                          : pt.tone === 'trap'
                            ? 'bg-[#DC2626]'
                            : 'bg-[#0F172A]';
                    const textColor =
                      pt.tone === 'ff'
                        ? 'text-[#EA580C]'
                        : pt.tone === 'landing'
                          ? 'text-[#6D28D9]'
                          : pt.tone === 'trap'
                            ? 'text-[#DC2626]'
                            : 'text-[#334155]';
                    return (
                      <div key={pt.t + pt.label} className="relative z-10 flex flex-col items-center text-center">
                        <span className={`w-3 h-3 rounded-full border-2 border-white shadow-xs ${dotColor}`} />
                        <span className="font-mono text-[11px] font-bold text-[#0F172A] mt-1.5">
                          {pt.t}
                        </span>
                        <span className={`text-[11px] font-medium max-w-[130px] leading-tight mt-0.5 ${textColor}`}>
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0F172A] text-white text-xs">
                <span className="font-semibold text-[#FDBA74]">Regla de oro para el examen: </span>
                {trap.goldenRule}
              </div>
            </div>
          )}

          {/* Bottom Nav */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            <button
              disabled={safeIdx === 0}
              onClick={() => goTo(safeIdx - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-[#CBD5E1] text-[#334155] disabled:opacity-40 hover:border-[#0F172A] cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={() => goTo((safeIdx + 1) % list.length)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded bg-[#0F172A] text-white hover:bg-[#1E293B] cursor-pointer"
            >
              Siguiente trampa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Trap Index List (4 cols) */}
        <aside className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
              Lista de Trampas ({list.length})
            </span>
            {masteredIds.length > 0 && (
              <button
                onClick={() => {
                  setMasteredIds([]);
                  setSelectedOption(null);
                  try {
                    localStorage.removeItem(TRAPS_STORAGE_KEY);
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reiniciar
              </button>
            )}
          </div>

          <div className="space-y-1">
            {list.map((item, idx) => {
              const active = idx === safeIdx;
              const done = masteredIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#F8FAFC] border-[#0F172A] font-semibold text-[#0F172A]'
                      : 'border-transparent hover:bg-[#F8FAFC] text-[#475569]'
                  }`}
                >
                  <span className="truncate">
                    {idx + 1}. {item.title}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0 font-mono text-[10.5px] text-[#64748B]">
                    {item.parcial}
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
