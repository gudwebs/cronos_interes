import type { InterestRegime, RateSegment, TimelineFlow } from '../lib/financeMath';

export type ParcialId = 'P3' | 'P2' | 'P1';

export interface ExerciseCheckQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GuidedExercise {
  id: string;
  parcial: ParcialId;
  sourceRef: string;
  title: string;
  topicTag: string;
  difficulty: 'Base' | 'Intermedio' | 'Examen';
  statement: string;
  timeline: {
    maxTime: number;
    defaultFF: number;
    altFF?: number;
    altFFLabel?: string;
    rate: number;
    regime?: InterestRegime;
    periodLabel: string;
    flows: TimelineFlow[];
    segments?: RateSegment[];
    allowPerspectiveSwitch?: boolean;
  };
  step1: {
    summary: string;
    rateConversion: string;
    checkpoint: ExerciseCheckQuestion;
  };
  step2: {
    summary: string;
    landingInsight: string;
  };
  step3: {
    summary: string;
    whyThisFF: string;
    checkpoint: ExerciseCheckQuestion;
  };
  step4: {
    hint1: string;
    hint2: string;
    equationDisplay: string;
    algebraSteps: string[];
    finalAnswer: string;
    notebookNote?: string;
  };
}

export const GUIDED_EXERCISES: GuidedExercise[] = [
  // ================= PARCIAL 3 (INTERES3NOTAS + ASESORÍAS + TAREA ANUALIDADES + TABLAS) =================
  {
    id: 'p3-ej1-diferida',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 29 Oct (pág. 1)',
    title: 'Anualidad Diferida: Las 4 Formas Equivalentes',
    topicTag: 'Anualidad diferida · 4 fórmulas',
    difficulty: 'Base',
    statement:
      'Se liquida una deuda D con 6 pagos mensuales de $450. El primer pago se realiza al final del mes 4 (pagos en t = 4, 5, 6, 7, 8, 9). Si la tasa es 3% efectiva mensual, ¿cuál es el monto original de la deuda D en t = 0?',
    timeline: {
      maxTime: 12,
      defaultFF: 0,
      altFF: 3,
      altFFLabel: 'Probar FF = 3 (donde cae a₆)',
      rate: 0.03,
      periodLabel: 'meses',
      allowPerspectiveSwitch: true,
      flows: [
        {
          id: 'd1',
          label: 'Deuda hoy',
          side: 'debt',
          kind: 'single',
          amount: 2230.87,
          isUnknown: true,
          unknownSymbol: 'D',
          startTime: 0,
        },
        {
          id: 'p1',
          label: '6 pagos de $450',
          side: 'payment',
          kind: 'annuity',
          amount: 450,
          startTime: 4,
          count: 6,
          perspective: 'a',
        },
      ],
    },
    step1: {
      summary: 'La tasa ya está dada como 3% efectiva mensual y los pagos son mensuales: no hay que convertir tasa.',
      rateConversion: 'i = 3% = 0.03 mensual · v = 1 / 1.03 ≈ 0.970874 · n = 6 pagos',
      checkpoint: {
        prompt: 'Si el primer pago es en t = 4 y usas VP vencida (a₆), ¿en qué mes cae el valor de a₆?',
        options: ['En t = 0', 'En t = 3 (un mes antes del primer pago)', 'En t = 4 (el día del primer pago)'],
        correctIndex: 1,
        explanation:
          'Exacto: aₙ SIEMPRE aterriza un periodo antes del primer pago. Como el primer pago está en t = 4, a₆ cae en t = 3 y luego falta descontar 3 meses (v³) hasta t = 0.',
      },
    },
    step2: {
      summary: 'D está arriba en t = 0. Los 6 pagos de $450 están abajo en t = 4, 5, 6, 7, 8 y 9.',
      landingInsight:
        'Cambia los botones de perspectiva (a₆, ä₆, s₆, s̈₆) arriba del diagrama: verás que cada fórmula aterriza en un punto distinto (t=3, t=4, t=9 o t=10), pero al viajar a FF = 0 las 4 dan exactamente $2,230.87.',
    },
    step3: {
      summary: 'Con FF = 0, la deuda D queda despejada desde el inicio y la anualidad viaja hacia atrás (descuento).',
      whyThisFF:
        'Poner FF = 0 evita multiplicar D. También puedes probar FF = 3 (donde aterriza a₆) y verás que D(1.03)³ = 450·a₆ da exactamente el mismo valor.',
      checkpoint: {
        prompt: 'Si decidieras usar ä₆ (anticipada, que cae en t = 4) con FF = 0, ¿por qué factor debes multiplicarla?',
        options: ['v³', 'v⁴ (son 4 meses de t=4 a t=0)', '(1.03)⁴'],
        correctIndex: 1,
        explanation:
          'Correcto: ä₆ cae justo en el primer pago (t = 4). Para retroceder de t = 4 a FF = 0 necesitas v⁴.',
      },
    },
    step4: {
      hint1: 'Calcula primero el factor de la anualidad a₆ = (1 − 1.03⁻⁶) / 0.03.',
      hint2: 'Multiplica 450 × a₆ para obtener el valor en t = 3 ($2,437.74), y luego descuéntalo 3 periodos con v³ = 1.03⁻³.',
      equationDisplay: 'D = 450 · a₆|0.03 · v³  =  450 · ä₆ · v⁴  =  450 · s₆ · v⁹  =  450 · s̈₆ · v¹⁰',
      algebraSteps: [
        'a₆|0.03 = (1 − 1.03⁻⁶) / 0.03 = 5.417191',
        'Valor en t = 3: 450 × 5.417191 = $2,437.74',
        'Traemos de t = 3 a t = 0: D = 2,437.74 × (1.03)⁻³ = $2,230.87',
      ],
      finalAnswer: 'D = $2,230.87',
      notebookNote:
        'En tu libreta del 29 de octubre anotaste las 4 formas equivalentes (a₆v³, ä₆v⁴, s₆v⁹, s̈₆v¹⁰) y además moviste la FF a t=3, t=4 y t=12.',
    },
  },
  {
    id: 'p3-ej2-trimestral',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 29 Oct (pág. 1)',
    title: 'Préstamo Trimestral Diferido (Nominal i⁽⁴⁾ y Despeje de R)',
    topicTag: 'Nominal i⁽⁴⁾ · Anualidad diferida',
    difficulty: 'Base',
    statement:
      'Se obtiene un préstamo de $50,000 a pagar con pagos trimestrales iguales R durante 2 años. El primer pago se hace exactamente 1 año después de recibir el préstamo. Si la tasa es 16% anual convertible trimestralmente (i⁽⁴⁾ = 16%), calcula el monto de cada pago R.',
    timeline: {
      maxTime: 12,
      defaultFF: 0,
      altFF: 3,
      altFFLabel: 'Probar FF = 3 (evita v³ en R)',
      rate: 0.04,
      periodLabel: 'trimestres',
      allowPerspectiveSwitch: true,
      flows: [
        { id: 'd2', label: 'Préstamo', side: 'debt', kind: 'single', amount: 50000, startTime: 0 },
        {
          id: 'p2',
          label: '8 pagos trimestrales',
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
    step1: {
      summary: 'La tasa es nominal anual convertible trimestralmente: divide entre 4. El plazo son 2 años = 8 trimestres.',
      rateConversion: 'i = i⁽⁴⁾ / 4 = 16% / 4 = 4% efectivo trimestral · 1 año = 4 trimestres',
      checkpoint: {
        prompt: 'Si el primer pago se hace al cumplir 1 año y los periodos son trimestres, ¿en qué t cae el primer pago y cuántos pagos son?',
        options: ['Primer pago en t = 1, n = 2', 'Primer pago en t = 4, n = 8 (t = 4 a t = 11)', 'Primer pago en t = 4, n = 4'],
        correctIndex: 1,
        explanation:
          '¡Bien! 1 año = 4 trimestres (primer pago en t = 4) y 2 años de pagos trimestrales son n = 8 pagos (t = 4..11).',
      },
    },
    step2: {
      summary: '$50,000 está en t = 0. Los 8 pagos R corren desde t = 4 hasta t = 11.',
      landingInsight:
        'Si eliges a₈, la fórmula cae en t = 3 (un trimestre antes de t = 4). Solo faltan 3 trimestres de descuento (v³) hasta t = 0.',
    },
    step3: {
      summary: 'Puedes elegir FF = 0 (descuentas a₈ con v³) o FF = 3 (capitalizas $50,000 tres trimestres).',
      whyThisFF: 'En FF = 3 el lado de R queda limpiecito: 50,000(1.04)³ = R · a₈.',
      checkpoint: {
        prompt: 'Si pones FF = 3 y usas a₈ (que cae en t = 3), ¿hacia dónde se mueve el préstamo de $50,000 que está en t = 0?',
        options: ['Hacia adelante 3 trimestres: × (1.04)³', 'Hacia atrás 3 trimestres: × v³', 'No se mueve'],
        correctIndex: 0,
        explanation: 'De t = 0 hacia FF = 3 avanzas en el tiempo (+3 trimestres), así que capitalizas con (1.04)³.',
      },
    },
    step4: {
      hint1: 'Calcula a₈|0.04 = (1 − 1.04⁻⁸) / 0.04 = 6.732745.',
      hint2: 'En FF = 0: 50,000 = R · a₈ · (1.04)⁻³ = R · 5.985386.',
      equationDisplay: '50,000 = R · a₈|0.04 · v³   ⟺   50,000(1.04)³ = R · a₈|0.04',
      algebraSteps: [
        'a₈|0.04 = (1 − 1.04⁻⁸) / 0.04 = 6.732745',
        'Factor en t = 0: 6.732745 × (1.04)⁻³ = 5.985386',
        'Despeje: R = 50,000 / 5.985386 = $8,353.68',
      ],
      finalAnswer: 'R = $8,353.68 cada trimestre',
    },
  },
  {
    id: 'p3-ej3-tiempo-n',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 3 Nov (pág. 2)',
    title: 'Encontrar n: Retiro 1 Mes Después del Último Depósito',
    topicTag: 'Incógnita n · VF Anticipada s̈ₙ',
    difficulty: 'Intermedio',
    statement:
      'Una persona deposita $1,300 mensuales en un fondo que paga 1% efectivo mensual. Si desea acumular $56,559.94 y retirarlos exactamente 1 mes después de haber realizado el último depósito, ¿cuántos depósitos n debe hacer?',
    timeline: {
      maxTime: 38,
      defaultFF: 37,
      rate: 0.01,
      periodLabel: 'meses',
      flows: [
        {
          id: 'dep3',
          label: 'n depósitos de $1,300',
          side: 'debt',
          kind: 'annuity',
          amount: 1300,
          startTime: 1,
          count: 36,
          perspective: 's_due',
        },
        { id: 'ret3', label: 'Meta a retirar', side: 'payment', kind: 'single', amount: 56559.94, startTime: 37 },
      ],
    },
    step1: {
      summary: 'Tasa ya efectiva mensual (i = 1%). La palabra clave es "1 mes después del último depósito".',
      rateConversion: 'i = 1% = 0.01 · v = 1 / 1.01 · 1 − v = 0.01 / 1.01 ≈ 0.009901',
      checkpoint: {
        prompt: '¿Qué fórmula de Valor Futuro aterriza exactamente 1 periodo DESPUÉS del último depósito?',
        options: ['sₙ (VF vencida)', 's̈ₙ (VF anticipada)', 'aₙ (VP vencida)'],
        correctIndex: 1,
        explanation:
          'sₙ cae EL DÍA del último depósito, pero s̈ₙ cae UN PERIODO DESPUÉS del último depósito — justo donde ocurre el retiro.',
      },
    },
    step2: {
      summary: 'Los depósitos van en t = 1, 2, ..., n y el retiro de $56,559.94 ocurre en t = n + 1.',
      landingInsight:
        'Al elegir s̈ₙ, su punto de aterrizaje (t = n + 1) coincide exacto con la fecha del retiro.',
    },
    step3: {
      summary: 'Ponemos FF = n + 1 (la fecha del retiro). Así igualamos directamente 56,559.94 = 1,300 · s̈ₙ.',
      whyThisFF: 'Evita descontar el retiro 1 mes.',
      checkpoint: {
        prompt: 'En s̈ₙ = ((1+i)ⁿ − 1) / (1 − v), ¿cómo despejas el exponente n?',
        options: ['Dividiendo entre n', 'Aislando (1.01)ⁿ y aplicando ln()', 'Usando raíz cuadrada'],
        correctIndex: 1,
        explanation: 'Siempre que la incógnita sea n, aísla (1+i)ⁿ o vⁿ y aplica logaritmo natural ln().',
      },
    },
    step4: {
      hint1: 'Divide 56,559.94 / 1,300 = 43.507646.',
      hint2: 'Multiplica 43.507646 por (1 − v) = 0.00990099 para obtener 0.430769 = (1.01)ⁿ − 1.',
      equationDisplay: '56,559.94 = 1,300 · s̈ₙ|0.01  ⇒  (1.01)ⁿ = 1.430769',
      algebraSteps: [
        's̈ₙ = 56,559.94 / 1,300 = 43.507646',
        '1 − v = 1 − (1 / 1.01) = 0.00990099',
        '(1.01)ⁿ = 1 + 43.507646 × 0.00990099 = 1.430769',
        'n = ln(1.430769) / ln(1.01) = 36',
      ],
      finalAnswer: 'n = 36 depósitos mensuales',
    },
  },
  {
    id: 'p3-ej4-pago-extra-despues',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 3 Nov (pág. 2)',
    title: 'Pago Extra 1 Mes Después del Último Pago Completo',
    topicTag: 'n no entero · Pago extra en t = n+1',
    difficulty: 'Intermedio',
    statement:
      'Se liquida una deuda de $79,000 con pagos mensuales vencidos de $3,175 a una tasa de i⁽¹²⁾ = 26%. ¿Cuántos pagos completos se requieren y de cuánto será el pago extra X hecho 1 mes después del último pago completo?',
    timeline: {
      maxTime: 38,
      defaultFF: 0,
      altFF: 37,
      altFFLabel: 'Probar FF = 37 (donde está X)',
      rate: 0.26 / 12,
      periodLabel: 'meses',
      flows: [
        { id: 'd4', label: 'Deuda inicial', side: 'debt', kind: 'single', amount: 79000, startTime: 0 },
        {
          id: 'p4',
          label: '36 pagos completos',
          side: 'payment',
          kind: 'annuity',
          amount: 3175,
          startTime: 1,
          count: 36,
          perspective: 'a',
        },
        {
          id: 'x4',
          label: 'Pago extra',
          side: 'payment',
          kind: 'single',
          amount: 437.94,
          isUnknown: true,
          unknownSymbol: 'X',
          startTime: 37,
        },
      ],
    },
    step1: {
      summary: 'Convierte i⁽¹²⁾ = 26% a efectiva mensual exacta y despeja n preliminar.',
      rateConversion: 'i = 26% / 12 = 2.166667% mensual (¡guárdalo sin redondear en la calculadora!)',
      checkpoint: {
        prompt: 'Al despejar n obtienes 36.136 pagos. ¿Cómo encuentras el pago extra X en el mes 37?',
        options: [
          'Multiplicando 0.136 × 3,175 directo',
          'Planteando 79,000 = 3,175 · a₃₆ + X · v³⁷ y despejando X',
          'Haciendo 37 pagos iguales de $3,175',
        ],
        correctIndex: 1,
        explanation:
          'Nunca multipliques el decimal directo por R: plantea siempre la ecuación de valor con los 36 pagos completos + X en t = 37.',
      },
    },
    step2: {
      summary: 'Los 36 pagos completos están en t = 1..36 (a₃₆ cae en t = 0). El pago extra X cae en t = 37.',
      landingInsight: 'a₃₆ aterriza exacto en t = 0, y X en t = 37 solo retrocede con v³⁷.',
    },
    step3: {
      summary: 'Con FF = 0: 79,000 = 3,175·a₃₆ + X·v³⁷.',
      whyThisFF: 'Restas 79,000 − 3,175·a₃₆ y multiplicas esa diferencia por (1+i)³⁷.',
      checkpoint: {
        prompt: 'Si X está en t = 37 y FF = 0, ¿por qué factor multiplicas X?',
        options: ['v³⁶', 'v³⁷', '(1+i)³⁷'],
        correctIndex: 1,
        explanation: 'Como X está 37 meses a la derecha de FF = 0, retrocede 37 periodos con v³⁷.',
      },
    },
    step4: {
      hint1: 'Paso A: n = −ln(1 − (79,000/3,175)(0.26/12)) / ln(1 + 0.26/12) = 36.136 → 36 pagos completos.',
      hint2: 'Paso B: 3,175·a₃₆ = $78,801.88. Faltante en t = 0: $198.12. Llévalo al mes 37 con (1 + 0.26/12)³⁷.',
      equationDisplay: '79,000 = 3,175 · a₃₆|i + X · v³⁷',
      algebraSteps: [
        'n = 36.136 → 36 pagos completos de $3,175',
        'VP de 36 pagos: 3,175 × 24.819490 = $78,801.88',
        'Faltante en t = 0: 79,000 − 78,801.88 = $198.12',
        'X = 198.12 × (1 + 0.26/12)³⁷ = $437.94 (con i redondeada a 0.021667 da ~$436.62)',
      ],
      finalAnswer: '36 pagos completos + pago extra X = $437.94 en t = 37',
    },
  },
  {
    id: 'p3-ej5-enganche-extra-en-ultimo',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 3 Nov (pág. 2)',
    title: 'Enganche + Pago Extra EN el Último Pago Completo',
    topicTag: 'Enganche · Pago extra en t = n',
    difficulty: 'Intermedio',
    statement:
      'Se compra un bien de $130,000 dando un enganche de $45,000 hoy y el resto con pagos mensuales vencidos de $7,300 al 1.8% efectivo mensual. Calcula cuántos pagos completos se hacen y de cuánto es el pago adicional X realizado EN EL MISMO MES que el último pago completo.',
    timeline: {
      maxTime: 15,
      defaultFF: 0,
      altFF: 13,
      altFFLabel: 'Probar FF = 13 (en el último pago)',
      rate: 0.018,
      periodLabel: 'meses',
      flows: [
        { id: 'd5', label: 'Deuda neta (130k − 45k)', side: 'debt', kind: 'single', amount: 85000, startTime: 0 },
        {
          id: 'p5',
          label: '13 pagos de $7,300',
          side: 'payment',
          kind: 'annuity',
          amount: 7300,
          startTime: 1,
          count: 13,
          perspective: 'a',
        },
        {
          id: 'x5',
          label: 'Extra en t=13',
          side: 'payment',
          kind: 'single',
          amount: 1329.39,
          isUnknown: true,
          unknownSymbol: 'X',
          startTime: 13,
        },
      ],
    },
    step1: {
      summary: 'Resta el enganche al precio total: el monto financiado en t = 0 es $85,000.',
      rateConversion: 'Deuda D = $85,000 · i = 1.8% = 0.018 mensual',
      checkpoint: {
        prompt: '¿Qué cambia cuando el pago extra se hace EN el último pago completo (t = 13) en vez de un mes después (t = 14)?',
        options: ['El descuento de X es v¹³ en vez de v¹⁴', 'Cambia a₁₃ a ä₁₃', 'No cambia nada'],
        correctIndex: 0,
        explanation: 'Cuando es EN el último pago completo usas vⁿ (v¹³); un mes después sería vⁿ⁺¹.',
      },
    },
    step2: {
      summary: 'Deuda neta de $85,000 en t = 0. Los 13 pagos van en t = 1..13, y el extra X se suma en t = 13.',
      landingInsight: 'En el mes 13 desembolsas $7,300 + $1,329.39 = $8,629.39 en total.',
    },
    step3: {
      summary: 'Con FF = 0: 85,000 = 7,300 · a₁₃ + X · v¹³.',
      whyThisFF: 'a₁₃ cae directo en t = 0.',
      checkpoint: {
        prompt: 'Para llevar el faltante en t = 0 ($1,054.35) hacia el mes 13, ¿capitalizas o descuentas?',
        options: ['Capitalizar: × (1.018)¹³', 'Descontar: × (1.018)⁻¹³', 'Dividir entre 13'],
        correctIndex: 0,
        explanation: 'Vas hacia el futuro (de t = 0 a t = 13), así que capitalizas con (1.018)¹³.',
      },
    },
    step4: {
      hint1: 'Despeja n: 85,000 / 7,300 = 11.643836 ⇒ n = 13.184 → 13 pagos completos.',
      hint2: '7,300 · a₁₃|0.018 = $83,945.65. Faltante en t = 0: $1,054.35; capitaliza 13 meses.',
      equationDisplay: '85,000 = 7,300 · a₁₃|0.018 + X · v¹³',
      algebraSteps: [
        'D = 130,000 − 45,000 = $85,000',
        'n = 13.1841 → 13 pagos completos',
        '7,300 · a₁₃|0.018 = $83,945.65',
        'X = (85,000 − 83,945.65) × (1.018)¹³ = $1,329.39',
      ],
      finalAnswer: '13 pagos completos + X = $1,329.39 en t = 13',
    },
  },
  {
    id: 'p3-asesoria-multiples-esquemas',
    parcial: 'P3',
    sourceRef: 'Asesorías · 20 Nov (Prob. 3)',
    title: 'Anualidad Por Partes: 3 Esquemas de Pago Distintos (Mensual, Trimestral y Bimestral)',
    topicTag: 'Por partes · Múltiples frecuencias',
    difficulty: 'Examen',
    statement:
      'Una deuda se paga en 3 partes consecutivas con tasa efectiva anual i_a = 10%: (1) Años 0–2: 24 pagos mensuales vencidos de $5,000; (2) Años 2–4: 8 pagos trimestrales vencidos de $14,000; (3) Años 4–6: 12 pagos bimestrales vencidos de $1,000. Calcula la deuda total en t = 0.',
    timeline: {
      maxTime: 72,
      defaultFF: 0,
      rate: Math.pow(1.1, 1 / 12) - 1,
      periodLabel: 'meses',
      segments: [
        { id: 'ms1', start: 0, end: 24, rate: Math.pow(1.1, 1 / 12) - 1, label: 'Parte 1: 24 men × $5k' },
        { id: 'ms2', start: 24, end: 48, rate: Math.pow(1.1, 1 / 12) - 1, label: 'Parte 2: 8 trim × $14k' },
        { id: 'ms3', start: 48, end: 72, rate: Math.pow(1.1, 1 / 12) - 1, label: 'Parte 3: 12 bim × $1k' },
      ],
      flows: [
        {
          id: 'dm3',
          label: 'Deuda total D',
          side: 'debt',
          kind: 'single',
          amount: 199500.74,
          isUnknown: true,
          unknownSymbol: 'D',
          startTime: 0,
        },
        { id: 'pm3-1', label: 'Parte 1 (VP en t=0)', side: 'payment', kind: 'single', amount: 108822.84, startTime: 0 },
        { id: 'pm3-2', label: 'Parte 2 (VP en mes 24)', side: 'payment', kind: 'single', amount: 100762.35, startTime: 24 },
        { id: 'pm3-3', label: 'Parte 3 (VP en mes 48)', side: 'payment', kind: 'single', amount: 10839.07, startTime: 48 },
      ],
    },
    step1: {
      summary: 'La tasa anual es 10% siempre, pero cada parte tiene su propia frecuencia de pago: saca 3 tasas equivalentes.',
      rateConversion:
        'i_m = (1.10)^(1/12)−1 = 0.7974% · i_t = (1.10)^(1/4)−1 = 2.4114% · i_b = (1.10)^(1/6)−1 = 1.6012%',
      checkpoint: {
        prompt: 'Cuando calculas 14,000 · a₈|i_t (Parte 2, que va del año 2 al año 4), ¿en qué fecha aterriza y qué falta hacer?',
        options: [
          'Aterriza en t = 0 directo',
          'Aterriza al inicio del año 2 (mes 24), así que falta descontarla 2 años con (1.10)⁻²',
          'Aterriza en el año 4',
        ],
        correctIndex: 1,
        explanation:
          'Exacto: cada parte se colapsa al inicio de su bloque (año 0, año 2 y año 4) y luego viaja a t = 0 con (1.10)⁻² y (1.10)⁻⁴.',
      },
    },
    step2: {
      summary: 'Divide el problema en 3 mini-anualidades independientes y luego súmalas todas en FF = 0.',
      landingInsight:
        'Puedes usar los exponentes en años ((1.10)⁻² y (1.10)⁻⁴) o en meses (v_m²⁴ y v_m⁴⁸): dan exactamente lo mismo.',
    },
    step3: {
      summary: 'FF = 0 deja D despejada y cada bloque retrocede los años completos que lo separan de t = 0.',
      whyThisFF: 'Trabajar el puente en años enteros (2 años y 4 años) usa directo la tasa 10% anual sin perder decimales.',
      checkpoint: {
        prompt: 'La Parte 3 (años 4 a 6) aterriza en el año 4 (mes 48). ¿Por cuánto la multiplicas para llegar a FF = 0?',
        options: ['(1.10)⁻⁴ (equivalente a v_m⁴⁸)', '(1.10)⁻⁶', '(1.10)⁴'],
        correctIndex: 0,
        explanation: 'Retrocede 4 años exactos (48 meses) desde el año 4 hasta t = 0.',
      },
    },
    step4: {
      hint1: 'Calcula cada bloque en su inicio: Parte 1 = $108,822.84 (año 0); Parte 2 = $100,762.35 (año 2); Parte 3 = $10,839.07 (año 4).',
      hint2: 'Trae Parte 2 dividiendo entre (1.10)² = 1.21, y Parte 3 dividiendo entre (1.10)⁴ = 1.4641.',
      equationDisplay: 'D = 5,000·a₂₄|i_m + 14,000·a₈|i_t·(1.10)⁻² + 1,000·a₁₂|i_b·(1.10)⁻⁴',
      algebraSteps: [
        'Parte 1 en t = 0: 5,000 × 21.764568 = $108,822.84',
        'Parte 2 en t = 0: (14,000 × 7.197311) / (1.10)² = 100,762.35 / 1.21 = $83,274.67',
        'Parte 3 en t = 0: (1,000 × 10.839068) / (1.10)⁴ = 10,839.07 / 1.4641 = $7,403.23',
        'Deuda total D = 108,822.84 + 83,274.67 + 7,403.23 = $199,500.74',
      ],
      finalAnswer: 'D = $199,500.74',
      notebookNote:
        'Este es el Problema 3 de tus notas de asesorías (20 Nov): nota lo limpio que queda cuando cada esquema se evalúa por separado y luego se descuenta a t = 0.',
    },
  },
  {
    id: 'p3-asesoria-40trim-60mes',
    parcial: 'P3',
    sourceRef: 'Asesorías · 20 Nov (Prob. 5)',
    title: 'Depósitos Trimestrales + Retiros Mensuales con Puente Fraccionario (v^(2/3))',
    topicTag: 'Cambio de frecuencia · Exponente fraccionario',
    difficulty: 'Examen',
    statement:
      'Se realizan 40 depósitos trimestrales vencidos de $5,000 (a una tasa efectiva anual del 12%). Exactamente 2 meses después del último depósito se empiezan a realizar 60 retiros mensuales de X. Plantea la ecuación en el trimestre 40 (o 2 meses después) y calcula X.',
    timeline: {
      maxTime: 185,
      defaultFF: 122,
      altFF: 120,
      altFFLabel: 'Ver FF = mes 120 (trimestre 40)',
      rate: Math.pow(1.12, 1 / 12) - 1,
      periodLabel: 'meses',
      flows: [
        {
          id: 'as5-dep',
          label: '40 dep. trim × $5k (s₄₀ en mes 120)',
          side: 'debt',
          kind: 'single',
          amount: 366395.75,
          startTime: 120,
        },
        {
          id: 'as5-ret',
          label: '60 retiros men × X (ä₆₀ en mes 122)',
          side: 'payment',
          kind: 'single',
          amount: 373382.05,
          isUnknown: true,
          unknownSymbol: 'X·ä₆₀',
          startTime: 122,
        },
      ],
    },
    step1: {
      summary: 'Convierte la tasa anual (12%) a trimestral para los depósitos y a mensual para los retiros.',
      rateConversion: 'i_t = (1.12)^(1/4)−1 = 2.8737% trimestral · i_m = (1.12)^(1/12)−1 = 0.9489% mensual',
      checkpoint: {
        prompt: '¿Qué fracción de un trimestre representan los 2 meses de espera entre el último depósito y el primer retiro?',
        options: ['2 trimestres', '2/3 de trimestre (2 meses de 3 que tiene un trimestre)', '1/2 trimestre'],
        correctIndex: 1,
        explanation:
          '¡Exacto! Por eso en la pizarra de tus asesorías aparece (1 + i_t)^(2/3) hacia adelante o v_t^(2/3) hacia atrás.',
      },
    },
    step2: {
      summary: '5,000·s₄₀|i_t aterriza en el mes 120 (trimestre 40). Si el primer retiro es en el mes 122, ä₆₀|i_m aterriza en el mes 122 (y a₆₀|i_m aterrizaría en el mes 121).',
      landingInsight:
        'Mover 2 meses hacia adelante con tasa trimestral es ×(1+i_t)^(2/3), que equivale exactamente a ×(1+i_m)² con tasa mensual.',
    },
    step3: {
      summary: 'En FF = mes 122: 5,000·s₄₀|i_t·(1+i_t)^(2/3) = X·ä₆₀|i_m. (En FF = mes 120: 5,000·s₄₀|i_t = X·ä₆₀|i_m·v_t^(2/3)).',
      whyThisFF: 'Las dos formas de tu pizarra son idénticas: solo pasa (1+i_t)^(2/3) de un lado al otro.',
      checkpoint: {
        prompt: 'Si quisieras usar a₆₀ (vencida, que cae en mes 121, 1 mes antes del primer retiro en mes 122) y FF = mes 120, ¿cuántos meses habría entre mes 120 y mes 121?',
        options: ['1 mes (1/3 de trimestre)', '2 meses (2/3 de trimestre)', '3 meses'],
        correctIndex: 0,
        explanation:
          '¡Ojo fino! a₆₀ siempre cae 1 mes antes del 1er retiro (mes 121). En la pizarra de asesorías el profe asumió el VP cayendo en mes 122 (por eso usó 2/3 de trimestre, es decir ä₆₀ si el primer retiro es exacto en mes 122).',
      },
    },
    step4: {
      hint1: 'Acumulado en mes 120: 5,000 · s₄₀|2.8737% = 5,000 × 73.27915 = $366,395.75.',
      hint2: 'Llevado 2 meses adelante (mes 122): 366,395.75 × (1.028737)^(2/3) = $373,382.05. Divide entre ä₆₀|0.9489% = 46.02037.',
      equationDisplay: '5,000 · s₄₀|i_t · (1 + i_t)^(2/3) = X · ä₆₀|i_m',
      algebraSteps: [
        's₄₀|2.8737% = 73.27915  ⇒  Fondo en mes 120 = $366,395.75',
        'Avance de 2 meses (2/3 trim): 366,395.75 × (1.028737)^(2/3) = $373,382.05',
        'ä₆₀|0.9489% = 46.02037  ⇒  X = 373,382.05 / 46.02037 = $8,113.41',
      ],
      finalAnswer: 'X = $8,113.41 cada mes (con i_a = 12%)',
      notebookNote:
        'Problema 5 de tus asesorías (20 Nov): recuerda comprobar si el primer retiro ocurre EN el mes 122 (usa ä₆₀ con puente de 2 meses) o al FINAL del mes 123 (usa a₆₀ con puente de 2 meses).',
    },
  },
  {
    id: 'p3-ej6-si-prospectivo-retrospectivo',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 5 Nov & Diap. Amortización pág. 12',
    title: 'Saldo Insoluto a 3 Años: Prospectivo vs Retrospectivo',
    topicTag: 'Saldo Insoluto · 2 métodos',
    difficulty: 'Intermedio',
    statement:
      'Se solicita un préstamo de $200,000 a 10 años con 120 pagos mensuales vencidos a una tasa i⁽¹²⁾ = 30%. Calcula el pago mensual R y el Saldo Insoluto exactamente después de 3 años (tras el pago 36).',
    timeline: {
      maxTime: 120,
      defaultFF: 36,
      altFF: 0,
      altFFLabel: 'Ver FF = 0 (cálculo inicial de R)',
      rate: 0.025,
      periodLabel: 'meses',
      flows: [
        { id: 'd6', label: 'Deuda original', side: 'debt', kind: 'single', amount: 200000, startTime: 0 },
        {
          id: 'p6-past',
          label: '36 pagos hechos',
          side: 'payment',
          kind: 'annuity',
          amount: 5272.36,
          startTime: 1,
          count: 36,
          perspective: 's',
        },
        {
          id: 'p6-rem',
          label: '84 pagos restantes',
          side: 'payment',
          kind: 'annuity',
          amount: 5272.36,
          startTime: 37,
          count: 84,
          perspective: 'a',
        },
      ],
    },
    step1: {
      summary: 'Tasa efectiva mensual i = 30%/12 = 2.5%. Total de pagos n = 120 meses. Corte en k = 36.',
      rateConversion: 'i = 2.5% mensual · n = 120 · Pagos realizados = 36 · Pagos restantes = 84',
      checkpoint: {
        prompt: 'Si conoces R, n = 120 y k = 36, ¿cuál método es más rápido para hallar SI₃₆?',
        options: [
          'Prospectivo (mirar hacia adelante: VP de los 84 pagos que faltan)',
          'Retrospectivo (mirar hacia atrás)',
          'Ambos dan distinto resultado',
        ],
        correctIndex: 0,
        explanation: 'Ambos dan EXACTAMENTE $184,393.47, pero el Prospectivo es una sola multiplicación: R · a₈₄.',
      },
    },
    step2: {
      summary: 'La Fecha Focal del Saldo Insoluto se coloca en el momento del corte: FF = 36.',
      landingInsight: 'En FF = 36 tanto s₃₆ (pasado) como a₈₄ (futuro) aterrizan exactamente en t = 36.',
    },
    step3: {
      summary: 'Prospectivo mira a la derecha de FF = 36; Retrospectivo mira a la izquierda de FF = 36.',
      whyThisFF: 'Comprueba ambos en el laboratorio de Amortización.',
      checkpoint: {
        prompt: 'En Retrospectivo, ¿cómo llevas el préstamo original de $200,000 desde t = 0 hasta t = 36?',
        options: ['200,000 · v³⁶', '200,000 · (1.025)³⁶', '200,000 · a₃₆'],
        correctIndex: 1,
        explanation: 'Avanzas 36 meses: 200,000(1.025)³⁶ − R · s₃₆.',
      },
    },
    step4: {
      hint1: 'R = 200,000 / a₁₂₀|0.025 = 200,000 / 37.933687 = $5,272.36.',
      hint2: 'Prospectivo: SI₃₆ = 5,272.3586 × a₈₄|0.025.',
      equationDisplay: 'SI₃₆ = R · a₈₄|0.025  =  200,000(1.025)³⁶ − R · s₃₆|0.025',
      algebraSteps: [
        'R = 200,000 / 37.933687 = $5,272.3586',
        'Prospectivo: SI₃₆ = 5,272.3586 × 34.973621 = $184,393.47',
        'Retrospectivo: 486,507.07 − 302,113.60 = $184,393.47 ✓',
      ],
      finalAnswer: 'R = $5,272.36 · SI₃₆ = $184,393.47',
    },
  },
  {
    id: 'p3-ej7-justo-antes',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 5 Nov & Diap. Amortización pág. 13',
    title: 'Trampa Clásica: Saldo Insoluto JUSTO ANTES del 3er Pago',
    topicTag: 'Justo antes (k⁻) · äₙ',
    difficulty: 'Examen',
    statement:
      'Una deuda se amortiza con 5 pagos anuales vencidos de $3,343.80 a una tasa del 20% efectivo anual. Calcula el Saldo Insoluto JUSTO ANTES de realizar el tercer pago (SI₃⁻).',
    timeline: {
      maxTime: 6,
      defaultFF: 3,
      rate: 0.2,
      periodLabel: 'años',
      allowPerspectiveSwitch: true,
      flows: [
        {
          id: 'p7-past',
          label: '2 pagos ya hechos',
          side: 'debt',
          kind: 'annuity',
          amount: 3343.8,
          startTime: 1,
          count: 2,
          perspective: 's',
        },
        {
          id: 'p7-rem',
          label: '3 pagos aún pendientes (t=3,4,5)',
          side: 'payment',
          kind: 'annuity',
          amount: 3343.8,
          startTime: 3,
          count: 3,
          perspective: 'a_due',
        },
      ],
    },
    step1: {
      summary: 'No hace falta hallar la deuda inicial D: el método prospectivo solo mira lo que falta por pagar.',
      rateConversion: 'i = 20% = 0.20 anual · v = 1 / 1.20 = 0.833333 · 1 − v = 0.166667',
      checkpoint: {
        prompt: 'Si estás en t = 3 JUSTO ANTES de entregar el 3er pago, ¿cuántos pagos te faltan?',
        options: ['2 pagos (t = 4 y 5)', '3 pagos (t = 3, 4 y 5 — ¡el de hoy todavía lo debes!)', '5 pagos'],
        correctIndex: 1,
        explanation: 'Como todavía NO entregas el pago 3, te faltan 3 pagos empezando HOY en t = 3.',
      },
    },
    step2: {
      summary: 'Los 3 pagos pendientes están en t = 3, 4 y 5, con FF = 3.',
      landingInsight: 'Al empezar el primer pago pendiente justo en FF = 3, es una anualidad ANTICIPADA: ä₃.',
    },
    step3: {
      summary: 'FF = 3: SI₃⁻ = 3,343.80 · ä₃|0.20.',
      whyThisFF: 'Justo después (SI₃⁺) sería simplemente restarle un pago: $8,452.38 − $3,343.80 = $5,108.58.',
      checkpoint: {
        prompt: '¿Cuál es la diferencia exacta entre SI₃⁻ (justo antes) y SI₃⁺ (justo después)?',
        options: ['Exactamente un pago R ($3,343.80)', 'Un año de intereses', 'Son iguales'],
        correctIndex: 0,
        explanation: 'En cuanto entregas el pago 3, tu saldo cae exactamente en $3,343.80.',
      },
    },
    step4: {
      hint1: 'Faltan 3 pagos empezando hoy ⇒ usa ä₃|0.20 = (1 − v³) / (1 − v).',
      hint2: 'ä₃|0.20 = (1 − 0.578704) / 0.166667 = 2.527778.',
      equationDisplay: 'SI₃⁻ = 3,343.80 · ä₃|0.20 = 3,343.80 · (1 − 1.20⁻³) / (1 − 1.20⁻¹)',
      algebraSteps: [
        'ä₃|0.20 = 2.527778',
        'SI₃⁻ = 3,343.80 × 2.527778 = $8,452.38',
        'Comprobación: SI₃⁺ = 3,343.80 · a₂ = $5,108.58 = 8,452.38 − 3,343.80 ✓',
      ],
      finalAnswer: 'SI₃⁻ = $8,452.38',
    },
  },
  {
    id: 'p3-ej8-retrospectivo-sin-n',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 5 Nov & Diap. Amortización pág. 15',
    title: 'Saldo Insoluto Retrospectivo (Cuando NO Conoces n)',
    topicTag: 'Retrospectivo obligatorio',
    difficulty: 'Base',
    statement:
      'Por una mercancía con valor de $99,000 se pacta realizar pagos mensuales de $17,200 a una tasa de 1.2% mensual. Calcular el saldo insoluto una vez que se haya realizado el pago 4, usando método retrospectivo.',
    timeline: {
      maxTime: 8,
      defaultFF: 4,
      rate: 0.012,
      periodLabel: 'meses',
      flows: [
        { id: 'd8', label: 'Mercancía', side: 'debt', kind: 'single', amount: 99000, startTime: 0 },
        {
          id: 'p8',
          label: '4 pagos hechos',
          side: 'payment',
          kind: 'annuity',
          amount: 17200,
          startTime: 1,
          count: 4,
          perspective: 's',
        },
        {
          id: 'si8',
          label: 'Saldo Insoluto',
          side: 'payment',
          kind: 'single',
          amount: 33789.89,
          isUnknown: true,
          unknownSymbol: 'SI₄',
          startTime: 4,
        },
      ],
    },
    step1: {
      summary: 'No te dan n (y quizá ni siquiera sea entero). Por eso el método Retrospectivo es obligatorio.',
      rateConversion: 'i = 1.2% = 0.012 mensual · k = 4 pagos realizados',
      checkpoint: {
        prompt: '¿Por qué aquí eliges el método Retrospectivo?',
        options: [
          'Porque no conoces cuántos pagos faltan (n), pero sí conoces D y los 4 pagos hechos',
          'Porque la tasa es menor al 2%',
          'Porque el prospectivo no funciona con pagos mensuales',
        ],
        correctIndex: 0,
        explanation: 'Si no sabes n, mira hacia atrás: Deuda acumulada − Pagos acumulados.',
      },
    },
    step2: {
      summary: '$99,000 avanza 4 meses hacia FF = 4. Los 4 pagos de $17,200 se acumulan con s₄ justo en t = 4.',
      landingInsight: 's₄ cae exacto sobre FF = 4 sin ningún ajuste adicional.',
    },
    step3: {
      summary: 'FF = 4: SI₄ = 99,000(1.012)⁴ − 17,200 · s₄|0.012.',
      whyThisFF: 'En FF = 4, SI₄ queda despejado directo.',
      checkpoint: {
        prompt: '¿Qué fórmula acumula los 4 pagos hechos hasta t = 4?',
        options: ['a₄|0.012', 's₄|0.012', 's̈₄|0.012'],
        correctIndex: 1,
        explanation: 's₄ (VF vencida) cae el día del 4to pago (t = 4).',
      },
    },
    step4: {
      hint1: 'Deuda en t = 4: 99,000 × (1.012)⁴ = $103,838.49.',
      hint2: 'Pagos en t = 4: 17,200 × s₄|0.012 = $70,048.60.',
      equationDisplay: 'SI₄ = 99,000(1.012)⁴ − 17,200 · s₄|0.012',
      algebraSteps: [
        '99,000 × (1.012)⁴ = $103,838.49',
        '17,200 × 4.072593 = $70,048.60',
        'SI₄ = 103,838.49 − 70,048.60 = $33,789.89',
      ],
      finalAnswer: 'SI₄ = $33,789.89',
    },
  },
  {
    id: 'p3-diap-fondo-espera',
    parcial: 'P3',
    sourceRef: 'Diap. Tablas y Fondos · pág. 19',
    title: 'Fondo de Acumulación Anticipado con 1 Año de Espera',
    topicTag: 'Fondo de acumulación · VF + espera',
    difficulty: 'Intermedio',
    statement:
      'Se realizarán 15 depósitos mensuales de $700 comenzando AHORITA (t = 0). El fondo ofrece 1.3% efectivo mensual. Si el dinero se retira 1 año (12 meses) después del último depósito, ¿cuánto se retira?',
    timeline: {
      maxTime: 27,
      defaultFF: 26,
      altFF: 14,
      altFFLabel: 'Ver FF = 14 (último depósito)',
      rate: 0.013,
      periodLabel: 'meses',
      allowPerspectiveSwitch: true,
      flows: [
        {
          id: 'fd-dep',
          label: '15 depósitos (t=0..14)',
          side: 'debt',
          kind: 'annuity',
          amount: 700,
          startTime: 0,
          count: 15,
          perspective: 's',
        },
        {
          id: 'fd-ret',
          label: 'Retiro final (t=26)',
          side: 'payment',
          kind: 'single',
          amount: 13435.36,
          isUnknown: true,
          unknownSymbol: 'M',
          startTime: 26,
        },
      ],
    },
    step1: {
      summary: 'Comenzando "ahorita" significa primer depósito en t = 0. Entonces el depósito #15 cae en t = 14.',
      rateConversion: 'i = 1.3% mensual · Último depósito en t = 14 · Retiro 12 meses después = t = 26',
      checkpoint: {
        prompt: 'Si el primer depósito es en t = 0 y son 15 depósitos, ¿en qué mes cae el último depósito?',
        options: ['En t = 15', 'En t = 14 (del 0 al 14 hay 15 depósitos)', 'En t = 16'],
        correctIndex: 1,
        explanation: '¡Gran detalle! Contando el 0, los 15 depósitos son t = 0, 1, 2, ..., 14. Así 12 meses después es t = 26.',
      },
    },
    step2: {
      summary: 's₁₅ cae exactamente en el último depósito (t = 14). De ahí viaja 12 meses hacia adelante hasta t = 26.',
      landingInsight:
        'Si prefieres usar s̈₁₅ (que cae en t = 15, un mes después del último depósito), entonces solo capitalizas 11 meses: 700·s̈₁₅·(1.013)¹¹ da exactamente lo mismo.',
    },
    step3: {
      summary: 'FF = 26: M = 700 · s₁₅|0.013 · (1.013)¹².',
      whyThisFF: 'Deja a M despejado directamente.',
      checkpoint: {
        prompt: 'De t = 14 (último depósito) a t = 26 (retiro), ¿el dinero capitaliza o descuenta?',
        options: ['Capitaliza 12 meses: × (1.013)¹²', 'Descuenta 12 meses: × v¹²', 'No gana intereses porque ya no depositas'],
        correctIndex: 0,
        explanation: 'Aunque ya no hagas depósitos, tu saldo sigue invertido ganando interés compuesto durante esos 12 meses.',
      },
    },
    step4: {
      hint1: 'Calcula s₁₅|0.013 = ((1.013)¹⁵ − 1) / 0.013 = 16.437574.',
      hint2: 'En t = 14 tienes 700 × 16.437574 = $11,506.30. Multiplica por (1.013)¹² = 1.167652.',
      equationDisplay: 'M = 700 · s₁₅|0.013 · (1.013)¹² = 700 · s̈₁₅|0.013 · (1.013)¹¹',
      algebraSteps: [
        's₁₅|0.013 = 16.437574  ⇒  Acumulado en t = 14: $11,506.30',
        'Crecimiento 12 meses: 11,506.30 × (1.013)¹² = $13,435.36',
      ],
      finalAnswer: 'M = $13,435.36',
    },
  },
  {
    id: 'p3-ej9-tasas-cambiantes',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 12 Nov (pág. 3–4)',
    title: 'Integral de Examen: 3 Tramos con Tasas Cambiantes + SI₁₆',
    topicTag: 'Tasas cambiantes · Puente entre tramos',
    difficulty: 'Examen',
    statement:
      'Una deuda de $323,915 a 5 años se paga en 3 etapas: (1) Años 0–2: 12 pagos bimestrales de $16,000 con tasa 13% anual efectiva; (2) Año 2–3: 12 pagos mensuales de $7,000 con tasa 8% semestral efectiva; (3) Años 3–5: 4 pagos semestrales de X con tasa 14% anual efectiva. Encuentra X y el Saldo Insoluto tras el pago 16 (SI₁₆).',
    timeline: {
      maxTime: 60,
      defaultFF: 0,
      altFF: 28,
      altFFLabel: 'Ver corte SI₁₆ (mes 28)',
      rate: Math.pow(1.13, 1 / 12) - 1,
      periodLabel: 'meses',
      segments: [
        { id: 'seg1', start: 0, end: 24, rate: Math.pow(1.13, 1 / 12) - 1, label: 'Años 0–2: i_a = 13%' },
        { id: 'seg2', start: 24, end: 36, rate: Math.pow(1.08, 1 / 6) - 1, label: 'Año 2–3: i_s = 8%' },
        { id: 'seg3', start: 36, end: 60, rate: Math.pow(1.14, 1 / 12) - 1, label: 'Años 3–5: i_a = 14%' },
      ],
      flows: [
        { id: 'd9', label: 'Deuda total', side: 'debt', kind: 'single', amount: 323915, startTime: 0 },
        { id: 't1-vp', label: 'Tramo 1 (12 bim × $16k)', side: 'payment', kind: 'single', amount: 168605.97, startTime: 0 },
        { id: 't2-vp', label: 'Tramo 2 (12 men × $7k → t=24)', side: 'payment', kind: 'single', amount: 77356.86, startTime: 24 },
        {
          id: 't3-vp',
          label: 'Tramo 3 (4 sem × X → t=36)',
          side: 'payment',
          kind: 'single',
          amount: 141085.13,
          isUnknown: true,
          unknownSymbol: 'X·a₄',
          startTime: 36,
        },
      ],
    },
    step1: {
      summary: 'Convierte cada tasa al periodo de los pagos de SU propio tramo.',
      rateConversion:
        'Tramo 1: i_b = (1.13)^(1/6)−1 = 2.0554% · Tramo 2: i_m = (1.08)^(1/6)−1 = 1.2909% · Tramo 3: i_s = (1.14)^(1/2)−1 = 6.7708%',
      checkpoint: {
        prompt: 'Cuando ya valuaste el Tramo 3 en t = 36 (año 3), ¿con QUÉ tasas viaja de regreso hasta t = 0?',
        options: [
          'Todo el camino con 14% anual',
          'De año 3→2 cruza al 8% semestral (÷ 1.08²), y de año 2→0 cruza al 13% anual (÷ 1.13²)',
          'Con el promedio de las 3 tasas',
        ],
        correctIndex: 1,
        explanation: 'Cada dinero paga "peaje" con la tasa vigente en la zona del calendario que atraviesa.',
      },
    },
    step2: {
      summary: 'Colapsa cada anualidad al inicio de su zona (t = 0, t = 24, t = 36) y luego cruza los puentes.',
      landingInsight: 'Cada banda de color arriba muestra la zona donde aplica cada tasa.',
    },
    step3: {
      summary: 'Para SI₁₆ ubica el pago 16: los primeros 12 pagos fueron bimestrales (24 meses), así que el pago 16 es en el mes 28.',
      whyThisFF: 'En FF = mes 28 el prospectivo solo toma 8 pagos de $7,000 + los 4 de X descontados 8 meses.',
      checkpoint: {
        prompt: '¿En qué mes ocurre el pago número 16?',
        options: ['Mes 16', 'Mes 28 (12 pagos bimestrales = 24 meses + 4 mensuales = 28)', 'Mes 32'],
        correctIndex: 1,
        explanation: 'Los primeros 12 pagos duran 24 meses, así que el pago 16 cae en el mes 28.',
      },
    },
    step4: {
      hint1: 'VP₀(Tramo 1) = $168,605.97 · VP₀(Tramo 2) = 77,356.86 / (1.13)² = $60,581.78.',
      hint2: 'Resta a $323,915 → $94,727.25 = X·a₄|6.7708% / [(1.08)²(1.13)²].',
      equationDisplay: '323,915 = 16,000·a₁₂|i_b + 7,000·a₁₂|i_m·(1.13)⁻² + X·a₄|i_s·(1.08)⁻²·(1.13)⁻²',
      algebraSteps: [
        'Tramo 1 en t=0: $168,605.97',
        'Tramo 2 en t=0: 77,356.86 / (1.13)² = $60,581.78',
        'Tramo 3 en t=0: $94,727.25  ⇒  X = 94,727.25 / (3.404074 × 0.671419) = $41,445.97',
        'SI₁₆ (mes 28): 7,000·a₈|i_m + (X·a₄|i_s)/(1+i_m)⁸ = $180,221.32',
      ],
      finalAnswer: 'X = $41,445.97 · SI₁₆ = $180,221.32',
    },
  },
  {
    id: 'p3-ej10-ahorro-retiros',
    parcial: 'P3',
    sourceRef: 'Tus notas P3 · 17 Nov (pág. 4 — ¡completado!)',
    title: 'Ahorro Trimestral + Retiros Bimestrales con Retiro Extra',
    topicTag: '2 fases · Cambio de frecuencia · Retiro extra',
    difficulty: 'Examen',
    statement:
      'Se realizan 30 depósitos trimestrales de $12,000 a una tasa efectiva anual del 8.5%. Con lo acumulado se planea hacer retiros bimestrales de $30,000, empezando el primer retiro 6 meses después del último depósito. ¿Para cuántos retiros completos alcanza y de cuánto será el retiro extra 3 meses después del último retiro completo?',
    timeline: {
      maxTime: 140,
      defaultFF: 96,
      altFF: 90,
      altFFLabel: 'Ver FF = 90 (último depósito)',
      rate: Math.pow(1.085, 1 / 12) - 1,
      periodLabel: 'meses',
      flows: [
        { id: 'ah10', label: 'Fondo en mes 90 (30 trim)', side: 'debt', kind: 'single', amount: 492402.91, startTime: 90 },
        { id: 'ret10', label: '19 retiros bim × $30k (mes 96..132)', side: 'payment', kind: 'single', amount: 505826.94, startTime: 96 },
        {
          id: 'ext10',
          label: 'Retiro extra (mes 135)',
          side: 'payment',
          kind: 'single',
          amount: 9220.53,
          isUnknown: true,
          unknownSymbol: 'X',
          startTime: 135,
        },
      ],
    },
    step1: {
      summary: 'Misma tasa anual (8.5%), dos frecuencias: trimestral en depósitos y bimestral en retiros.',
      rateConversion: 'i_t = (1.085)^(1/4)−1 = 2.0604% · i_b = (1.085)^(1/6)−1 = 1.3688%',
      checkpoint: {
        prompt: 'Si pones FF = 96 (fecha del primer retiro), ¿qué fórmula cae directo en mes 96?',
        options: ['aₙ|i_b', 'äₙ|i_b (anticipada: cae justo en el primer retiro)', 'sₙ|i_b'],
        correctIndex: 1,
        explanation: 'Con äₙ|i_b los retiros aterrizan exacto en el mes 96, empatando con tu fondo de $512,899.49.',
      },
    },
    step2: {
      summary: 'Mes 90: $492,402.91. Mes 96 (6 meses después): $512,899.49. El retiro #19 ocurre en mes 132, y el extra en mes 135.',
      landingInsight: '135 − 96 = 39 meses (3.25 años) de distancia desde FF = 96.',
    },
    step3: {
      summary: 'FF = 96: 512,899.49 = 30,000·ä₁₉|i_b + X·(1.085)^(−39/12).',
      whyThisFF: 'Aprovecha exactamente el cálculo donde te quedaste en tus notas del 17 de noviembre.',
      checkpoint: {
        prompt: '¿Cuántos meses hay desde FF = 96 hasta el retiro extra en el mes 135?',
        options: ['38 meses', '39 meses (3.25 años)', '36 meses'],
        correctIndex: 1,
        explanation: '135 − 96 = 39 meses exactos.',
      },
    },
    step4: {
      hint1: 'Fondo en mes 96: 492,402.91 × (1.085)^0.5 = $512,899.49. Despeja n de 512,899.49 = 30,000·äₙ ⇒ n = 19.299.',
      hint2: 'Sobrante en mes 96: 512,899.49 − 30,000·ä₁₉ = $7,072.55. Capitalízalo 39 meses: ×(1.085)^(39/12).',
      equationDisplay: '512,899.49 = 30,000 · ä₁₉|i_b + X · (1.085)^(-39/12)',
      algebraSteps: [
        'Fase 1 (mes 90): 12,000 · s₃₀|2.0604% = $492,402.91',
        'Puente 6 meses (mes 96): $512,899.49',
        'n = 19.299 → 19 retiros completos ($505,826.94 en mes 96)',
        'Sobrante en mes 96: $7,072.55  ⇒  X = 7,072.55 × (1.085)^(39/12) = $9,220.53',
      ],
      finalAnswer: '19 retiros completos + retiro extra X = $9,220.53 (en mes 135)',
      notebookNote:
        '¡Aquí te quedaste el 17 de noviembre! Tu fondo de $492,402.91 y el puente a $512,899 estaban súper bien.',
    },
  },

  // ================= PARCIAL 2 (ASESORÍAS + TAREA P2 + NOTAS P2) =================
  {
    id: 'p2-asesoria-depositos-retiros',
    parcial: 'P2',
    sourceRef: 'Asesorías · 20 Nov (Prob. 1)',
    title: 'Depósitos Iguales X para Cubrir 3 Retiros de $20,000',
    topicTag: 'Ecuación de valor · Depósitos = Retiros',
    difficulty: 'Base',
    statement:
      'Vas a realizar 3 depósitos iguales de X empezando hoy (t = 0), otro al mes 5 y otro al mes 10, de tal forma que puedas hacer 3 retiros de $20,000 cada uno: el primero 4 meses después del último depósito (t = 14), el otro a los 8 (t = 18) y el último a los 12 (t = 22). Tasa mensual del 2%. ¿De cuánto debe ser X?',
    timeline: {
      maxTime: 24,
      defaultFF: 0,
      altFF: 10,
      altFFLabel: 'Probar FF = 10 (último depósito)',
      rate: 0.02,
      periodLabel: 'meses',
      flows: [
        { id: 'ad1', label: 'Depósito 1 (X)', side: 'debt', kind: 'single', amount: 15442.49, isUnknown: true, unknownSymbol: 'X', startTime: 0 },
        { id: 'ad2', label: 'Depósito 2 (X)', side: 'debt', kind: 'single', amount: 15442.49, isUnknown: true, unknownSymbol: 'X', startTime: 5 },
        { id: 'ad3', label: 'Depósito 3 (X)', side: 'debt', kind: 'single', amount: 15442.49, isUnknown: true, unknownSymbol: 'X', startTime: 10 },
        { id: 'ar1', label: 'Retiro 1', side: 'payment', kind: 'single', amount: 20000, startTime: 14 },
        { id: 'ar2', label: 'Retiro 2', side: 'payment', kind: 'single', amount: 20000, startTime: 18 },
        { id: 'ar3', label: 'Retiro 3', side: 'payment', kind: 'single', amount: 20000, startTime: 22 },
      ],
    },
    step1: {
      summary: 'Todos los flujos están espaciados de forma distinta a 1 mes (cada 5 meses los depósitos, cada 4 los retiros): aplica ecuación de valor flujo por flujo.',
      rateConversion: 'i = 2% mensual · Depósitos en t = 0, 5, 10 · Retiros en t = 14, 18, 22',
      checkpoint: {
        prompt: 'Si el último depósito es en t = 10 y el primer retiro ocurre "4 meses después del último depósito", ¿en qué mes cae el primer retiro?',
        options: ['En t = 4', 'En t = 14 (10 + 4)', 'En t = 10'],
        correctIndex: 1,
        explanation: '10 + 4 = 14, luego 10 + 8 = 18 y 10 + 12 = 22.',
      },
    },
    step2: {
      summary: 'Arriba: los 3 depósitos X (t = 0, 5, 10). Abajo: los 3 retiros de $20,000 (t = 14, 18, 22).',
      landingInsight: 'Con FF = 0 todos los montos a la derecha retroceden (azules) multiplicando por vᵗ = (1.02)⁻ᵗ.',
    },
    step3: {
      summary: 'FF = 0: X + X·v⁵ + X·v¹⁰ = 20,000(v¹⁴ + v¹⁸ + v²²). Factoriza X del lado izquierdo.',
      whyThisFF: 'Sigue idéntico el planteamiento de la pág. 2 de tus notas de asesorías.',
      checkpoint: {
        prompt: 'Al factorizar X en X + X(1.02)⁻⁵ + X(1.02)⁻¹⁰, ¿qué coeficiente acompaña a X?',
        options: ['1 + 0.90573 + 0.82035 = 2.72608', '3', '1.02⁻¹⁵'],
        correctIndex: 0,
        explanation: 'Sumas los tres factores de descuento: 1 + 0.90573 + 0.82035 = 2.72608.',
      },
    },
    step4: {
      hint1: 'Lado izquierdo: X(1 + 1.02⁻⁵ + 1.02⁻¹⁰) = 2.726079 X.',
      hint2: 'Lado derecho: 20,000(1.02⁻¹⁴ + 1.02⁻¹⁸ + 1.02⁻²²) = 15,157.50 + 14,003.19 + 12,936.77 = 42,097.46.',
      equationDisplay: 'X + X/(1.02)⁵ + X/(1.02)¹⁰ = 20,000/(1.02)¹⁴ + 20,000/(1.02)¹⁸ + 20,000/(1.02)²²',
      algebraSteps: [
        '2.726079 X = 42,097.46',
        'X = 42,097.46 / 2.726079 = $15,442.48',
      ],
      finalAnswer: 'X = $15,442.48 cada depósito',
      notebookNote:
        'Igual que en tus notas de asesorías (pág. 2): en el pizarrón salía $15,248.33 por redondear decimales intermedios; con precisión completa da $15,442.48.',
    },
  },
  {
    id: 'p2-asesoria-graduacion',
    parcial: 'P2',
    sourceRef: 'Asesorías · 20 Nov (Prob. 2)',
    title: 'Ahorro para Graduación (FF = 0 vs FF = 30)',
    topicTag: 'Ahorro irregular · Invariancia de FF',
    difficulty: 'Base',
    statement:
      'Para tu graduación dentro de 30 meses necesitas acumular $130,000 al 1.5% mensual. Depositas: hoy $15,000; mes 4: $20,000; mes 12: $20,000; mes 18: $20,000; y en el mes 24 haces un último depósito X. Calcula X.',
    timeline: {
      maxTime: 30,
      defaultFF: 30,
      altFF: 0,
      altFFLabel: 'Comparar con FF = 0',
      rate: 0.015,
      periodLabel: 'meses',
      flows: [
        { id: 'ag0', label: 'Hoy', side: 'debt', kind: 'single', amount: 15000, startTime: 0 },
        { id: 'ag4', label: 'Mes 4', side: 'debt', kind: 'single', amount: 20000, startTime: 4 },
        { id: 'ag12', label: 'Mes 12', side: 'debt', kind: 'single', amount: 20000, startTime: 12 },
        { id: 'ag18', label: 'Mes 18', side: 'debt', kind: 'single', amount: 20000, startTime: 18 },
        { id: 'ag24', label: 'Último dep.', side: 'debt', kind: 'single', amount: 24729.62, isUnknown: true, unknownSymbol: 'X', startTime: 24 },
        { id: 'ag30', label: 'Meta graduación', side: 'payment', kind: 'single', amount: 130000, startTime: 30 },
      ],
    },
    step1: {
      summary: 'Todos los depósitos deben sumar $130,000 valuados en una misma Fecha Focal (FF = 30 o FF = 0).',
      rateConversion: 'i = 1.5% = 0.015 mensual · ¡No olvides incluir el depósito de $15,000 de hoy!',
      checkpoint: {
        prompt: 'Si pones FF = 30, ¿por qué exponente multiplicas el depósito del mes 12 ($20,000)?',
        options: ['(1.015)¹²', '(1.015)¹⁸ (son 30 − 12 = 18 meses hasta la graduación)', '(1.015)⁻¹⁸'],
        correctIndex: 1,
        explanation: 'De t = 12 hasta t = 30 faltan 18 meses hacia adelante → (1.015)¹⁸.',
      },
    },
    step2: {
      summary: 'Arrastra la Fecha Focal de t = 30 a t = 0: todos los arcos cambian de verde a azul, pero X siempre es $24,729.62.',
      landingInsight: 'En tus notas de asesorías pág. 3 se omitieron por descuido los $15,000 de hoy en la suma del pizarrón.',
    },
    step3: {
      summary: 'En FF = 30 todo capitaliza hacia la derecha y el lado derecho queda limpio en $130,000.',
      whyThisFF: 'Evita fracciones y exponentes negativos.',
      checkpoint: {
        prompt: 'En FF = 30, ¿cuántos meses capitaliza X (que está en el mes 24)?',
        options: ['6 meses: X(1.015)⁶', '24 meses: X(1.015)²⁴', '30 meses'],
        correctIndex: 0,
        explanation: '30 − 24 = 6 meses hacia adelante.',
      },
    },
    step4: {
      hint1: 'En FF = 0: $130,000(1.015)⁻³⁰ = $83,169.11. Los 4 depósitos conocidos en t = 0 suman 15,000 + 18,843.68 + 16,727.75 + 15,298.23 = $65,869.66.',
      hint2: 'Resta: 83,169.11 − 65,869.66 = $17,299.45 en t = 0. Llévalo al mes 24: × (1.015)²⁴.',
      equationDisplay: '15,000(1.015)³⁰ + 20,000[(1.015)²⁶ + (1.015)¹⁸ + (1.015)¹²] + X(1.015)⁶ = 130,000',
      algebraSteps: [
        'En FF = 0: 15,000 + 18,843.68 + 16,727.75 + 15,298.23 + 0.699544 X = 83,169.11',
        '65,869.66 + 0.699544 X = 83,169.11  ⇒  0.699544 X = 17,299.45',
        'X = 17,299.45 / 0.699544 = $24,729.62',
      ],
      finalAnswer: 'X = $24,729.62 (incluyendo los $15,000 de hoy)',
      notebookNote:
        '¡Ojo con la nota en tus asesorías pág. 3! Sin los $15,000 iniciales el pizarrón daba $46,172.41; al incluirlos correctamente, tu último depósito baja a $24,729.62.',
    },
  },
  {
    id: 'p2-diap-nominal-no-anual',
    parcial: 'P2',
    sourceRef: 'Diap. Interés Compuesto y Tasas · Tasas nominales',
    title: 'Tasa Nominal Semestral i_s⁽⁶⁾ → Ecuación de Valor Trimestral',
    topicTag: 'Nominal NO anual · Equivalencia a trimestres',
    difficulty: 'Intermedio',
    statement:
      'Una deuda de $40,000 adquirida hoy se pacta con una tasa nominal semestral capitalizable mensualmente del 9% (i_s⁽⁶⁾ = 9%). Si haces un abono de $15,000 al final del 2º trimestre (mes 6), ¿de cuánto será el pago final X al final del 4º trimestre (mes 12)?',
    timeline: {
      maxTime: 5,
      defaultFF: 4,
      altFF: 0,
      altFFLabel: 'Comparar con FF = 0 (mismo resultado)',
      rate: Math.pow(1.015, 3) - 1,
      periodLabel: 'trimestres',
      flows: [
        { id: 'dn-d', label: 'Deuda hoy', side: 'debt', kind: 'single', amount: 40000, startTime: 0 },
        { id: 'dn-p1', label: 'Abono trim. 2', side: 'payment', kind: 'single', amount: 15000, startTime: 2 },
        { id: 'dn-x', label: 'Liquidación X', side: 'payment', kind: 'single', amount: 31423.08, isUnknown: true, unknownSymbol: 'X', startTime: 4 },
      ],
    },
    step1: {
      summary: 'La tasa está cotizada por semestre y capitaliza mensualmente (6 meses en un semestre): divide 9% entre 6.',
      rateConversion: 'i_m = 9% / 6 = 1.5% mensual · i_t = (1.015)³ − 1 = 4.5678% efectivo trimestral',
      checkpoint: {
        prompt: 'En i_s⁽⁶⁾ = 9%, ¿cuál es la tasa efectiva mensual?',
        options: ['9% / 12 = 0.75%', '9% / 6 = 1.5% (en 1 semestre caben 6 meses)', '9% directo'],
        correctIndex: 1,
        explanation: 'Al ser semestral, solo hay 6 capitalizaciones mensuales dentro del periodo cotizado.',
      },
    },
    step2: {
      summary: 'Ya en trimestres: $40,000 está en t = 0, el abono de $15,000 en t = 2 y la liquidación X en t = 4.',
      landingInsight: 'Con FF = 4 (fecha de X), tanto la deuda como el abono avanzan hacia adelante sin despejar fracciones.',
    },
    step3: {
      summary: 'En FF = 4: 40,000(1 + i_t)⁴ = 15,000(1 + i_t)² + X.',
      whyThisFF: 'Deja a X sola y despejada en un paso (además en compuesto puedes comprobar que FF = 0 da exactamente $31,423.08).',
      checkpoint: {
        prompt: '¿Qué es igual: (1 + i_t)⁴ o (1.015)¹²?',
        options: ['Son matemáticamente idénticos (4 trimestres = 12 meses)', '(1.015)¹² es mayor', '(1 + i_t)⁴ es mayor'],
        correctIndex: 0,
        explanation: 'Como (1 + i_t) = (1.015)³, elevar a la 4 es lo mismo que elevar 1.015 a la 12.',
      },
    },
    step4: {
      hint1: '40,000 × (1.015)¹² = $47,824.73.',
      hint2: '15,000 × (1.015)⁶ = $16,401.65. Resta ambos valores.',
      equationDisplay: 'X = 40,000(1 + i_t)⁴ − 15,000(1 + i_t)² = 40,000(1.015)¹² − 15,000(1.015)⁶',
      algebraSteps: [
        'i_m = 9% / 6 = 1.5%  ⇒  i_t = (1.015)³ − 1 = 4.567838%',
        'Deuda en t = 4: 40,000 × 1.195618 = $47,824.73',
        'Abono en t = 4: 15,000 × 1.093443 = $16,401.65',
        'X = 47,824.73 − 16,401.65 = $31,423.08',
      ],
      finalAnswer: 'X = $31,423.08',
    },
  },

  // ================= PARCIAL 1 (DIAPOSITIVAS: ACUMULACIÓN, INTERÉS SIMPLE Y DESCUENTO) =================
  {
    id: 'p1-diap-acumulacion-concepto',
    parcial: 'P1',
    sourceRef: 'Diap. Función Acumulación, Monto, Interés y Tasa · Base conceptual',
    title: 'Del Monto A(t) a la Tasa Efectiva de un Periodo (iₙ)',
    topicTag: 'A(t), a(t), Iₙ e iₙ',
    difficulty: 'Base',
    statement:
      'Una inversión sigue la función de monto A(t) = 500(1 + 0.04t). Identifica el capital inicial k, la función de acumulación a(t), los intereses ganados durante el 4º periodo (I₄) y la tasa efectiva del 4º periodo (i₄).',
    timeline: {
      maxTime: 5,
      defaultFF: 4,
      rate: 0.04,
      regime: 'simple',
      periodLabel: 'periodos',
      flows: [
        { id: 'dac-k', label: 'Capital k = A(0)', side: 'debt', kind: 'single', amount: 500, startTime: 0 },
        { id: 'dac-a4', label: 'Monto A(4)', side: 'payment', kind: 'single', amount: 580, isUnknown: true, unknownSymbol: 'A(4)', startTime: 4 },
      ],
    },
    step1: {
      summary: 'A(t) = k · a(t). Aquí k = A(0) = $500 y a(t) = 1 + 0.04t (crecimiento lineal = interés simple al 4%).',
      rateConversion: 'k = $500 · a(t) = 1 + 0.04t · Interés constante de $20 por periodo',
      checkpoint: {
        prompt: '¿Por qué la tasa efectiva i₄ en interés simple resulta MENOR que el 4% inicial?',
        options: [
          'Porque el interés ($20) siempre es igual, pero el saldo base A(3) = $560 ya creció',
          'Porque se restan impuestos',
          'En interés simple i₄ siempre vale 4%',
        ],
        correctIndex: 0,
        explanation: '¡Exacto! iₙ = Iₙ / A(n−1) = 20 / 560 = 3.5714%: en interés simple la tasa efectiva periódica va disminuyendo cada periodo.',
      },
    },
    step2: {
      summary: 'En t = 0 tienes $500; en t = 3 llevas $560; en t = 4 llegas a $580.',
      landingInsight: 'Compara siempre el salto I₄ = A(4) − A(3) contra el saldo al INICIO del 4º periodo: A(3).',
    },
    step3: {
      summary: 'i₄ = [A(4) − A(3)] / A(3) = (580 − 560) / 560.',
      whyThisFF: 'Esta definición general de tasa efectiva te sirve para cualquier función A(t), sea simple, compuesta o cuadrática.',
      checkpoint: {
        prompt: '¿Qué valor va en el denominador al calcular la tasa efectiva del periodo 4 (i₄)?',
        options: ['A(0) = 500', 'A(3) = 560 (inicio del periodo 4)', 'A(4) = 580'],
        correctIndex: 1,
        explanation: 'iₙ = Iₙ / A(n−1) siempre usa el saldo al final del periodo anterior.',
      },
    },
    step4: {
      hint1: 'Evalúa A(3) = 500(1.12) = $560 y A(4) = 500(1.16) = $580.',
      hint2: 'I₄ = 580 − 560 = $20; luego divide 20 entre 560.',
      equationDisplay: 'i₄ = (A(4) − A(3)) / A(3) = 20 / 560 = 3.5714%',
      algebraSteps: [
        'k = A(0) = $500  ·  a(t) = 1 + 0.04t',
        'A(3) = $560  ·  A(4) = $580  ⇒  I₄ = 580 − 560 = $20',
        'i₄ = 20 / 560 = 0.035714 = 3.5714%',
      ],
      finalAnswer: 'k = $500 · a(t) = 1+0.04t · I₄ = $20 · i₄ = 3.5714%',
    },
  },
  {
    id: 'p1-simple-ff-cambia',
    parcial: 'P1',
    sourceRef: 'Diap. Interés Simple · Propiedad clave',
    title: 'Interés Simple: ¿Por Qué SÍ Cambia al Mover la Fecha Focal?',
    topicTag: 'Interés Simple · Sensibilidad a FF',
    difficulty: 'Intermedio',
    statement:
      'Tienes una deuda de $10,000 que vence en el mes 6 y acuerdas pagarla con $4,000 en el mes 2 y un pago final X en el mes 9, al 2% mensual de INTERÉS SIMPLE. Calcula X usando FF = 9 y luego arrastra FF a 0 para ver cómo cambia.',
    timeline: {
      maxTime: 10,
      defaultFF: 9,
      altFF: 0,
      altFFLabel: 'Mover FF a 0 (¡mira cómo cambia X!)',
      rate: 0.02,
      regime: 'simple',
      periodLabel: 'meses',
      flows: [
        { id: 'ds1', label: 'Deuda original', side: 'debt', kind: 'single', amount: 10000, startTime: 6 },
        { id: 'ps1', label: 'Abono', side: 'payment', kind: 'single', amount: 4000, startTime: 2 },
        { id: 'xs1', label: 'Pago final', side: 'payment', kind: 'single', amount: 6040, isUnknown: true, unknownSymbol: 'X', startTime: 9 },
      ],
    },
    step1: {
      summary: 'En Interés Simple los factores son lineales: (1 + it) hacia adelante y 1/(1 + it) hacia atrás.',
      rateConversion: 'i = 2% mensual simple · Año comercial = 360 días (12 meses)',
      checkpoint: {
        prompt: '¿Por qué en Interés Simple cambiar la Fecha Focal altera X?',
        options: [
          'Porque (1 + it₁)(1 + it₂) ≠ 1 + i(t₁ + t₂): los intereses no se capitalizan',
          'Por redondeo',
          'No cambia',
        ],
        correctIndex: 0,
        explanation: 'Solo en interés compuesto cambiar la FF deja el resultado intacto.',
      },
    },
    step2: {
      summary: 'Mueve FF entre 9 y 0 en el diagrama: X salta de $6,040.00 a $6,000.62.',
      landingInsight: 'En Interés Simple obedece siempre la FF que indique el problema.',
    },
    step3: {
      summary: 'Con FF = 9: $10,000 avanza 3 meses (× 1.06) y $4,000 avanza 7 meses (× 1.14).',
      whyThisFF: 'Es la FF fijada por el enunciado.',
      checkpoint: {
        prompt: 'En interés simple al 2% mensual, ¿por cuánto multiplicas $10,000 de t = 6 a t = 9?',
        options: ['(1.02)³', '1 + (0.02)(3) = 1.06', '1 / 1.06'],
        correctIndex: 1,
        explanation: 'Avanzas 3 meses en simple ⇒ 1 + 0.02×3 = 1.06.',
      },
    },
    step4: {
      hint1: 'Deuda en FF = 9: 10,000 × 1.06 = $10,600.',
      hint2: 'Abono en FF = 9: 4,000 × 1.14 = $4,560. Resta para hallar X.',
      equationDisplay: '10,000(1 + 0.02·3) = 4,000(1 + 0.02·7) + X',
      algebraSteps: [
        '10,000 × 1.06 = $10,600.00',
        '4,000 × 1.14 = $4,560.00',
        'X = 10,600 − 4,560 = $6,040.00 (en FF = 9)',
      ],
      finalAnswer: 'X = $6,040.00 (en FF = 9)',
    },
  },
  {
    id: 'p1-diap-descuento-vs-interes',
    parcial: 'P1',
    sourceRef: 'Diap. Descuento · Equivalencia d vs i',
    title: 'Descuento Bancario vs Tasa de Interés Simple Equivalente',
    topicTag: 'Descuento V_d · Equivalencia i = d/(1−dt)',
    difficulty: 'Base',
    statement:
      'Un pagaré con valor nominal de $25,000 se descuenta 4 meses antes de vencer con una tasa de descuento simple del 12% anual. ¿Cuánto recibes realmente hoy (V_d) y qué tasa de interés simple anual (i) equivale a ese costo?',
    timeline: {
      maxTime: 5,
      defaultFF: 0,
      rate: 0.125 / 12,
      regime: 'simple',
      periodLabel: 'meses',
      flows: [
        { id: 'dd-vd', label: 'Recibido hoy V_d', side: 'debt', kind: 'single', amount: 24000, isUnknown: true, unknownSymbol: 'V_d', startTime: 0 },
        { id: 'dd-m', label: 'Valor Nominal M', side: 'payment', kind: 'single', amount: 25000, startTime: 4 },
      ],
    },
    step1: {
      summary: 'En descuento bancario el interés se calcula sobre el valor final M ($25,000) y se cobra por adelantado.',
      rateConversion: 'd = 12% anual · t = 4/12 años · Descuento D = M·d·t',
      checkpoint: {
        prompt: '¿La tasa de interés simple equivalente (i) será mayor o menor que la tasa de descuento (12%)?',
        options: [
          'Mayor (12.5%), porque pagas $1,000 sobre los $24,000 que recibiste, no sobre $25,000',
          'Menor que 12%',
          'Exactamente 12%',
        ],
        correctIndex: 0,
        explanation: 'Al recibir menos capital ($24,000) y pagar $1,000 de costo, tu tasa real i = d/(1−dt) siempre supera a d.',
      },
    },
    step2: {
      summary: 'En t = 0 recibes $24,000 y en t = 4 meses entregas el valor nominal completo de $25,000.',
      landingInsight: 'El costo financiero de $1,000 visto desde el capital recibido ($24,000) equivale a 12.5% anual simple.',
    },
    step3: {
      summary: 'V_d = M(1 − dt) y la tasa simple equivalente es i = d / (1 − dt).',
      whyThisFF: 'Te prepara directo para los ejercicios 16–20 de la Tarea 01.',
      checkpoint: {
        prompt: 'Si d = 12% y t = 4/12, ¿cuánto vale 1 − d·t?',
        options: ['0.96 (porque 0.12 × 4/12 = 0.04)', '0.88', '1.04'],
        correctIndex: 0,
        explanation: '0.12 × (4/12) = 0.04 ⇒ 1 − 0.04 = 0.96.',
      },
    },
    step4: {
      hint1: 'V_d = 25,000 × (1 − 0.12 × 4/12) = 25,000 × 0.96 = $24,000.',
      hint2: 'i = 1,000 / (24,000 × 4/12) = 0.12 / 0.96 = 12.5% anual.',
      equationDisplay: 'V_d = 25,000(1 − 0.12·4/12) = $24,000   ·   i = 0.12 / 0.96 = 12.5%',
      algebraSteps: [
        'Descuento D = 25,000 × 0.12 × (4/12) = $1,000',
        'Valor descontado recibido: V_d = 25,000 − 1,000 = $24,000.00',
        'Tasa simple equivalente: i = 0.12 / (1 − 0.04) = 0.125 = 12.5% anual',
      ],
      finalAnswer: 'V_d = $24,000.00 · Tasa simple equivalente i = 12.5% anual',
    },
  },
];
