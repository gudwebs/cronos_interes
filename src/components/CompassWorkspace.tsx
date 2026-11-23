import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, RefreshCw, ArrowRight, AlertTriangle, BookMarked } from 'lucide-react';
import {
  PERIOD_UNITS,
  RateInputType,
  convertInterestRate,
  formatPct,
} from '../lib/financeMath';
import { ActuarialSymbol, MathFraction, MathPower } from './MathExpr';

type GoalChoice = 'vp' | 'vf' | 'si' | 'n' | 'i' | 'perpetuity';
type TimingChoice = 'vencida' | 'anticipada' | 'diferida';
type GlossaryCategory = 'Todas' | 'Anualidades' | 'Tasas' | 'Amortización';

interface GlossaryEntry {
  id: string;
  category: Exclude<GlossaryCategory, 'Todas'>;
  term: string;
  notation: React.ReactNode;
  formula: React.ReactNode;
  plainMeaning: string;
  visualCue: string;
  example: string;
}

const GLOSSARY_TERMS: GlossaryEntry[] = [
  // ANUALIDADES
  {
    id: 'gl-an',
    category: 'Anualidades',
    term: 'Anualidad Vencida (Valor Presente)',
    notation: <ActuarialSymbol type="a" n="n" rateLabel="i" className="text-xl text-[#1D4ED8]" />,
    formula: (
      <span className="math-expr text-sm">
        <MathFraction num="1 − vⁿ" den="i" />
      </span>
    ),
    plainMeaning:
      'Suma descontada de n pagos iguales de $1 hechos al FINAL de cada periodo. Aterriza exactamente 1 periodo ANTES del primer pago.',
    visualCue: 'Aterriza en t = (1er pago − 1)',
    example: 'Si el 1er pago es en t = 4, a₆ cae en t = 3 (y luego aplicas v³ para t = 0).',
  },
  {
    id: 'gl-adue',
    category: 'Anualidades',
    term: 'Anualidad Anticipada (Valor Presente)',
    notation: <ActuarialSymbol type="a_due" n="n" rateLabel="i" className="text-xl text-[#6D28D9]" />,
    formula: (
      <span className="math-expr text-sm">
        <MathFraction num="1 − vⁿ" den="1 − v" /> = aₙ(1 + i)
      </span>
    ),
    plainMeaning:
      'Valor presente de n pagos iguales hechos al INICIO de cada periodo (empezando hoy). Aterriza justo EN el momento del primer pago.',
    visualCue: 'Aterriza en t = (1er pago)',
    example: 'Usada en rentas por adelantado y en Saldo Insoluto JUSTO ANTES de un pago (SIₖ⁻).',
  },
  {
    id: 'gl-sn',
    category: 'Anualidades',
    term: 'Valor Futuro Vencido',
    notation: <ActuarialSymbol type="s" n="n" rateLabel="i" className="text-xl text-[#047857]" />,
    formula: (
      <span className="math-expr text-sm">
        <MathFraction num="(1 + i)ⁿ − 1" den="i" />
      </span>
    ),
    plainMeaning:
      'Monto acumulado por n depósitos iguales de $1 evaluado exactamente EL DÍA del último depósito.',
    visualCue: 'Aterriza en t = (último pago)',
    example: 'En 30 depósitos trimestrales de $12,000, 12,000·s₃₀ cae justo al final del trimestre 30.',
  },
  {
    id: 'gl-sdue',
    category: 'Anualidades',
    term: 'Valor Futuro Anticipado',
    notation: <ActuarialSymbol type="s_due" n="n" rateLabel="i" className="text-xl text-[#EA580C]" />,
    formula: (
      <span className="math-expr text-sm">
        <MathFraction num="(1 + i)ⁿ − 1" den="1 − v" /> = sₙ(1 + i)
      </span>
    ),
    plainMeaning:
      'Monto acumulado por n depósitos evaluado exactamente 1 PERIODO DESPUÉS del último depósito (un periodo extra ganando interés).',
    visualCue: 'Aterriza en t = (último pago + 1)',
    example: 'Depósitos mensuales de $1,300 retirados 1 mes después del último depósito → 1,300·s̈ₙ.',
  },
  {
    id: 'gl-perpetuity',
    category: 'Anualidades',
    term: 'Perpetuidad (Renta Infinita)',
    notation: <ActuarialSymbol type="a_inf" rateLabel="i" className="text-xl text-[#0F172A]" />,
    formula: (
      <span className="math-expr text-sm">
        <MathFraction num="1" den="i" /> (vencida) · <MathFraction num="1" den="1 − v" /> (anticipada)
      </span>
    ),
    plainMeaning:
      'Serie de pagos iguales que continúan para siempre (n → ∞). Como vⁿ → 0, su Valor Presente es finito aunque nunca terminen los pagos.',
    visualCue: 'Solo existe VP (VF → ∞)',
    example: 'Pagos semestrales perpetuos de $5,000 con i_s = 7.1448% ⇒ D = 5,000 / 0.071448 = $69,981.34.',
  },
  {
    id: 'gl-v',
    category: 'Anualidades',
    term: 'Factor de Descuento (v) y Fecha Focal (FF)',
    notation: <MathPower base="v" exp="t" className="text-xl text-[#1D4ED8]" />,
    formula: (
      <span className="math-expr text-sm">
        v = <MathFraction num="1" den="1 + i" /> = (1 + i)⁻¹
      </span>
    ),
    plainMeaning:
      'Factor que trae $1 peso desde el futuro hacia atrás (izquierda) hasta la Fecha Focal (FF), quitándole los intereses de t periodos.',
    visualCue: '← Retrocede t periodos a FF',
    example: 'Traer $20,000 del mes 14 a FF = 0 al 2%: 20,000 · v¹⁴ = 20,000 / (1.02)¹⁴.',
  },

  // TASAS
  {
    id: 'gl-at',
    category: 'Tasas',
    term: 'Función de Acumulación y Monto',
    notation: <span className="math-expr text-xl text-[#0F172A]">a(t), A(t)</span>,
    formula: <span className="font-mono text-xs">A(t) = k · a(t) · a(0) = 1</span>,
    plainMeaning:
      'a(t) indica cuánto vale en el tiempo t una inversión inicial de $1 peso. Debe empezar en 1 y no decrecer. A(t) escala a un capital k.',
    visualCue: 'Base del Parcial 1',
    example: 'Interés simple: a(t) = 1 + it · Interés compuesto: a(t) = (1 + i)ᵗ.',
  },
  {
    id: 'gl-nominal',
    category: 'Tasas',
    term: 'Tasa Nominal Anual Convertible',
    notation: <MathPower base="i" exp="(m)" className="text-xl text-[#EA580C]" />,
    formula: (
      <span className="math-expr text-sm">
        i_cap = <MathFraction num="i⁽ᵐ⁾" den="m" />
      </span>
    ),
    plainMeaning:
      'Tasa anual "de etiqueta" que se capitaliza m veces al año. NUNCA entra directo a fórmulas: primero divídela entre m para sacar la tasa efectiva del periodo.',
    visualCue: 'Palabras clave: convertible / capitalizable',
    example: 'i⁽⁴⁾ = 16% anual convertible trimestralmente ⇒ i_t = 16% / 4 = 4% efectivo trimestral.',
  },
  {
    id: 'gl-nominal-custom',
    category: 'Tasas',
    term: 'Tasa Nominal NO Anual',
    notation: (
      <span className="math-expr text-xl text-[#6D28D9]">
        i<sub className="math-upright text-xs">s</sub>
        <sup className="math-upright text-xs">(6)</sup>
      </span>
    ),
    formula: (
      <span className="math-expr text-sm">
        i_cap = <MathFraction num="i_periodo⁽ᵐ⁾" den="m" />
      </span>
    ),
    plainMeaning:
      'Tasa nominal cotizada para un periodo distinto al año (ej. semestral o trimestral) que capitaliza m veces DENTRO de ese periodo.',
    visualCue: 'Divide entre los subperiodos que caben ahí',
    example: '14.4% semestral convertible trimestralmente (i_s⁽²⁾) ⇒ 14.4% / 2 = 7.2% trimestral.',
  },
  {
    id: 'gl-equiv',
    category: 'Tasas',
    term: 'Tasas Efectivas Equivalentes',
    notation: <span className="math-expr text-xl text-[#047857]">(1+i₁)ᵖ¹ = (1+i₂)ᵖ²</span>,
    formula: <span className="font-mono text-xs">i_nueva = (1 + i_orig)^(p_orig / p_nueva) − 1</span>,
    plainMeaning:
      'Dos tasas efectivas de distinta frecuencia son equivalentes cuando producen exactamente el mismo monto al final de 1 año.',
    visualCue: 'Efectiva → Efectiva usa potencia/raíz',
    example: 'De 12% efectiva anual a mensual: i_m = (1.12)^(1/12) − 1 = 0.9489%.',
  },
  {
    id: 'gl-delta',
    category: 'Tasas',
    term: 'Fuerza de Interés (Tasa Instantánea)',
    notation: <span className="math-expr text-xl text-[#1D4ED8]">δ</span>,
    formula: <span className="font-mono text-xs">1 + iₐ = e^δ  ⟺  δ = ln(1 + iₐ)</span>,
    plainMeaning:
      'Tasa de capitalización continua (m → ∞, intereses a cada instante). Para mover dinero usas e^(+δt) hacia adelante y e^(−δt) hacia atrás.',
    visualCue: 'M = C · e^(δt) · C = M · e^(−δt)',
    example: 'Con δ = 18% anual, descontar $5,000 por 4 meses es 5,000 · e^(−0.18 × 4/12).',
  },
  {
    id: 'gl-discount',
    category: 'Tasas',
    term: 'Tasa de Descuento y Relación con i',
    notation: <span className="math-expr text-xl text-[#0F172A]">d</span>,
    formula: (
      <span className="math-expr text-sm">
        d = <MathFraction num="i" den="1 + i" /> = 1 − v · i = <MathFraction num="d" den="1 − d" />
      </span>
    ),
    plainMeaning:
      'Porcentaje que se descuenta por adelantado sobre el Valor Nominal M de un pagaré (C = M(1 − dt)). Siempre se cumple que i > d.',
    visualCue: 'd = 1 − v (¡el denominador de äₙ y s̈ₙ!)',
    example: 'Un pagaré de $20,000 descontado 90 días al 18% da C = 20,000(1 − 0.18×90/360) = $19,100.',
  },

  // AMORTIZACIÓN
  {
    id: 'gl-si',
    category: 'Amortización',
    term: 'Saldo Insoluto (SIₖ)',
    notation: (
      <span className="math-expr text-xl text-[#EA580C]">
        SI<sub className="math-upright text-xs">k</sub>
      </span>
    ),
    formula: <span className="font-mono text-xs">SIₜ = SIₜ₋₁ − ACₜ</span>,
    plainMeaning:
      'Cantidad de capital que todavía debes en el periodo k (por defecto, justo DESPUÉS de realizar el pago k).',
    visualCue: 'Baja de D hasta $0 en el pago n',
    example: 'Si quieres liquidar un crédito antes de tiempo, pagas exactamente el Saldo Insoluto de esa fecha.',
  },
  {
    id: 'gl-prosp',
    category: 'Amortización',
    term: 'Método Prospectivo (Mirar al Futuro)',
    notation: (
      <span className="inline-flex items-baseline gap-1 text-xl text-[#1D4ED8]">
        <span className="math-expr">R ·</span>
        <ActuarialSymbol type="a" n="n−k" rateLabel="i" />
      </span>
    ),
    formula: <span className="font-mono text-xs">SIₖ = Valor Presente de los (n − k) pagos faltantes</span>,
    plainMeaning:
      'Calcula el saldo insoluto mirando hacia ADELANTE desde el corte k. Es el método más rápido cuando conoces n y los pagos futuros son regulares.',
    visualCue: '← Trae a k lo que falta por pagar',
    example: 'Préstamo a 120 meses, corte en mes 36: faltan 84 pagos ⇒ SI₃₆ = R · a₈₄.',
  },
  {
    id: 'gl-retro',
    category: 'Amortización',
    term: 'Método Retrospectivo (Mirar al Pasado)',
    notation: (
      <span className="inline-flex items-baseline gap-1 text-lg text-[#047857]">
        <span className="math-expr">D(1+i)ᵏ − R ·</span>
        <ActuarialSymbol type="s" n="k" rateLabel="i" />
      </span>
    ),
    formula: <span className="font-mono text-xs">SIₖ = Deuda acumulada − Pagos acumulados</span>,
    plainMeaning:
      'Calcula el saldo insoluto mirando hacia ATRÁS desde k. Obligatorio cuando NO conoces el número total de pagos n o el último pago es irregular.',
    visualCue: '→ Lleva D y los k pagos hechos a FF = k',
    example: 'Mercancía $99,000, abonos $17,200 sin conocer n ⇒ SI₄ = 99,000(1.012)⁴ − 17,200·s₄.',
  },
  {
    id: 'gl-before',
    category: 'Amortización',
    term: 'Saldo Justo Antes del Pago k (SIₖ⁻)',
    notation: (
      <span className="inline-flex items-baseline gap-1 text-xl text-[#6D28D9]">
        <span className="math-expr">R ·</span>
        <ActuarialSymbol type="a_due" n="n−k+1" rateLabel="i" />
      </span>
    ),
    formula: <span className="font-mono text-xs">SIₖ⁻ = SIₖ⁺ + R = SIₖ₋₁(1 + i)</span>,
    plainMeaning:
      'Saldo acumulado un instante ANTES de entregar el pago k (incluye los intereses generados ese periodo). Siempre es exactamente un pago R mayor que SIₖ⁺.',
    visualCue: 'Usa anticipada ä porque aún debes el pago de hoy',
    example: '5 pagos de $3,343.80 al 20%: justo antes del 3ro faltan 3 pagos ⇒ 3,343.80·ä₃ = $8,452.38.',
  },
  {
    id: 'gl-it-act',
    category: 'Amortización',
    term: 'Interés del Periodo (Iₜ) y Abono a Capital (ACₜ)',
    notation: (
      <span className="math-expr text-xl text-[#0F172A]">
        I<sub className="math-upright text-xs">t</sub>, AC<sub className="math-upright text-xs">t</sub>
      </span>
    ),
    formula: <span className="font-mono text-xs">Iₜ = SIₜ₋₁ · i · ACₜ = P − Iₜ</span>,
    plainMeaning:
      'En cada fila de una tabla de amortización primero se cobran intereses sobre el saldo anterior (Iₜ) y el sobrante del pago reduce la deuda (ACₜ).',
    visualCue: 'Iₜ baja y ACₜ crece geométricamente ×(1+i)',
    example: 'Préstamo $12,000 al 15%, pago $2,391.02: I₁ = $1,800 → AC₁ = $591.02 → SI₁ = $11,408.98.',
  },
  {
    id: 'gl-sinking',
    category: 'Amortización',
    term: 'Fondo de Acumulación (Sinking Fund)',
    notation: (
      <span className="inline-flex items-baseline gap-1 text-xl text-[#047857]">
        <span className="math-expr">R = M /</span>
        <ActuarialSymbol type="s" n="n" rateLabel="i" />
      </span>
    ),
    formula: <span className="font-mono text-xs">Iₜ = Fondoₜ₋₁ · i · Fondoₜ = Fondoₜ₋₁ + R + Iₜ</span>,
    plainMeaning:
      'Tabla espejo de la amortización: en vez de bajar una deuda a $0, haces depósitos periódicos R que ganan interés hasta acumular una meta M.',
    visualCue: 'Sube de $0 hasta tu meta M',
    example: 'Reunir $150,000 en 10 meses al 1.5%: depositas R = 150,000 / s₁₀ cada mes.',
  },
];

