import React from 'react';
import type { AnnuityPerspective } from '../lib/financeMath';

interface ActuarialSymbolProps {
  type: AnnuityPerspective | 'a_inf' | 'a_due_inf';
  n?: number | string;
  rateLabel?: string;
  className?: string;
}

/** Renders crisp UDLAP actuarial symbols: a_{n|i}, ä_{n|i}, s_{n|i}, s̈_{n|i} */
export const ActuarialSymbol: React.FC<ActuarialSymbolProps> = ({
  type,
  n = 'n',
  rateLabel,
  className = '',
}) => {
  const isDue = type === 'a_due' || type === 's_due' || type === 'a_due_inf';
  const baseChar = type === 's' || type === 's_due' ? 's' : 'a';
  const angleText = type === 'a_inf' || type === 'a_due_inf' ? '∞' : String(n);

  return (
    <span className={`math-expr inline-flex items-baseline ${className}`}>
      <span className={isDue ? 'act-ddot font-semibold' : 'font-semibold'}>{baseChar}</span>
      <span className="act-angle">{angleText}</span>
      {rateLabel && (
        <span className="math-upright text-[0.72em] ml-0.5 translate-y-[0.22em] opacity-85">
          {rateLabel}
        </span>
      )}
    </span>
  );
};

interface FractionProps {
  num: React.ReactNode;
  den: React.ReactNode;
  className?: string;
}

export const MathFraction: React.FC<FractionProps> = ({ num, den, className = '' }) => (
  <span className={`math-frac ${className}`}>
    <span className="math-frac-num">{num}</span>
    <span className="math-frac-den">{den}</span>
  </span>
);

interface PowerProps {
  base: React.ReactNode;
  exp: React.ReactNode;
  className?: string;
}

export const MathPower: React.FC<PowerProps> = ({ base, exp, className = '' }) => (
  <span className={`math-expr inline-flex items-baseline ${className}`}>
    <span>{base}</span>
    <sup className="math-upright text-[0.72em] leading-none ml-[1px] -translate-y-[0.35em]">
      {exp}
    </sup>
  </span>
);
