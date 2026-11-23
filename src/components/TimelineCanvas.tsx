import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  EvaluatedFlow,
  InterestRegime,
  RateSegment,
  formatCurrency,
  formatPct,
  getPerspectiveInfo,
} from '../lib/financeMath';

export type AnimationPhase = 'flows' | 'landing' | 'all';

interface TimelineCanvasProps {
  maxTime: number;
  focalDate: number;
  onFocalDateChange?: (newFF: number) => void;
  interactiveFF?: boolean;
  evaluatedFlows: EvaluatedFlow[];
  periodLabel?: string;
  rate: number;
  regime?: InterestRegime;
  segments?: RateSegment[];
  phase?: AnimationPhase;
  highlightFlowId?: string | null;
  onSelectFlow?: (flowId: string) => void;
  compact?: boolean;
}

const SVG_W = 960;
const SVG_H = 420;
const PAD_L = 70;
const PAD_R = 70;
const AXIS_Y = 216;
const HEADER_BOTTOM = 44;

function truncateLabel(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(4, maxChars - 1))}…`;
}

function measurePillWidth(text: string, minW = 64): number {
  return Math.max(minW, Math.round(text.length * 6.3 + 18));
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  maxTime,
  focalDate,
  onFocalDateChange,
  interactiveFF = true,
  evaluatedFlows,
  periodLabel = 'periodos',
  rate,
  regime = 'compound',
  segments,
  phase = 'all',
  highlightFlowId,
  onSelectFlow,
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingFF, setIsDraggingFF] = useState(false);

  const safeMax = Math.max(4, Math.ceil(maxTime));
  const plotW = SVG_W - PAD_L - PAD_R;
  const xOf = (t: number) => PAD_L + (Math.max(0, Math.min(safeMax, t)) / safeMax) * plotW;

  const clientXToTime = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return focalDate;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * SVG_W;
    const rawT = ((relX - PAD_L) / plotW) * safeMax;
    return Math.max(0, Math.min(safeMax, Math.round(rawT)));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactiveFF || !onFocalDateChange) return;
    setIsDraggingFF(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onFocalDateChange(clientXToTime(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingFF || !interactiveFF || !onFocalDateChange) return;
    onFocalDateChange(clientXToTime(e.clientX));
  };

  const handlePointerUp = () => {
    if (isDraggingFF) setIsDraggingFF(false);
  };

  // Compute collision-free ticks (minimum ~46px spacing)
  const ticks = useMemo(() => {
    const maxLabels = Math.max(4, Math.floor(plotW / 48));
    const rawStep = safeMax / maxLabels;
    const niceSteps = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 25, 30, 50];
    const step = niceSteps.find((s) => s >= rawStep) || Math.ceil(rawStep);

    const arr: number[] = [];
    for (let t = 0; t <= safeMax; t += step) arr.push(t);
    if (arr[arr.length - 1] !== safeMax) {
      // Avoid crowding the last tick if it's very close to the previous one
      if (xOf(safeMax) - xOf(arr[arr.length - 1]) < 32) {
        arr[arr.length - 1] = safeMax;
      } else {
        arr.push(safeMax);
      }
    }
    return arr;
  }, [plotW, safeMax]);

  const ffX = xOf(focalDate);

  // Compute staggered vertical tiers for single flows & arc labels to prevent ANY overlapping text
  const layoutMap = useMemo(() => {
    const stemTiers = new Map<string, number>();
    const arcTiers = new Map<string, number>();

    const assignForSide = (side: 'debt' | 'payment') => {
      const sideFlows = evaluatedFlows
        .filter((ev) => ev.flow.side === side)
        .map((ev) => ({
          ev,
          x: xOf(ev.flow.startTime),
          midX: (xOf(ev.landingTime) + ffX) / 2,
        }))
        .sort((a, b) => a.x - b.x);

      // Assign stem tiers (0, 1, 2) if horizontal centers are within 106px
      const lastXPerTier = [-999, -999, -999];
      for (const item of sideFlows) {
        if (item.ev.flow.kind !== 'single') {
          stemTiers.set(item.ev.flow.id, 0);
          continue;
        }
        let chosen = 0;
        for (let tier = 0; tier < lastXPerTier.length; tier++) {
          if (item.x - lastXPerTier[tier] >= 106) {
            chosen = tier;
            break;
          }
          chosen = (tier + 1) % lastXPerTier.length;
        }
        lastXPerTier[chosen] = item.x;
        stemTiers.set(item.ev.flow.id, chosen);
      }

      // Assign travel-arc tiers (0, 1, 2) based on midpoint proximity
      const movingFlows = sideFlows
        .filter((i) => i.ev.direction !== 'at_ff')
        .sort((a, b) => a.midX - b.midX);
      const lastArcXPerTier = [-999, -999, -999];
      for (const item of movingFlows) {
        let chosen = 0;
        for (let tier = 0; tier < lastArcXPerTier.length; tier++) {
          if (item.midX - lastArcXPerTier[tier] >= 118) {
            chosen = tier;
            break;
          }
          chosen = (tier + 1) % lastArcXPerTier.length;
        }
        lastArcXPerTier[chosen] = item.midX;
        arcTiers.set(item.ev.flow.id, chosen);
      }
    };

    assignForSide('debt');
    assignForSide('payment');
    return { stemTiers, arcTiers };
  }, [evaluatedFlows, ffX, safeMax]);

  const segmentColors = ['#F1F5F9', '#EFF6FF', '#ECFDF5', '#FDF4FF'];

  // Clamp pill X inside SVG bounds so badges never clip at left/right edge
  const clampPillX = (cx: number, width: number) =>
    Math.max(width / 2 + 8, Math.min(SVG_W - width / 2 - 8, cx));

  return (
    <div className="w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className={`w-full h-auto block ${interactiveFF ? 'cursor-ew-resize' : 'cursor-default'} ${
          compact ? 'max-h-[340px]' : 'max-h-[430px]'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="img"
        aria-label={`Línea de tiempo financiera con Fecha Focal en t = ${focalDate}`}
      >
        <defs>
          <marker
            id="arrow-forward"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#047857" />
          </marker>
          <marker
            id="arrow-backward"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1D4ED8" />
          </marker>
          <marker
            id="arrow-collapse"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#6D28D9" />
          </marker>
        </defs>

        {/* Clean Canvas */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} rx="12" fill="#FFFFFF" />

        {/* Top Header Strip for Rate & Lane Labels (completely isolated from stems) */}
        <rect x="0" y="0" width={SVG_W} height={HEADER_BOTTOM} rx="12" fill="#F8FAFC" />
        <line x1="0" y1={HEADER_BOTTOM} x2={SVG_W} y2={HEADER_BOTTOM} stroke="#E2E8F0" strokeWidth="1" />

        <text
          x={16}
          y={26}
          className="fill-[#475569] font-sans"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="0.05em"
        >
          ↑ DEUDAS / DEPÓSITOS
        </text>
        <text
          x={16}
          y={SVG_H - 12}
          className="fill-[#475569] font-sans"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="0.05em"
        >
          ↓ PAGOS / RETIROS
        </text>

        {/* Rate summary in top-right header */}
        {(!segments || segments.length === 0) && (
          <text
            x={SVG_W - 16}
            y={26}
            textAnchor="end"
            className="fill-[#334155] font-mono"
            fontSize="11"
            fontWeight="600"
          >
            {regime === 'force'
              ? `δ = ${formatPct(rate, 2)} · Continua`
              : regime === 'simple'
                ? `i = ${formatPct(rate, 2)} · Interés Simple`
                : `i = ${formatPct(rate, 2)} · Compuesto`}
          </text>
        )}

        {/* Multi-rate shaded bands */}
        {segments && segments.length > 0 && (
          <g>
            {segments.map((seg, idx) => {
              const x1 = xOf(seg.start);
              const x2 = xOf(seg.end);
              const w = Math.max(4, x2 - x1);
              return (
                <g key={seg.id}>
                  <rect
                    x={x1}
                    y={HEADER_BOTTOM + 1}
                    width={w}
                    height={SVG_H - HEADER_BOTTOM - 28}
                    fill={segmentColors[idx % segmentColors.length]}
                    opacity="0.72"
                  />
                  <line
                    x1={x1}
                    y1={HEADER_BOTTOM}
                    x2={x1}
                    y2={SVG_H - 26}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {w > 64 && (
                    <text
                      x={(x1 + x2) / 2}
                      y={HEADER_BOTTOM + 15}
                      textAnchor="middle"
                      className="fill-[#334155] font-mono"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {truncateLabel(seg.label || `i = ${formatPct(seg.rate, 2)}`, Math.floor(w / 7))}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Vertical Reference Gridlines */}
        {ticks.map((t) => {
          const x = xOf(t);
          return (
            <line
              key={`grid-${t}`}
              x1={x}
              y1={HEADER_BOTTOM + 18}
              x2={x}
              y2={SVG_H - 32}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          );
        })}

        {/* Main Horizontal Time Axis */}
        <line
          x1={PAD_L - 14}
          y1={AXIS_Y}
          x2={SVG_W - PAD_R + 22}
          y2={AXIS_Y}
          stroke="#0F172A"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d={`M ${SVG_W - PAD_R + 15} ${AXIS_Y - 5} L ${SVG_W - PAD_R + 25} ${AXIS_Y} L ${SVG_W - PAD_R + 15} ${AXIS_Y + 5}`}
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Axis Ticks & Non-colliding Numbers */}
        {ticks.map((t) => {
          const x = xOf(t);
          const isFF = t === focalDate;
          const tooCloseToFF = !isFF && Math.abs(x - ffX) < 26;
          return (
            <g key={`tick-${t}`}>
              <line
                x1={x}
                y1={AXIS_Y - 5}
                x2={x}
                y2={AXIS_Y + 5}
                stroke={isFF ? '#EA580C' : '#475569'}
                strokeWidth={isFF ? 2.5 : 1.5}
              />
              {!tooCloseToFF && (
                <text
                  x={x}
                  y={AXIS_Y + 20}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize={isFF ? '11.5' : '10.5'}
                  fontWeight={isFF ? '700' : '500'}
                  fill={isFF ? '#EA580C' : '#475569'}
                >
                  {t}
                </text>
              )}
            </g>
          );
        })}
        <text
          x={SVG_W - 14}
          y={AXIS_Y + 20}
          textAnchor="end"
          className="fill-[#64748B] font-sans"
          fontSize="10"
          fontWeight="600"
        >
          ({periodLabel})
        </text>

        {/* Draggable Fecha Focal (FF) Vertical Marker */}
        <motion.g
          animate={{ x: ffX }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          <rect
            x={-12}
            y={HEADER_BOTTOM + 2}
            width={24}
            height={SVG_H - HEADER_BOTTOM - 32}
            fill="#EA580C"
            opacity="0.06"
          />
          <line
            x1={0}
            y1={HEADER_BOTTOM}
            x2={0}
            y2={SVG_H - 28}
            stroke="#EA580C"
            strokeWidth="2.2"
            strokeDasharray="5 4"
          />
          {/* Top FF Handle inside Header Band (never overlaps flow stems!) */}
          <rect
            x={-36}
            y={9}
            width={72}
            height={26}
            rx="6"
            fill="#EA580C"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <text
            x={0}
            y={26}
            textAnchor="middle"
            fill="#FFFFFF"
            className="font-mono"
            fontSize="11.5"
            fontWeight="700"
          >
            FF = {focalDate}
          </text>
          {/* Axis center diamond */}
          <polygon
            points="0,-6 6,0 0,6 -6,0"
            transform={`translate(0, ${AXIS_Y})`}
            fill="#EA580C"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Explicit FF number below axis if FF wasn't on a regular tick */}
          {!ticks.includes(focalDate) && (
            <text
              x={0}
              y={AXIS_Y + 20}
              textAnchor="middle"
              fill="#EA580C"
              className="font-mono"
              fontSize="11.5"
              fontWeight="700"
            >
              {focalDate}
            </text>
          )}
        </motion.g>

        {/* Render each cashflow with anti-overlap tier spacing */}
        {evaluatedFlows.map((ev) => {
          const { flow, landingTime, direction, moveFormulaLabel } = ev;
          const isDebt = flow.side === 'debt';
          const isHighlighted = highlightFlowId === flow.id;
          const dimOthers = Boolean(highlightFlowId && !isHighlighted);
          const opacity = dimOthers ? 0.3 : 1;

          const stemTier = layoutMap.stemTiers.get(flow.id) ?? 0;
          const arcTier = layoutMap.arcTiers.get(flow.id) ?? 0;

          const stemColor = flow.isUnknown ? '#EA580C' : isDebt ? '#0F172A' : '#334155';
          const moveColor =
            direction === 'forward'
              ? '#047857'
              : direction === 'backward'
                ? '#1D4ED8'
                : '#6D28D9';

          const landingX = xOf(landingTime);

          // Single flow
          if (flow.kind === 'single') {
            const fx = xOf(flow.startTime);
            const stemH = 48 + stemTier * 36; // 48, 84, 120 -> guarantees vertical clearance
            const stemTipY = isDebt ? AXIS_Y - stemH : AXIS_Y + stemH;
            const amountText = flow.isUnknown
              ? `${flow.unknownSymbol || 'X'} = ?`
              : formatCurrency(flow.amount);
            const subText = flow.label ? truncateLabel(flow.label, 18) : '';

            const textAnchorX = clampPillX(fx, Math.max(amountText.length * 6.5, subText.length * 5.8) + 12);
            const amountY = isDebt ? stemTipY - 10 : stemTipY + 15;
            const subY = isDebt ? amountY - 13 : amountY + 13;

            // Travel arc goes in dedicated outer lane above/below stems
            const arcPeakY = isDebt
              ? Math.max(HEADER_BOTTOM + 22, AXIS_Y - 118 - arcTier * 24)
              : Math.min(SVG_H - 36, AXIS_Y + 122 + arcTier * 24);
            const arcEndY = isDebt ? AXIS_Y - 10 : AXIS_Y + 10;
            const pathD = `M ${fx} ${stemTipY} Q ${(fx + ffX) / 2} ${arcPeakY} ${ffX} ${arcEndY}`;

            const pillText = `${direction === 'forward' ? '→ ' : '← '}${moveFormulaLabel}`;
            const pillW = measurePillWidth(pillText, 68);
            const midX = clampPillX((fx + ffX) / 2, pillW);
            const midY = (stemTipY + arcPeakY * 2 + arcEndY) / 4;

            return (
              <g
                key={flow.id}
                opacity={opacity}
                onClick={(e) => {
                  if (onSelectFlow) {
                    e.stopPropagation();
                    onSelectFlow(flow.id);
                  }
                }}
                className={onSelectFlow ? 'cursor-pointer' : undefined}
              >
                <line
                  x1={fx}
                  y1={AXIS_Y}
                  x2={fx}
                  y2={stemTipY}
                  stroke={stemColor}
                  strokeWidth={isHighlighted ? 3 : 2}
                />
                <circle
                  cx={fx}
                  cy={stemTipY}
                  r={isHighlighted ? 5.5 : 4.2}
                  fill={flow.isUnknown ? '#EA580C' : isDebt ? '#0F172A' : '#1E293B'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* Clean white halo behind text so gridlines/arcs never interfere */}
                <text
                  x={textAnchorX}
                  y={amountY}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="11"
                  fontWeight="700"
                  fill={flow.isUnknown ? '#C2410C' : '#0F172A'}
                  paintOrder="stroke"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                >
                  {amountText}
                </text>
                {subText && (
                  <text
                    x={textAnchorX}
                    y={subY}
                    textAnchor="middle"
                    className="font-sans"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#64748B"
                    paintOrder="stroke"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  >
                    {subText}
                  </text>
                )}

                {phase === 'all' && direction !== 'at_ff' && Math.abs(fx - ffX) > 8 && (
                  <g>
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={moveColor}
                      strokeWidth="1.8"
                      strokeDasharray="5 3.5"
                      markerEnd={
                        direction === 'forward' ? 'url(#arrow-forward)' : 'url(#arrow-backward)'
                      }
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.85 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    <rect
                      x={midX - pillW / 2}
                      y={midY - 9.5}
                      width={pillW}
                      height={19}
                      rx="4"
                      fill="#FFFFFF"
                      stroke={moveColor}
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY + 3.5}
                      textAnchor="middle"
                      fill={moveColor}
                      className="font-mono"
                      fontSize="9.8"
                      fontWeight="600"
                    >
                      {pillText}
                    </text>
                  </g>
                )}
              </g>
            );
          }

          // Annuity or Perpetuity
          const count =
            flow.kind === 'perpetuity'
              ? Math.min(6, Math.max(3, safeMax - flow.startTime + 1))
              : Math.max(1, flow.count || 1);
          const lastT = flow.kind === 'perpetuity' ? safeMax : flow.startTime + count - 1;
          const xStart = xOf(flow.startTime);
          const xEnd = xOf(Math.min(safeMax, lastT));
          const blockW = Math.max(12, xEnd - xStart + 10);

          const visibleStems: number[] = [];
          if (count <= 14) {
            for (let k = 0; k < count; k++) {
              const tk = flow.startTime + k;
              if (tk <= safeMax) visibleStems.push(tk);
            }
          } else {
            visibleStems.push(
              flow.startTime,
              flow.startTime + 1,
              flow.startTime + 2,
              Math.min(safeMax, lastT - 1),
              Math.min(safeMax, lastT)
            );
          }

          const stemEndY = isDebt ? AXIS_Y - 40 : AXIS_Y + 40;
          const bracketY = isDebt ? AXIS_Y - 46 : AXIS_Y + 46;
          const persp = flow.perspective || 'a';
          const pInfo = getPerspectiveInfo(persp);
          const symbolShort =
            flow.kind === 'perpetuity'
              ? persp === 'a_due'
                ? 'ä∞'
                : 'a∞'
              : `${pInfo.symbol.replace('ₙ', '')}${count}`;

          const landingY = isDebt ? AXIS_Y - 72 : AXIS_Y + 74;
          const landingBadgeText = `${symbolShort} en t=${landingTime}`;
          const landingBadgeW = measurePillWidth(landingBadgeText, 76);
          const landingBadgeX = clampPillX(landingX, landingBadgeW);

          const travelArcY = isDebt
            ? Math.max(HEADER_BOTTOM + 24, AXIS_Y - 134 - arcTier * 24)
            : Math.min(SVG_H - 36, AXIS_Y + 138 + arcTier * 24);
          const arcEndY = isDebt ? AXIS_Y - 12 : AXIS_Y + 12;
          const travelPath = `M ${landingX} ${landingY} Q ${(landingX + ffX) / 2} ${travelArcY} ${ffX} ${arcEndY}`;

          const travelPillText = `${direction === 'forward' ? '→ ' : '← '}${moveFormulaLabel}`;
          const travelPillW = measurePillWidth(travelPillText, 74);
          const tMidX = clampPillX((landingX + ffX) / 2, travelPillW);
          const tMidY = (landingY + travelArcY * 2 + arcEndY) / 4;

          const bracketLabel = `${flow.kind === 'perpetuity' ? '∞ × ' : `${count} × `}${
            flow.isUnknown ? `${flow.unknownSymbol || 'R'}?` : formatCurrency(flow.amount)
          }`;
          const bracketLabelX = clampPillX((xStart + xEnd) / 2, bracketLabel.length * 6.5 + 10);

          return (
            <g
              key={flow.id}
              opacity={opacity}
              onClick={(e) => {
                if (onSelectFlow) {
                  e.stopPropagation();
                  onSelectFlow(flow.id);
                }
              }}
              className={onSelectFlow ? 'cursor-pointer' : undefined}
            >
              <rect
                x={xStart - 5}
                y={isDebt ? stemEndY : AXIS_Y + 2}
                width={blockW}
                height={38}
                rx="4"
                fill={flow.isUnknown ? '#FFF7ED' : '#F8FAFC'}
                stroke={flow.isUnknown ? '#FDBA74' : '#CBD5E1'}
                strokeWidth="1"
              />

              {visibleStems.map((tk) => {
                const px = xOf(tk);
                return (
                  <g key={`${flow.id}-p-${tk}`}>
                    <line
                      x1={px}
                      y1={AXIS_Y}
                      x2={px}
                      y2={stemEndY}
                      stroke={stemColor}
                      strokeWidth="1.7"
                    />
                    <circle cx={px} cy={stemEndY} r="2.8" fill={stemColor} />
                  </g>
                );
              })}

              {(count > 14 || flow.kind === 'perpetuity') && blockW > 60 && (
                <text
                  x={(xStart + xEnd) / 2}
                  y={isDebt ? AXIS_Y - 17 : AXIS_Y + 24}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#64748B"
                >
                  {flow.kind === 'perpetuity' ? '⋯ ∞' : `⋯ ${count} pagos ⋯`}
                </text>
              )}

              <text
                x={bracketLabelX}
                y={isDebt ? bracketY - 5 : bracketY + 13}
                textAnchor="middle"
                className="font-mono"
                fontSize="10.5"
                fontWeight="700"
                fill={flow.isUnknown ? '#C2410C' : '#0F172A'}
                paintOrder="stroke"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              >
                {bracketLabel}
              </text>

              {/* Phase 1: Annuity Landing Point Marker */}
              {(phase === 'landing' || phase === 'all') && (
                <g>
                  <motion.path
                    d={`M ${(xStart + xEnd) / 2} ${bracketY} Q ${
                      ((xStart + xEnd) / 2 + landingX) / 2
                    } ${isDebt ? landingY - 10 : landingY + 10} ${landingX} ${landingY}`}
                    fill="none"
                    stroke="#6D28D9"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    markerEnd="url(#arrow-collapse)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ duration: 0.45 }}
                  />
                  <line
                    x1={landingX}
                    y1={AXIS_Y}
                    x2={landingX}
                    y2={landingY}
                    stroke="#6D28D9"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={landingX}
                    cy={landingY}
                    r="5"
                    fill="#6D28D9"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={landingBadgeX - landingBadgeW / 2}
                    y={isDebt ? landingY - 25 : landingY + 8}
                    width={landingBadgeW}
                    height={19}
                    rx="4"
                    fill="#F5F3FF"
                    stroke="#C4B5FD"
                    strokeWidth="1"
                  />
                  <text
                    x={landingBadgeX}
                    y={isDebt ? landingY - 12 : landingY + 21}
                    textAnchor="middle"
                    fill="#5B21B6"
                    className="font-mono"
                    fontSize="9.8"
                    fontWeight="700"
                  >
                    {landingBadgeText}
                  </text>
                </g>
              )}

              {/* Phase 2: Travel from Landing Point to FF */}
              {phase === 'all' && direction !== 'at_ff' && Math.abs(landingX - ffX) > 8 && (
                <g>
                  <motion.path
                    d={travelPath}
                    fill="none"
                    stroke={moveColor}
                    strokeWidth="2"
                    markerEnd={
                      direction === 'forward' ? 'url(#arrow-forward)' : 'url(#arrow-backward)'
                    }
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
                  />
                  <rect
                    x={tMidX - travelPillW / 2}
                    y={tMidY - 9.5}
                    width={travelPillW}
                    height={19}
                    rx="4"
                    fill="#FFFFFF"
                    stroke={moveColor}
                    strokeWidth="1.2"
                  />
                  <text
                    x={tMidX}
                    y={tMidY + 3.5}
                    textAnchor="middle"
                    fill={moveColor}
                    className="font-mono"
                    fontSize="9.8"
                    fontWeight="700"
                  >
                    {travelPillText}
                  </text>
                </g>
              )}

              {phase === 'all' && direction === 'at_ff' && (
                <text
                  x={landingBadgeX}
                  y={isDebt ? landingY - 31 : landingY + 39}
                  textAnchor="middle"
                  fill="#6D28D9"
                  className="font-mono"
                  fontSize="9.5"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                >
                  ★ Cae directo en FF (×1)
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Clean inline semantic legend */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[#475569]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#EA580C]">
            <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[#EA580C]" />
            Fecha Focal (FF)
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#1D4ED8]">
            <span>←</span>
            Descontar ({regime === 'force' ? 'e⁻δt' : 'vᵏ'})
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#047857]">
            <span>→</span>
            Capitalizar ({regime === 'force' ? 'e^δt' : '(1+i)ᵏ'})
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#6D28D9]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#6D28D9]" />
            Aterrizaje anualidad
          </span>
        </div>
        {interactiveFF && (
          <span className="text-[#64748B] font-mono text-[11px]">
            Arrastra o haz clic en la línea para mover FF
          </span>
        )}
      </div>
    </div>
  );
};