interface DecisionResult {
  title: string;
  formulaNode: React.ReactNode;
  landingWhere: string;
  directionNote: string;
  watchOut: string;
}

function getDecisionRecommendation(goal: GoalChoice, timing: TimingChoice): DecisionResult {
  if (goal === 'vp') {
    if (timing === 'vencida') {
      return {
        title: 'Valor Presente de Anualidad Vencida',
        formulaNode: (
          <span className="inline-flex items-center gap-1.5 text-lg">
            <span>VP = R · </span>
            <ActuarialSymbol type="a" n="n" rateLabel="i" />
            <span>= R ·</span>
            <MathFraction num="1 − vⁿ" den="i" />
          </span>
        ),
        landingWhere: 'Aterriza 1 periodo ANTES del primer pago (si el 1er pago es en t = 1, cae en t = 0).',
        directionNote: 'Hacia atrás (descuento). Si el 1er pago está en t = 1, ya está en t = 0 sin saltos extra.',
        watchOut: 'Asegúrate de que i y n estén en la misma unidad de tiempo que los pagos R.',
      };
    }
    if (timing === 'anticipada') {
      return {
        title: 'Valor Presente de Anualidad Anticipada',
        formulaNode: (
          <span className="inline-flex items-center gap-1.5 text-lg">
            <span>VP = R · </span>
            <ActuarialSymbol type="a_due" n="n" rateLabel="i" />
            <span>= R ·</span>
            <MathFraction num="1 − vⁿ" den="1 − v" />
          </span>
        ),
        landingWhere: 'Aterriza AL MOMENTO EXACTO del primer pago (si el 1er pago es hoy en t = 0, cae en t = 0).',
        directionNote: 'Notación de tus notas UDLAP: denominador (1 − v) = d, equivalente a aₙ(1+i).',
        watchOut: 'Muy útil también para Saldo Insoluto JUSTO ANTES de un pago (SIₖ⁻).',
      };
    }
    return {
      title: 'Anualidad Diferida (Primer pago en t = m > 1)',
      formulaNode: (
        <span className="inline-flex items-center gap-1.5 text-lg flex-wrap">
          <span>VP₀ = R · </span>
          <ActuarialSymbol type="a" n="n" rateLabel="i" />
          <span>· vᵐ⁻¹  =  R · </span>
          <ActuarialSymbol type="a_due" n="n" rateLabel="i" />
          <span>· vᵐ</span>
        </span>
      ),
      landingWhere: 'Con aₙ aterriza en (m − 1) y descuenta m − 1 pasos. Con äₙ aterriza en m y descuenta m pasos.',
      directionNote: 'También puedes poner FF = m − 1 para que D(1+i)ᵐ⁻¹ = R·aₙ.',
      watchOut: 'Nunca pongas aₙ · vᵐ cuando el primer pago es en t = m: restas 1 porque aₙ ya retrocedió 1 paso.',
    };
  }

  if (goal === 'vf') {
    if (timing === 'vencida') {
      return {
        title: 'Valor Futuro de Anualidad Vencida',
        formulaNode: (
          <span className="inline-flex items-center gap-1.5 text-lg">
            <span>VF = R · </span>
            <ActuarialSymbol type="s" n="n" rateLabel="i" />
            <span>= R ·</span>
            <MathFraction num="(1 + i)ⁿ − 1" den="i" />
          </span>
        ),
        landingWhere: 'Aterriza AL MOMENTO EXACTO del último pago/depósito.',
        directionNote: 'Hacia adelante (capitalización). Si te piden el saldo el mismo día del último depósito, esta es directa.',
        watchOut: 'Si el retiro ocurre DESPUÉS del último depósito, agrega (1+i)ᵏ o usa s̈ₙ si es exactamente 1 periodo después.',
      };
    }
    return {
      title: 'Valor Futuro de Anualidad Anticipada (o retiro 1 periodo después)',
      formulaNode: (
        <span className="inline-flex items-center gap-1.5 text-lg">
          <span>VF = R · </span>
          <ActuarialSymbol type="s_due" n="n" rateLabel="i" />
          <span>= R ·</span>
          <MathFraction num="(1 + i)ⁿ − 1" den="1 − v" />
        </span>
      ),
      landingWhere: 'Aterriza 1 periodo DESPUÉS del último pago/depósito.',
      directionNote: 'Ideal para fondos donde depositas al inicio de cada periodo o retiras 1 mes después del último depósito.',
      watchOut: 'Recuerda: s̈ₙ = sₙ(1 + i). El denominador (1 − v) ahorra multiplicar al final.',
    };
  }

  if (goal === 'si') {
    if (timing === 'anticipada') {
      return {
        title: 'Saldo Insoluto JUSTO ANTES del pago k (SIₖ⁻)',
        formulaNode: (
          <span className="inline-flex items-center gap-1.5 text-lg">
            <span>SIₖ⁻ = R · </span>
            <ActuarialSymbol type="a_due" n="n−k+1" rateLabel="i" />
            <span>= SIₖ⁺ + R</span>
          </span>
        ),
        landingWhere: 'FF = k (antes de entregar el pago k). Todavía debes el pago de hoy más los (n − k) siguientes.',
        directionNote: 'Traes hacia atrás (n − k + 1) pagos empezando hoy → ä_{n−k+1}.',
        watchOut: 'Trampa top de examen: NO uses a_{n−k}, te faltaría sumar el pago que todavía no das.',
      };
    }
    return {
      title: 'Saldo Insoluto JUSTO DESPUÉS del pago k (SIₖ⁺)',
      formulaNode: (
        <span className="inline-flex items-center gap-1.5 text-lg flex-wrap">
          <span>Prospectivo: R · </span>
          <ActuarialSymbol type="a" n="n−k" rateLabel="i" />
          <span className="mx-1 text-[#94A3B8]">|</span>
          <span>Retrospectivo: D(1+i)ᵏ − R · </span>
          <ActuarialSymbol type="s" n="k" rateLabel="i" />
        </span>
      ),
      landingWhere: 'Ambos métodos aterrizan exactamente en FF = k.',
      directionNote: 'Usa Prospectivo si conoces n y todos los pagos futuros son iguales. Usa Retrospectivo si NO conoces n.',
      watchOut: 'Si hay tasas cambiantes en el futuro, descuenta cada tramo con su propia tasa al hacer prospectivo.',
    };
  }

  if (goal === 'n') {
    return {
      title: 'Encontrar Tiempo / Número de Pagos (n) y Pago Extra',
      formulaNode: (
        <span className="inline-flex items-center gap-1.5 text-lg">
          <span>n = </span>
          <MathFraction num="−ln(1 − (VP/R)·i)" den="ln(1 + i)" />
        </span>
      ),
      landingWhere: 'Si n sale decimal (ej. 36.136), haces k = ⌊n⌋ pagos completos y un pago extra X.',
      directionNote: 'Extra en el último pago completo: D = R·aₖ + X·vᵏ. Extra 1 periodo después: D = R·aₖ + X·vᵏ⁺¹.',
      watchOut: 'NUNCA multipliques la parte decimal de n por R; siempre despeja X de la ecuación de valor.',
    };
  }

  if (goal === 'i') {
    return {
      title: 'Encontrar Tasa Efectiva Desconocida (i) por Interpolación',
      formulaNode: (
        <span className="inline-flex items-center gap-1.5 text-lg">
          <span>i₀ ≈ </span>
          <MathFraction num="2(n − VP/R)" den="(VP/R)(n + 1)" />
        </span>
      ),
      landingWhere: 'No se puede despejar i algebraicamente de aₙ o sₙ → usa interpolación lineal.',
      directionNote: 'Calcula i₀, prueba dos tasas cercanas A y B que encierren a VP/R, e iguala pendientes.',
      watchOut: 'Mientras más pegadas estén tus tasas A y B (ej. 0.5% de diferencia), más exacta será la interpolación.',
    };
  }

  return {
    title: 'Perpetuidad (Pagos Infinitos)',
    formulaNode: (
      <span className="inline-flex items-center gap-1.5 text-lg flex-wrap">
        <span>Vencida: </span>
        <ActuarialSymbol type="a_inf" rateLabel="i" />
        <span>= </span>
        <MathFraction num="1" den="i" />
        <span className="mx-2 text-[#94A3B8]">|</span>
        <span>Anticipada: </span>
        <ActuarialSymbol type="a_due_inf" rateLabel="i" />
        <span>= </span>
        <MathFraction num="1" den="1 − v" />
      </span>
    ),
    landingWhere: 'Igual que aₙ y äₙ: R/i cae 1 periodo antes del 1er pago; R/(1−v) cae en el 1er pago.',
    directionNote: 'Si es perpetuidad diferida (1er pago en t = m), multiplica (R/i) por vᵐ⁻¹ para llegar a t = 0.',
    watchOut: 'Las perpetuidades solo tienen Valor Presente (su Valor Futuro tiende a infinito).',
  };
}

