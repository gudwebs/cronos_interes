export interface ExamTrap {
  id: string;
  parcial: 'P1' | 'P2' | 'P3';
  title: string;
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  whyStudentsFall: string;
  goldenRule: string;
  miniTimeline: {
    highlight: string;
    points: { t: string; label: string; tone?: 'ff' | 'landing' | 'pay' | 'trap' }[];
  };
}

export const EXAM_TRAPS: ExamTrap[] = [
  {
    id: 'trap-deferred-landing',
    parcial: 'P3',
    title: 'Anualidad diferida: ¿dónde cae aₙ?',
    scenario:
      'Un préstamo se paga con 6 pagos mensuales de $450. El primer pago se hace al final del mes 4 (t = 4, 5, 6, 7, 8, 9). Quieres traerlos a t = 0 usando a₆.',
    question: '¿Por qué factor vᵏ debes multiplicar 450 · a₆ para llegar a t = 0?',
    options: [
      'v⁴ (porque el primer pago es en el mes 4)',
      'v³ (porque a₆ ya cae en t = 3, un periodo antes del primer pago)',
      'No se multiplica por nada, a₆ ya llega a t = 0',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Muchos ven "primer pago en t = 4" y automáticamente ponen v⁴. Eso descuenta un periodo de más porque a₆ YA retrocedió un paso del mes 4 al mes 3.',
    goldenRule: 'aₙ cae en (t_primer_pago − 1). Si quieres usar v⁴, entonces la fórmula debe ser ä₆ (anticipada).',
    miniTimeline: {
      highlight: 'a₆ absorbe el paso de t=4 → t=3; solo faltan 3 saltos (v³)',
      points: [
        { t: 't=0', label: 'FF (Deuda)', tone: 'ff' },
        { t: 't=3', label: 'Cae a₆', tone: 'landing' },
        { t: 't=4', label: '1er pago', tone: 'pay' },
        { t: 't=9', label: '6to pago', tone: 'pay' },
      ],
    },
  },
  {
    id: 'trap-justo-antes',
    parcial: 'P3',
    title: 'Saldo Insoluto "JUSTO ANTES" vs "JUSTO DESPUÉS"',
    scenario:
      'Tienes 5 pagos anuales de $3,343.80 al 20% anual. Te piden el Saldo Insoluto JUSTO ANTES de realizar el 3er pago (SI₃⁻).',
    question: '¿Qué expresión prospectiva calcula exactamente SI₃⁻?',
    options: [
      '3,343.80 · a₂ (quedan 2 pagos después del 3ro)',
      '3,343.80 · a₃ (quedan 3 pagos vencidos)',
      '3,343.80 · ä₃ (quedan 3 pagos y el de t = 3 todavía no se paga)',
    ],
    correctIndex: 2,
    whyStudentsFall:
      'Por inercia calculan SI₃⁺ = R·a₂ (olvidando que el pago 3 aún no se entregó) o usan a₃ (que aterriza en t = 2, no en t = 3).',
    goldenRule: 'JUSTO DESPUÉS de pago k → R · a_{n−k}. JUSTO ANTES de pago k → R · ä_{n−k+1} (o SI_{k−1} · (1+i)).',
    miniTimeline: {
      highlight: 'En t=3 antes de pagar, debes t=3, t=4 y t=5 → ä₃ cae exacto en t=3',
      points: [
        { t: 't=1', label: 'Pagado', tone: 'pay' },
        { t: 't=2', label: 'Pagado', tone: 'pay' },
        { t: 't=3', label: 'FF = SI₃⁻ (¡Aún debes hoy!)', tone: 'ff' },
        { t: 't=4,5', label: 'Pendientes', tone: 'landing' },
      ],
    },
  },
  {
    id: 'trap-retiro-un-mes-despues',
    parcial: 'P3',
    title: 'Retiro 1 periodo DESPUÉS del último depósito',
    scenario:
      'Depositas $1,300 cada mes durante n meses al 1% mensual y retiras el total acumulado exactamente 1 mes DESPUÉS del último depósito.',
    question: '¿Cuál fórmula aterriza justo en el momento del retiro?',
    options: [
      '1,300 · sₙ',
      '1,300 · s̈ₙ  (equivalente a 1,300 · sₙ · (1+i))',
      '1,300 · äₙ',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Ven "depósitos vencidos" y usan sₙ sin notar que el dinero sigue ganando interés un mes extra después del último depósito.',
    goldenRule: 'sₙ aterriza EL DÍA del último depósito. s̈ₙ aterriza UN PERIODO DESPUÉS del último depósito.',
    miniTimeline: {
      highlight: '1 mes extra de intereses convierte sₙ en s̈ₙ = sₙ(1+i)',
      points: [
        { t: 't=1', label: '1er dep.', tone: 'pay' },
        { t: 't=n', label: 'Último dep. (sₙ)', tone: 'trap' },
        { t: 't=n+1', label: 'Retiro (cae s̈ₙ)', tone: 'ff' },
      ],
    },
  },
  {
    id: 'trap-pago-extra-decimal',
    parcial: 'P3',
    title: 'El decimal de n NO es el pago extra',
    scenario:
      'Al despejar cuántos pagos de $3,175 liquidan una deuda obtienes n = 36.136 pagos.',
    question: '¿Cómo obtienes el monto exacto del pago extra X hecho en el mes 37?',
    options: [
      'Multiplicando 0.136 × 3,175 = $431.80',
      'Planteando D = 3,175 · a₃₆ + X · v³⁷ y despejando X',
      'Redondeando a 37 pagos iguales de $3,175',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Multiplicar la parte decimal (0.136) por R parece intuitivo, pero ignora el efecto compuesto del tiempo y da un valor incorrecto.',
    goldenRule: 'Siempre toma la parte entera k = ⌊n⌋ y resuelve la ecuación de valor con X en t = k (mismo mes) o t = k+1 (mes siguiente).',
    miniTimeline: {
      highlight: '0.136 × R es solo aproximación; la ecuación de valor es exacta',
      points: [
        { t: 't=0', label: 'Deuda D', tone: 'ff' },
        { t: 't=1..36', label: '36 pagos completos', tone: 'pay' },
        { t: 't=37', label: 'Extra X · v³⁷', tone: 'landing' },
      ],
    },
  },
  {
    id: 'trap-retrospectivo-sin-n',
    parcial: 'P3',
    title: 'Prospectivo imposible cuando no conoces n',
    scenario:
      'Compras mercancía por $99,000 con pagos mensuales de $17,200 al 1.2% mensual, pero el problema NO dice cuántos pagos son en total. Te piden SI₄.',
    question: '¿Qué camino te lleva directo a SI₄ sin complicarte?',
    options: [
      'Retrospectivo: 99,000(1.012)⁴ − 17,200 · s₄',
      'Prospectivo: 17,200 · a₄',
      'Dividir 99,000 entre 17,200 y restar 4',
    ],
    correctIndex: 0,
    whyStudentsFall:
      'Intentan forzar el método prospectivo cuando no saben cuántos pagos quedan (y encima el último pago probablemente sea irregular).',
    goldenRule: '¿No conoces n o hay pago extra al final? Usa Retrospectivo: D(1+i)ᵏ − R·sₖ.',
    miniTimeline: {
      highlight: 'Mirar hacia atrás (t=0..4) solo usa datos que SÍ conoces',
      points: [
        { t: 't=0', label: 'D = $99,000', tone: 'pay' },
        { t: 't=1..4', label: '4 pagos ($17,200)', tone: 'pay' },
        { t: 't=4', label: 'FF = SI₄', tone: 'ff' },
        { t: 't=?', label: 'n desconocido', tone: 'trap' },
      ],
    },
  },
  {
    id: 'trap-nominal-no-anual',
    parcial: 'P2',
    title: 'Tasa nominal NO anual (ej. 8% semestral convertible mensualmente)',
    scenario:
      'El enunciado dice: "tasa del 8% semestral capitalizable mensualmente" (notación UDLAP: i_s⁽⁶⁾ = 8%).',
    question: '¿Cuál es la tasa efectiva mensual?',
    options: [
      '8% / 12 = 0.6667% mensual',
      '8% / 6 = 1.3333% mensual (hay 6 meses en un semestre)',
      '(1.08)^(1/6) − 1 = 1.2909% mensual',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'O dividen entre 12 por costumbre (como si fuera anual) o sacan raíz sexta (como si el 8% fuera efectiva semestral).',
    goldenRule: 'Si dice "convertible/capitalizable", es NOMINAL: divide entre cuántos subperiodos caben en el periodo cotizado (6 meses en 1 semestre).',
    miniTimeline: {
      highlight: 'Nominal = dividir (8%/6) · Efectiva = potencia/raíz ((1.08)^(1/6)−1)',
      points: [
        { t: 'Nominal', label: 'i_s⁽⁶⁾ = 8%', tone: 'trap' },
        { t: '÷ 6', label: '6 meses/sem', tone: 'landing' },
        { t: 'Efectiva', label: 'i_m = 1.3333%', tone: 'ff' },
      ],
    },
  },
  {
    id: 'trap-tasas-cambiantes-puente',
    parcial: 'P3',
    title: 'Tasas cambiantes: cruzar la frontera con la tasa equivocada',
    scenario:
      'Años 0–2 tienen tasa 13% anual. Año 2–3 tiene tasa 8% semestral. Los 12 pagos del Año 2–3 ya los valuaste al inicio del año 2 ($77,356.86).',
    question: 'Para llevar esos $77,356.86 desde el año 2 hasta t = 0, ¿qué tasa aplicas?',
    options: [
      'La del Año 2–3 (8% semestral) porque de ahí vienen los pagos',
      'La de Años 0–2 (13% anual): 77,356.86 / (1.13)²',
      'Cualquiera de las dos',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Asocian la tasa al flujo y no al tramo de tiempo que el dinero está atravesando.',
    goldenRule: 'El dinero siempre paga "peaje" con la tasa vigente en la zona del calendario que está cruzando.',
    miniTimeline: {
      highlight: 'Para cruzar de t=2 a t=0 usas la tasa de la zona [0, 2]',
      points: [
        { t: 't=0', label: 'FF', tone: 'ff' },
        { t: 'Zona [0,2]', label: 'Peaje: 13% anual', tone: 'landing' },
        { t: 't=2', label: 'VP₂ = $77,357', tone: 'pay' },
        { t: 'Zona [2,3]', label: '8% semestral', tone: 'trap' },
      ],
    },
  },
  {
    id: 'trap-simple-ff',
    parcial: 'P1',
    title: 'Cambiar la Fecha Focal en Interés Simple',
    scenario:
      'Estás resolviendo un ejercicio de Interés Simple donde te especifican "tome como fecha focal el mes 9". Para ahorrarte cuentas decides poner FF = 0.',
    question: '¿Qué pasa con tu respuesta?',
    options: [
      'Da exactamente lo mismo que con FF = 9',
      'Te dará un número diferente y estará mal en el examen',
      'Solo cambia si la tasa es mayor al 10%',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Se acostumbran a la libertad del Interés Compuesto (donde cualquier FF sirve) y la aplican a Interés Simple.',
    goldenRule: 'Compuesto: elige la FF que te haga menos álgebra. Simple: OBEDECE la FF del enunciado.',
    miniTimeline: {
      highlight: 'Interés Simple NO es invariante a la Fecha Focal',
      points: [
        { t: 'FF=0', label: 'X = $6,000.62', tone: 'trap' },
        { t: '≠', label: 'Distintos!', tone: 'landing' },
        { t: 'FF=9', label: 'X = $6,040.00', tone: 'ff' },
      ],
    },
  },
  {
    id: 'trap-pago-16-frecuencias',
    parcial: 'P3',
    title: 'Contar el "pago k" cuando cambia la frecuencia',
    scenario:
      'Primero haces 12 pagos BIMESTRALES (años 0–2) y luego pagos MENSUALES (año 2–3). Te piden el Saldo Insoluto tras el pago número 16.',
    question: '¿En qué mes del calendario ocurre el pago 16?',
    options: [
      'En el mes 16',
      'En el mes 28 (12 bimestres = 24 meses + 4 meses más)',
      'En el mes 32',
    ],
    correctIndex: 1,
    whyStudentsFall:
      'Confunden el número de pago (k = 16) con el número de mes (t = 16).',
    goldenRule: 'Dibuja siempre la línea de tiempo con una sola unidad base (meses) y marca qué número de pago cae en cada fecha.',
    miniTimeline: {
      highlight: 'Pago #12 cae en mes 24 → Pago #16 cae en mes 28',
      points: [
        { t: 'Mes 0', label: 'Inicio', tone: 'pay' },
        { t: 'Mes 24', label: 'Pago #12 (fin bimestrales)', tone: 'landing' },
        { t: 'Mes 28', label: 'Pago #16 (+4 meses)', tone: 'ff' },
      ],
    },
  },
  {
    id: 'trap-anualidad-tasa-frecuencia',
    parcial: 'P3',
    title: 'Meter tasa anual en anualidad mensual',
    scenario:
      'Los pagos son MENSUALES de $2,000 durante 2 años, y te dan una tasa efectiva ANUAL del 12%.',
    question: '¿Qué tasa i y qué número n metes en aₙ|i?',
    options: [
      'i = 12%, n = 24',
      'i = 1% (12%/12), n = 24',
      'i = (1.12)^(1/12) − 1 = 0.9489%, n = 24',
    ],
    correctIndex: 2,
    whyStudentsFall:
      'Dividen 12%/12 como si fuera tasa nominal i⁽¹²⁾, pero el enunciado dijo tasa EFECTIVA anual.',
    goldenRule: 'La tasa efectiva i y el contador n SIEMPRE deben tener exactamente la misma unidad que los pagos. Si la tasa dada es efectiva, convierte con raíz/potencia.',
    miniTimeline: {
      highlight: 'Pagos mensuales + Tasa efectiva anual → raíz 12ava',
      points: [
        { t: 'Efectiva anual', label: '12%', tone: 'trap' },
        { t: '(1.12)^(1/12)−1', label: 'Equivalencia', tone: 'landing' },
        { t: 'Mensual', label: 'i_m = 0.9489%, n=24', tone: 'ff' },
      ],
    },
  },
];