interface CompassWorkspaceProps {
  focusSection?: 'glossary' | 'converter' | 'compass';
}

export const CompassWorkspace: React.FC<CompassWorkspaceProps> = ({ focusSection }) => {
  const [goal, setGoal] = useState<GoalChoice>('vp');
  const [timing, setTiming] = useState<TimingChoice>('diferida');

  // Rate converter state
  const [inputType, setInputType] = useState<RateInputType>('nominal_custom');
  const [ratePercent, setRatePercent] = useState<number>(8);
  const [inputPeriodPerYear, setInputPeriodPerYear] = useState<number>(2);
  const [compoundingSubM, setCompoundingSubM] = useState<number>(6);
  const [targetPeriodPerYear, setTargetPeriodPerYear] = useState<number>(12);

  // Visual Glossary state
  const [glossaryFilter, setGlossaryFilter] = useState<GlossaryCategory>('Todas');

  const glossaryRef = useRef<HTMLDivElement | null>(null);
  const converterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (focusSection === 'glossary' && glossaryRef.current) {
      glossaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (focusSection === 'converter' && converterRef.current) {
      converterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusSection]);

  const decision = useMemo(() => getDecisionRecommendation(goal, timing), [goal, timing]);

  const conversion = useMemo(
    () =>
      convertInterestRate({
        inputType,
        ratePercent,
        inputPeriodPerYear,
        compoundingPerInputPeriod: compoundingSubM,
        targetPeriodPerYear,
      }),
    [inputType, ratePercent, inputPeriodPerYear, compoundingSubM, targetPeriodPerYear]
  );

  const filteredGlossary = useMemo(
    () =>
      glossaryFilter === 'Todas'
        ? GLOSSARY_TERMS
        : GLOSSARY_TERMS.filter((item) => item.category === glossaryFilter),
    [glossaryFilter]
  );

  const targetUnitLabel =
    PERIOD_UNITS.find((u) => u.perYear === targetPeriodPerYear)?.label.toLowerCase() || 'periodo';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Brújula de Métodos, Convertidor de Tasas y Glosario Visual
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Decide qué fórmula usar, convierte cualquier tasa (efectiva, nominal/convertible, descuento o δ) y consulta cada símbolo actuarial.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => converterRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1.5 rounded-md border border-[#CBD5E1] bg-white text-[#334155] hover:border-[#0F172A] cursor-pointer"
          >
            Ir a Convertidor
          </button>
          <button
            onClick={() => glossaryRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1.5 rounded-md border border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#1E293B] cursor-pointer"
          >
            Ir a Glosario Visual ({GLOSSARY_TERMS.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE DECISION COMPASS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#EA580C]" />
            <h2 className="font-display text-base font-semibold text-[#0F172A]">
              1. ¿Qué estás buscando en el problema?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'vp', label: 'Valor Presente / Deuda / R' },
                { id: 'vf', label: 'Valor Futuro / Ahorro' },
                { id: 'si', label: 'Saldo Insoluto (SIₖ)' },
                { id: 'n', label: 'Tiempo n / Pago Extra' },
                { id: 'i', label: 'Tasa desconocida (i)' },
                { id: 'perpetuity', label: 'Perpetuidad (∞)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setGoal(opt.id)}
                className={`px-3 py-2 text-left text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  goal === opt.id
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {(goal === 'vp' || goal === 'vf' || goal === 'si') && (
            <div className="pt-2 border-t border-[#F1F5F9]">
              <div className="text-xs font-semibold text-[#475569] mb-2">
                2. ¿Cuándo ocurre el primer flujo o el corte?
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(goal === 'si'
                  ? ([
                      { id: 'vencida', label: 'Justo después (k⁺)' },
                      { id: 'anticipada', label: 'Justo antes (k⁻)' },
                    ] as const)
                  : goal === 'vf'
                    ? ([
                        { id: 'vencida', label: 'En el último pago' },
                        { id: 'anticipada', label: '1 periodo después' },
                      ] as const)
                    : ([
                        { id: 'vencida', label: 'Vencida (t=1)' },
                        { id: 'anticipada', label: 'Anticipada (t=0)' },
                        { id: 'diferida', label: 'Diferida (t>1)' },
                      ] as const)
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTiming(t.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      timing === t.id
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#EA580C]'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#EA580C]">
              Fórmula recomendada (Notación actuarial)
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0F172A] mt-0.5">
              {decision.title}
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-[#0F172A] text-white overflow-x-auto">
            {decision.formulaNode}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#4C1D95]">
              <div className="font-semibold text-[#6D28D9] mb-1">Dónde aterriza en la línea</div>
              <p>{decision.landingWhere}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A]">
              <div className="font-semibold text-[#1D4ED8] mb-1">Cómo usarla / Dirección</div>
              <p>{decision.directionNote}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
            <div>
              <span className="font-semibold">Ojo en el examen: </span>
              {decision.watchOut}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: VISUAL RATE CONVERTER */}
      <div
        ref={converterRef}
        className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F172A] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#1D4ED8]" />
              Convertidor Paso a Paso de Tasas de Interés
            </h2>
            <p className="text-xs text-[#64748B]">
              Regla de oro: nunca metas una tasa nominal directo a la fórmula. Primero divídela y luego iguala al periodo de tus pagos.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setInputType('nominal_annual');
                setRatePercent(16);
                setCompoundingSubM(4);
                setTargetPeriodPerYear(4);
              }}
              className="px-2.5 py-1 text-[11px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
            >
              Ej: i⁽⁴⁾ = 16% → trim
            </button>
            <button
              onClick={() => {
                setInputType('nominal_custom');
                setRatePercent(14.4);
                setInputPeriodPerYear(2);
                setCompoundingSubM(2);
                setTargetPeriodPerYear(4);
              }}
              className="px-2.5 py-1 text-[11px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
            >
              Ej: i_s⁽²⁾ = 14.4% → trim
            </button>
            <button
              onClick={() => {
                setInputType('effective');
                setRatePercent(10);
                setInputPeriodPerYear(2);
                setTargetPeriodPerYear(6);
              }}
              className="px-2.5 py-1 text-[11px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
            >
              Ej: i_s=10% → bim (Asesorías)
            </button>
            <button
              onClick={() => {
                setInputType('force');
                setRatePercent(18);
                setTargetPeriodPerYear(1);
              }}
              className="px-2.5 py-1 text-[11px] font-mono bg-[#F8FAFC] border border-[#CBD5E1] rounded hover:border-[#0F172A] cursor-pointer"
            >
              Ej: δ = 18% → anual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#475569] mb-1.5">
                Tipo de tasa que te da el enunciado
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'effective', label: 'Efectiva (i)' },
                    { id: 'nominal_annual', label: 'Nominal anual i⁽ᵐ⁾' },
                    { id: 'nominal_custom', label: 'Nominal NO anual i_s⁽ᵐ⁾' },
                    { id: 'discount', label: 'Descuento efectivo (d)' },
                    { id: 'force', label: 'Fuerza de interés (δ)' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setInputType(item.id)}
                    className={`px-2.5 py-2 rounded-md border text-left font-medium transition-colors cursor-pointer ${
                      inputType === item.id
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:border-[#94A3B8]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#475569] mb-1">Valor de la tasa (%)</label>
                <input
                  type="number"
                  step={0.25}
                  value={ratePercent}
                  onChange={(e) => setRatePercent(Math.max(0, Number(e.target.value)))}
                  className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] text-[#0F172A]"
                />
              </div>

              {(inputType === 'effective' ||
                inputType === 'discount' ||
                inputType === 'nominal_custom') && (
                <div>
                  <label className="block font-medium text-[#475569] mb-1">Periodo cotizado</label>
                  <select
                    value={inputPeriodPerYear}
                    onChange={(e) => setInputPeriodPerYear(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[#0F172A]"
                  >
                    {PERIOD_UNITS.map((u) => (
                      <option key={u.id} value={u.perYear}>
                        {u.label} ({u.perYear}/año)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(inputType === 'nominal_annual' || inputType === 'nominal_custom') && (
                <div>
                  <label className="block font-medium text-[#475569] mb-1">
                    {inputType === 'nominal_annual'
                      ? 'Capitalizaciones/año (m)'
                      : 'Sub-periodos dentro del periodo'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={compoundingSubM}
                    onChange={(e) => setCompoundingSubM(Math.max(1, Number(e.target.value)))}
                    className="w-full font-mono px-2.5 py-1.5 rounded border border-[#CBD5E1] text-[#0F172A]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <label className="block font-semibold text-[#1D4ED8] mb-1">
                Convertir a tasa efectiva para pagos en frecuencia:
              </label>
              <select
                value={targetPeriodPerYear}
                onChange={(e) => setTargetPeriodPerYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded border border-[#93C5FD] bg-[#EFF6FF] font-medium text-[#1E3A8A]"
              >
                {PERIOD_UNITS.map((u) => (
                  <option key={u.id} value={u.perYear}>
                    {u.label} ({u.perYear} periodos por año)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                <div className="text-[11px] font-semibold text-[#1D4ED8] uppercase">
                  Tasa efectiva {targetUnitLabel}
                </div>
                <div className="font-mono text-xl font-bold text-[#1E3A8A] mt-0.5 tabular-nums">
                  {formatPct(conversion.targetEffective, 4)}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[11px] font-semibold text-[#64748B] uppercase">
                  Efectiva Anual (i_a)
                </div>
                <div className="font-mono text-lg font-bold text-[#0F172A] mt-0.5 tabular-nums">
                  {formatPct(conversion.effectiveAnnual, 4)}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[11px] font-semibold text-[#64748B] uppercase">
                  Fuerza (δ) / Desc. (d)
                </div>
                <div className="font-mono text-sm font-semibold text-[#0F172A] mt-1 tabular-nums">
                  δ = {formatPct(conversion.forceOfInterest, 3)}
                </div>
                <div className="font-mono text-xs text-[#64748B] tabular-nums">
                  d = {formatPct(conversion.effectiveDiscount, 3)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {conversion.steps.map((st) => (
                <div
                  key={st.title}
                  className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#FCFDFF] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#0F172A]">{st.title}</div>
                    <div className="font-mono text-[#475569] mt-0.5">{st.formula}</div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#047857]">
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>{st.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: GLOSARIO VISUAL CON NOTACIÓN ACTUARIAL */}
      <section
        ref={glossaryRef}
        className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F172A] flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#EA580C]" />
              Glosario Visual con Notación Actuarial
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Definiciones claras en español con símbolos exactos de tus notas y diapositivas. Filtra por tema:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filtrar glosario">
            {(['Todas', 'Anualidades', 'Tasas', 'Amortización'] as GlossaryCategory[]).map((cat) => {
              const count =
                cat === 'Todas'
                  ? GLOSSARY_TERMS.length
                  : GLOSSARY_TERMS.filter((t) => t.category === cat).length;
              const active = glossaryFilter === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGlossaryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:border-[#94A3B8]'
                  }`}
                >
                  {cat} · {count}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGlossary.map((item) => (
            <article
              key={item.id}
              className="border border-[#E2E8F0] rounded-xl p-4 bg-[#FCFDFF] flex flex-col justify-between space-y-3 hover:border-[#94A3B8] transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                      {item.category}
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#0F172A] mt-0.5 leading-snug">
                      {item.term}
                    </h3>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shrink-0">
                    {item.notation}
                  </div>
                </div>

                <div className="px-3 py-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
                  {item.formula}
                </div>

                <p className="text-xs text-[#334155] leading-relaxed">{item.plainMeaning}</p>
              </div>

              <div className="pt-2.5 border-t border-[#F1F5F9] space-y-1">
                <div className="text-[11px] font-mono font-semibold text-[#EA580C]">
                  {item.visualCue}
                </div>
                <p className="text-[11px] text-[#64748B] leading-snug">{item.example}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
