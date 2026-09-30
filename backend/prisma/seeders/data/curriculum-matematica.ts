// =============================================================================
// Adecuación Curricular — Área de Matemática, Nivel Secundario (MINERD).
// Transcripción de `.docs/documentacion/Adecuacion matematicas.pdf`
// (págs. 139-161). Es la fuente de verdad de la planificación y de la IA.
// =============================================================================

export type FundamentalCode =
  | 'COMUNICATIVA'
  | 'PENSAMIENTO_LOGICO'
  | 'RESOLUCION_PROBLEMAS'
  | 'ETICA_CIUDADANA'
  | 'CIENTIFICA_TECNOLOGICA'
  | 'AMBIENTAL_SALUD'
  | 'DESARROLLO_PERSONAL';

export interface FundamentalSeed {
  code: FundamentalCode;
  name: string;
  shortName: string;
  /** Bloque del registro de calificaciones (PC1…PC4). */
  gradingBlock: number;
  order: number;
}

export const FUNDAMENTAL_COMPETENCES: FundamentalSeed[] = [
  { code: 'COMUNICATIVA', name: 'Comunicativa', shortName: 'Comunica', gradingBlock: 1, order: 1 },
  { code: 'PENSAMIENTO_LOGICO', name: 'Pensamiento Lógico, Creativo y Crítico', shortName: 'Argumenta', gradingBlock: 2, order: 2 },
  { code: 'RESOLUCION_PROBLEMAS', name: 'Resolución de Problemas', shortName: 'Resuelve problemas', gradingBlock: 2, order: 3 },
  { code: 'ETICA_CIUDADANA', name: 'Ética y Ciudadana', shortName: 'Ética', gradingBlock: 3, order: 4 },
  { code: 'CIENTIFICA_TECNOLOGICA', name: 'Científica y Tecnológica', shortName: 'Modela', gradingBlock: 4, order: 5 },
  { code: 'AMBIENTAL_SALUD', name: 'Ambiental y de la Salud', shortName: 'Ambiental', gradingBlock: 4, order: 6 },
  { code: 'DESARROLLO_PERSONAL', name: 'Desarrollo Personal y Espiritual', shortName: 'Desarrollo personal', gradingBlock: 3, order: 7 },
];

export interface GradeSeed {
  code: string;
  name: string;
  cycle: number;
  order: number;
  focus: string;
  specificCompetences: Record<FundamentalCode, string>;
  contents: {
    concepts: Array<{ block: string; description: string }>;
    procedures: string[];
    attitudes: string[];
  };
  indicators: string[];
}

/** Criterios de evaluación por ciclo y competencia fundamental. */
export const EVALUATION_CRITERIA: Record<number, Record<FundamentalCode, string[]>> = {
  1: {
    COMUNICATIVA: [
      'Interpretación sobre situaciones del contexto usando el lenguaje propio de la matemática.',
      'Comunicación de ideas a partir de ensayos y proyectos matemáticos de situaciones de la comunidad.',
      'Uso de diferentes símbolos para comunicar ideas matemáticas.',
    ],
    PENSAMIENTO_LOGICO: [
      'Aplicación del razonamiento lógico frente a problemas del contexto.',
      'Empleo de procedimientos lógicos matemáticos en situaciones que se presentan en la comunidad.',
      'Argumentación sobre ideas matemáticas contenidas en diferentes medios publicitarios y de ámbito social.',
    ],
    RESOLUCION_PROBLEMAS: [
      'Identificación de métodos efectivos para resolver problemas matemáticos.',
      'Empleo de métodos matemáticos conocidos para la resolución de problemas del medio ambiente.',
      'Interpretación de presupuesto familiar empleando los conocimientos matemáticos que posee para la toma de conciencia e incentivo del ahorro.',
    ],
    ETICA_CIUDADANA: [
      'Formulación de ideas en la que intervienen conocimientos matemáticos respetando las diferencias de los demás.',
      'Actitud crítica frente a situaciones matemáticas diversas.',
      'Responsabilidad ante acciones matemáticas concretas en favor de la comunidad.',
    ],
    CIENTIFICA_TECNOLOGICA: [
      'Evaluación de la utilidad práctica de herramientas tecnológicas para la interpretación de ideas matemáticas en situaciones diversas.',
      'Análisis de la utilidad de herramientas tecnológicas frente a la exposición de los resultados de un ensayo basado en la solución de un problema de la comunidad a partir de la matemática.',
      'Empleo de herramientas tecnológicas en situaciones que ameriten análisis estadísticos.',
    ],
    AMBIENTAL_SALUD: [
      'Identificación de problemáticas de la comunidad a fin de contribuir a su solución desde los conocimientos matemáticos que posee.',
      'Diseño de actividades concretas del contexto que tributan a resolver situaciones del medio ambiente empleando ideas matemáticas.',
      'Aplicación adecuada de los resultados de un proyecto matemático a fin de dar solución a un caso específico de la comunidad.',
    ],
    DESARROLLO_PERSONAL: [
      'Actitud de respeto y convivencia pacífica frente a diferentes ideas y puntos de vista ante la solución de una determinada situación matemática.',
      'Valoración de las diferentes técnicas matemáticas empleadas en la resolución de una determinada situación.',
      'Respeto por la diversidad de métodos matemáticos empleados por diferentes personas al enfrentarse a una determinada situación de la comunidad.',
    ],
  },
  2: {
    COMUNICATIVA: [
      'Interpretación y uso del lenguaje matemático tomando en cuenta el contexto y asumiendo una postura crítica frente a ideas no sustentadas en procesos matemáticos.',
      'Producción y comunicación clara de ideas a partir de ensayos, proyectos y estudios de casos vinculadas a situaciones matemáticas.',
      'Uso de diferentes códigos, símbolos y modelos matemáticos para la comunicación efectiva de las ideas.',
    ],
    PENSAMIENTO_LOGICO: [
      'Aplicación del razonamiento lógico frente a problemas del contexto.',
      'Empleo de procedimientos lógicos matemáticos en situaciones que se presentan en la comunidad.',
      'Argumentación sobre ideas matemáticas contenidas en diferentes medios publicitarios y de ámbito social.',
    ],
    RESOLUCION_PROBLEMAS: [
      'Aplicación de estrategias diversas, métodos y principios matemáticos para la resolución de problemas diversos.',
      'Empleo de modelos matemáticos para predecir y dar soluciones concretas a situaciones climatológicas que puedan afectar el medio ambiente.',
      'Interpretación y solución de situaciones económicas y financieras desde los conocimientos matemáticos que posee para la toma de decisiones.',
    ],
    ETICA_CIUDADANA: [
      'Planteamiento ético de ideas a partir de reportes de investigación sobre la base de un análisis crítico desde la matemática.',
      'Respeto en el planteamiento de ideas sustentadas en los procesos matemáticos ante diferencias de criterios en la resolución de un problema.',
      'Implementación adecuada de los principios éticos asociada a la investigación matemática.',
    ],
    CIENTIFICA_TECNOLOGICA: [
      'Empleo de herramientas tecnológicas para la interpretación de modelos matemáticos en situaciones del contexto.',
      'Interpretación de predicciones estadísticas simuladas a partir del uso de las tecnologías.',
      'Formulación de ideas matemáticas a partir del uso de herramientas tecnológicas.',
      'Hallazgos de regularidades matemáticas en la comunidad con el uso de herramientas tecnológicas.',
    ],
    AMBIENTAL_SALUD: [
      'Desarrollo de proyectos que impliquen los conocimientos matemáticos en situaciones propias del medio ambiente.',
      'Formulación de acciones concretas desde la matemática para el cuidado del medio ambiente y el desarrollo sostenible de la comunidad.',
      'Aplicación de los conocimientos estadísticos para el análisis de datos sobre situaciones de salud y medio ambiente.',
    ],
    DESARROLLO_PERSONAL: [
      'Manifestación de respeto frente a las ideas matemáticas y de otros tipos expuestas ante un colectivo de personas que buscan resolver un problema de la comunidad.',
      'Valoración de los procesos matemáticos implicados en la resolución de problemas.',
      'Actitud crítica y de respeto frente a situaciones diversas que ameriten la aplicación de ideas matemáticas.',
    ],
  },
};

export const GRADES: GradeSeed[] = [
  // ───────────────────────────── 1ro ─────────────────────────────
  {
    code: 'SEC-1',
    name: '1ro de Secundaria',
    cycle: 1,
    order: 1,
    focus: 'Sistemas numéricos con énfasis en los números racionales; introducción a geometría, medición y estadística.',
    specificCompetences: {
      COMUNICATIVA:
        'Interpreta ideas haciendo uso de la numeración matemática dentro de los sistemas numéricos y los relaciona con los conceptos de activos, pasivos, patrimonio, ingresos, gastos y costos para organizar las finanzas.',
      PENSAMIENTO_LOGICO: 'Explica lógicamente situaciones de la comunidad sobre conocimientos básicos de la geometría.',
      RESOLUCION_PROBLEMAS:
        'Plantea soluciones a diferentes situaciones que impliquen conocimientos de medición a partir del uso de los sistemas numéricos.',
      ETICA_CIUDADANA:
        'Interpreta situaciones que impliquen conocimientos de medición respetando diferentes puntos de vista y asumiendo actitud responsable.',
      CIENTIFICA_TECNOLOGICA:
        'Analiza diferentes tipos de herramientas tecnológicas para la resolución de problemas en la que intervenga la numeración y la estadística.',
      AMBIENTAL_SALUD:
        'Usa los conocimientos de numeración y estadística a fin de contribuir a la solución de situaciones de la comunidad para una vida saludable.',
      DESARROLLO_PERSONAL:
        'Asume una actitud responsable en la interpretación de situaciones que implique conocimientos de medición respetando diferentes puntos de vista.',
    },
    contents: {
      concepts: [
        { block: 'Numeración', description: 'Números enteros. Números racionales.' },
        { block: 'Finanzas', description: 'Matemática financiera asociada al interés simple. Economía y finanza.' },
        { block: 'Rectas y ángulos', description: 'Rectas y sus tipos. Ángulos y sus tipos. Teorema de Pitágoras.' },
        { block: 'Unidades de medida', description: 'Volumen de prismas y pirámides.' },
        {
          block: 'Estadística',
          description:
            'Gráficos estadísticos para datos agrupados. Medidas de tendencia central. Evento de un experimento aleatorio simple. Probabilidad de ocurrencia para eventos simples.',
        },
      ],
      procedures: [
        'Identificación, lectura y escritura de números enteros.',
        'Lectura, escritura y representación de números racionales.',
        'Determinación del valor absoluto de un número racional.',
        'Resolución de problemas de la cotidianidad que implican el uso de números racionales.',
        'Análisis de la etimología y definición del concepto de economía.',
        'Clasificación de las principales áreas de estudio de la economía.',
        'Clasificación y análisis de los recursos que intervienen como elementos en las acciones económicas.',
        'Elaboración de proyectos que impliquen el análisis de acciones económicas y de emprendimiento para un medio ambiente sostenible.',
        'Resolución de problemas que involucren por ciento, interés simple, capital y monto.',
        'Construcción de rectas paralelas y perpendiculares, bisectriz de diferentes ángulos. Cálculo de complemento y suplemento de ángulos.',
        'Resolución de problemas aplicando el teorema de Pitágoras.',
        'Utilización del sistema de coordenadas cartesianas para la localización de puntos en el plano y trazo de las figuras que se determinan.',
        'Conversiones y estimación de toneladas a gramos y kilogramos.',
        'Elaboración de horarios y cronogramas, comparación de tiempo expresado en diferentes unidades, estimación de duración de tiempos.',
        'Identificación de temperaturas en diferentes termómetros.',
        'Identificación de las unidades de medida. Sistemas científicos y vulgares, Sistema Inglés, MKS, CGS y Sistema Internacional de Medidas (SI).',
        'Cálculo de área y de volumen de un prisma recto de base triangular y trapezoidal, y de una pirámide de base cuadrangular y triangular.',
        'Construcción e interpretación de gráficos estadísticos para datos agrupados.',
        'Determinación y aplicación de medidas de tendencia central.',
        'Construcción de espacios muestrales para eventos simples.',
        'Cálculo de probabilidades para eventos simples.',
      ],
      attitudes: [
        'Interés por comunicar ideas matemáticas de forma clara y coherente que involucren números enteros y racionales.',
        'Disfrute en la resolución y análisis de acciones económicas y financieras.',
        'Interés por crear y utilizar representaciones gráficas tanto del teorema de Pitágoras como de figuras en el eje cartesiano, usando algún software.',
        'Apreciación de la importancia del manejo de las unidades de medida para resolver problemas de la cotidianidad.',
        'Rigor, flexibilidad y originalidad en la resolución de problemas de áreas y volúmenes.',
        'Interés por crear y utilizar representaciones gráficas sobre datos estadísticos a través del uso de dispositivos electrónicos.',
        'Rigor, flexibilidad y originalidad en los procesos seguidos en el cálculo de medidas estadísticas de tendencia central.',
      ],
    },
    indicators: [
      'Lee informaciones básicas asociadas a la numeración matemática de enteros, racionales, irracionales y reales.',
      'Interpreta datos y gráficos en reportes de investigación y otros medios de comunicación a partir de los conocimientos de economía y finanzas.',
      'Comunica informaciones relacionadas a proyectos en las que se apliquen los conocimientos de Geometría, Medición y Estadística.',
      'Aplica lógicamente sus conocimientos de numeración matemática asociada a números enteros, racionales, irracionales y reales en situaciones diversas.',
      'Representa lógicamente informaciones del contexto a partir de los conceptos de geometría y medición en diferentes situaciones del contexto.',
      'Toma decisiones adecuadas y de manera lógica a partir de situaciones del entorno en las que se apliquen los conocimientos básicos de estadística y probabilidad.',
      'Resuelve problemas asociados a los conocimientos de numeración matemática con enteros, racionales, irracionales y reales.',
      'Resuelve a partir de un método conocido problemas del contexto en los que se pone en práctica conocimientos de geometría y medición.',
      'Emplea diferentes métodos para resolver un problema del contexto en el que se apliquen los conocimientos de estadística y probabilidad.',
      'Asume una actitud ética al interpretar situaciones referidas a la numeración matemática con números enteros, racionales, irracionales y reales.',
      'Emplea de manera responsable los conocimientos sobre geometría y medición en problemas y situaciones de la comunidad.',
      'Aplica con sentido ético modelos asociados a la estadística y la probabilidad para la toma de decisiones.',
      'Identifica de manera adecuada herramientas tecnológicas para interpretar soluciones de situaciones diversas asociadas a la numeración matemática con enteros, racionales, irracionales y reales.',
      'Usa aplicaciones tecnológicas convenientes para presentar los resultados de un proyecto de investigación en el que se integren los conocimientos de geometría y medición.',
      'Modela a partir del uso de herramientas científicas y tecnológicas situaciones referidas a la estadística y la probabilidad.',
      'Elabora reportes de investigación en los que se apliquen los conocimientos de numeración matemática con enteros, racionales, irracionales y reales.',
      'Identifica por medio de los conocimientos sobre geometría y medición posibles soluciones ante situaciones de salud que se presentan en la comunidad.',
      'Elabora proyectos comunitarios para dar soluciones particulares a situaciones del medio ambiente aplicando los conocimientos de estadística y probabilidad.',
      'Resuelve respetando diferentes criterios de resolución procesos matemáticos de numeración matemática asociados a los enteros, racionales, irracionales y reales.',
      'Manifiesta en una puesta en común y manteniendo respeto para la convivencia pacífica los resultados de informes y estudios de casos empleando los conocimientos de geometría y medición.',
      'Mantiene actitud de respeto personal y espiritual al momento de compartir diferentes criterios de interpretación de problemas asociados a la estadística y la probabilidad.',
    ],
  },
  // ───────────────────────────── 2do ─────────────────────────────
  {
    code: 'SEC-2',
    name: '2do de Secundaria',
    cycle: 1,
    order: 2,
    focus: 'Números reales; álgebra elemental, planificación financiera, geometría plana y estadística.',
    specificCompetences: {
      COMUNICATIVA:
        'Explica sus ideas haciendo uso de los reales como sistema numérico y los vincula a situaciones que impliquen tasa de interés y finanzas para generar ingresos.',
      PENSAMIENTO_LOGICO:
        'Argumenta con sentido lógico aplicando los conocimientos sobre los reales a partir de situaciones algebraicas diversas.',
      RESOLUCION_PROBLEMAS:
        'Interpreta y resuelve diferentes tipos de problemas que impliquen los reales vinculándolos a situaciones de la geometría.',
      ETICA_CIUDADANA:
        'Muestra autonomía en la búsqueda de soluciones a situaciones que impliquen los conocimientos de números reales respetando diferentes criterios de solución.',
      CIENTIFICA_TECNOLOGICA:
        'Utiliza herramientas tecnológicas en la resolución de problemas que impliquen la numeración y la estadística para datos agrupados.',
      AMBIENTAL_SALUD:
        'Evalúa los conocimientos obtenidos de números reales para dar respuesta a situaciones que permitan contribuir a una vida saludable.',
      DESARROLLO_PERSONAL:
        'Muestra autonomía en la búsqueda de soluciones a situaciones que impliquen los conocimientos de números reales respetando diferentes criterios de solución.',
    },
    contents: {
      concepts: [
        { block: 'Numeración', description: 'Números reales y sus propiedades, números irracionales, patrones numéricos.' },
        {
          block: 'Álgebra',
          description:
            'Expresiones algebraicas. Conceptos de ecuación, desigualdad y propiedades. Planificación financiera, interés compuesto, monto.',
        },
        {
          block: 'Geometría',
          description:
            'Geometría plana: origen, evolución y clasificación; plano cartesiano; distancia entre dos puntos del plano cartesiano; fórmula de Herón; teorema fundamental del triángulo; área y volumen de cuerpos redondos.',
        },
        {
          block: 'Estadística',
          description:
            'Estadística y probabilidad para eventos compuestos. Medidas de dispersión y posición. Experimentos aleatorios simples y compuestos para datos agrupados. Diagramas de árbol, polígonos de frecuencias y gráficos circulares.',
        },
      ],
      procedures: [
        'Operaciones en los números reales: adición, sustracción, multiplicación, división, potenciación y radicación.',
        'Establecimiento de patrones numéricos en una situación planteada.',
        'Resolución de problemas de situaciones del contexto que impliquen el uso de las operaciones aritméticas fundamentales con números reales.',
        'Traducción de lenguaje algebraico a lenguaje ordinario y viceversa.',
        'Reducción de términos semejantes.',
        'Evaluación de expresiones algebraicas usando las diferentes modalidades de cálculo (mental, escrito y electrónico), cuidando el orden de las operaciones.',
        'Resolución de problemas que impliquen el planteo y solución de ecuaciones e inecuaciones de primer grado.',
        'Definición y análisis del concepto de planificación financiera.',
        'Elaboración de proyectos a partir de una planificación financiera que implique ahorro de recursos naturales y económicos.',
        'Cálculo de interés compuesto en una determinada situación financiera.',
        'Investigación en fuentes seguras sobre el origen y evolución de la geometría.',
        'Representación de figuras geométricas en el plano cartesiano.',
        'Cálculo de la distancia entre dos puntos y longitud de un segmento en el plano.',
        'Aplicación de la fórmula de Herón. Demostración y aplicación del teorema fundamental del triángulo.',
        'Cálculo de área y volumen de un cono recto, de un cilindro recto y de una esfera. Construcción y desarrollo plano de cuerpos redondos.',
        'Resolución de problemas cotidianos en los que intervienen cuerpos redondos y polígonos en el plano cartesiano.',
        'Cálculo de medidas de dispersión y posición: rango, desviación típica, desviación media, deciles, cuartiles, quintiles y varianza.',
        'Cálculo de la probabilidad de un evento mediante tablas de números aleatorios.',
        'Construcción de diagramas de árbol, polígonos de frecuencia y gráficos circulares.',
      ],
      attitudes: [
        'Valoración del uso de los números reales en el desarrollo de su vida cotidiana.',
        'Valoración del uso del álgebra en el desarrollo de su vida cotidiana.',
        'Disfrute del proceso de resolver de forma satisfactoria problemas que involucren ecuaciones e inecuaciones.',
        'Valoración del lenguaje matemático como una forma de ampliar el vocabulario para una mejor comunicación.',
        'Interés por la utilidad de la matemática en la resolución de problemas de la vida cotidiana que involucren cuerpos redondos y plano cartesiano.',
        'Apreciación de la aplicación de instrumentos tecnológicos como la brújula, el mapa, Google Maps y GPS para la ubicación espacial.',
        'Reconoce el valor de los conceptos estadísticos y probabilísticos en la solución de problemas de la vida diaria.',
        'Disfrute de la determinación de medidas elementales de dispersión.',
      ],
    },
    indicators: [
      'Lee informaciones en diferentes contextos a partir de los conocimientos que posee sobre los números reales, números irracionales, expresiones algebraicas, finanzas, geometría y estadística.',
      'Expresa los resultados de un proyecto de investigación en el que se evidencie la aplicación de los números reales, expresiones algebraicas, finanzas, geometría y estadística.',
      'Interpreta situaciones de la comunidad empleando en su lenguaje los números reales, números irracionales, expresiones algebraicas, finanzas, geometría y estadística.',
      'Toma decisiones lógicas a partir del análisis sobre situaciones del entorno en las que se apliquen los principios de números reales, algebraicos, finanzas, geometría y estadística.',
      'Modela aplicando el pensamiento lógico situaciones del contexto a partir de los conceptos de experimentos aleatorios, algebraicos, geométricos y estadísticos.',
      'Razona y analiza las posibles soluciones de un estudio de caso referido a una situación algebraica, financiera, geométrica y estadística.',
      'Resuelve un estudio de caso del contexto que implique el conocimiento acerca de los números reales, álgebra, finanza, geometría y estadística, respetando diferentes criterios de resolución.',
      'Resuelve a partir de modelos algebraicos, geométricos y estadísticos situaciones que se presentan en la comunidad y el entorno.',
      'Resuelve un problema del contexto en el que se apliquen los conocimientos de álgebra, finanza, geometría y estadística.',
      'Asume con una actitud ética la solución de situaciones problemáticas del entorno que se refieran a numeración, álgebra, finanzas, geometría y estadística.',
      'Emplea los conocimientos sobre numeración, álgebra, geometría, finanza y estadística en la solución de un estudio de caso en la comunidad.',
      'Identifica herramientas y aplicaciones tecnológicas para interpretar soluciones de situaciones diversas sobre números reales, álgebra, geometría, finanzas y estadística.',
      'Utiliza en la presentación de un informe de investigación los conocimientos sobre numeración, álgebra, geometría y estadística aplicando recursos de la tecnología.',
      'Aplica herramientas tecnológicas para resolver una situación particular de la comunidad utilizando numeración, álgebra, finanza, geometría y estadística.',
      'Analiza empleando la numeración, el álgebra, la finanza, la geometría y la estadística un proyecto de investigación sobre factores que puedan afectar la salud de las personas.',
      'Representa a partir de informaciones numéricas, algebraicas, geométricas y estadísticas modelos de intervención sobre medio ambiente y la salud de una comunidad.',
      'Presenta en una puesta en común los resultados de un informe de investigación sobre desarrollo personal y espiritual en el que se apliquen los conocimientos de numeración, álgebra, geometría, finanza y estadística.',
    ],
  },
  // ───────────────────────────── 3ro ─────────────────────────────
  {
    code: 'SEC-3',
    name: '3ro de Secundaria',
    cycle: 1,
    order: 3,
    focus: 'Alfabetización del álgebra: polinomios, factorización, ecuaciones, sistemas y funciones.',
    specificCompetences: {
      COMUNICATIVA: 'Comunica sus ideas haciendo uso del lenguaje algebraico en situaciones diversas.',
      PENSAMIENTO_LOGICO: 'Interpreta lógicamente situaciones del contexto aplicando los conocimientos del álgebra.',
      RESOLUCION_PROBLEMAS: 'Resuelve problemas de la comunidad que impliquen los principios y teorías del álgebra.',
      ETICA_CIUDADANA:
        'Muestra actitud crítica en la búsqueda de soluciones a situaciones que impliquen los conocimientos y principios del álgebra.',
      CIENTIFICA_TECNOLOGICA:
        'Emplea herramientas tecnológicas en la resolución e interpretación de problemas de tipo algebraicos.',
      AMBIENTAL_SALUD: 'Aplica los conocimientos y modelos algebraicos para interpretar situaciones referidas a la salud.',
      DESARROLLO_PERSONAL:
        'Muestra actitud crítica y de respeto en la búsqueda de soluciones a situaciones que impliquen los conocimientos y principios del álgebra.',
    },
    contents: {
      concepts: [
        {
          block: 'Álgebra',
          description:
            'Polinomios, clasificación y operatoria. Productos y cocientes notables. Diagrama de Venn-Euler y conectivos lógicos. Propiedades de raíces y factores de un polinomio.',
        },
        {
          block: 'Álgebra',
          description:
            'Concepto de factorización. Teorema de los ceros racionales. Regla de los signos de Descartes. Regla de Ruffini.',
        },
        {
          block: 'Ecuaciones',
          description:
            'Ecuaciones e inecuaciones lineales con coeficientes racionales e irracionales. Sistema de ecuaciones lineales con dos incógnitas.',
        },
        {
          block: 'Funciones',
          description: 'Concepto, dominio y rango de función algebraica, exponencial y logarítmica. Valor absoluto.',
        },
      ],
      procedures: [
        'Identificación de diferentes tipos de expresiones algebraicas y sus características.',
        'Traducción de expresiones algebraicas del lenguaje cotidiano al lenguaje algebraico y viceversa haciendo uso de conectivos lógicos.',
        'Identificación del grado de un polinomio. Cálculo del valor numérico de polinomios.',
        'Clasificación de polinomios según el número de términos y su grado.',
        'Operaciones con polinomios: adición, sustracción, multiplicación y división (tradicional y sintética).',
        'Obtención de productos notables: cuadrado de un binomio, cubo de un binomio, producto de la suma por la diferencia.',
        'Casos de factorización: factor común, agrupación, diferencia de cuadrados, trinomio cuadrado perfecto, trinomios x² + bx + c y ax² + bx + c, suma y diferencia de cubos.',
        'Factorización de polinomios de grado mayor que dos: teorema de los ceros racionales, regla de los signos de Descartes y teorema de Ruffini.',
        'Análisis de las raíces o ceros de un polinomio.',
        'Resolución de problemas que impliquen ecuaciones e inecuaciones lineales con coeficientes racionales e irracionales.',
        'Resolución de situaciones que impliquen sistemas de ecuaciones lineales en dos variables por diversos métodos.',
        'Conceptualización de una función algebraica. Análisis y cálculo de dominio y rango.',
        'Análisis y cálculo del valor absoluto de números reales.',
      ],
      attitudes: [
        'Interés en la resolución de polinomios aplicando casos combinados de factorización.',
        'Disfrute al modelar y realizar operaciones con expresiones algebraicas a partir de situaciones problemáticas dadas.',
        'Interés en la resolución de ecuaciones e inecuaciones lineales y sistemas de ecuaciones.',
        'Aprecio por el empleo de las funciones para interpretar y resolver problemas del contexto.',
      ],
    },
    indicators: [
      'Lee informaciones básicas asociadas al álgebra de polinomios y teoría conjuntista.',
      'Interpreta datos y gráficos en reportes de investigación y otros medios a partir de los conocimientos de las ecuaciones e inecuaciones lineales con coeficientes racionales.',
      'Comunica informaciones relacionadas a proyectos en las que se apliquen los conocimientos de sistemas de ecuaciones lineales y función polinómica.',
      'Aplica lógicamente sus conocimientos asociados al álgebra de polinomios y teoría conjuntista.',
      'Representa lógicamente informaciones del contexto a partir de los conceptos de ecuaciones e inecuaciones lineales con coeficientes racionales.',
      'Toma decisiones adecuadas y de manera lógica a partir de situaciones del entorno en las que se apliquen los conocimientos sobre sistemas de ecuaciones lineales y función polinómica.',
      'Resuelve problemas asociados al álgebra de polinomios y teoría conjuntista.',
      'Resuelve a partir de métodos conocidos problemas del contexto en los que se pone en práctica conocimientos de las ecuaciones e inecuaciones lineales con coeficientes racionales.',
      'Emplea diferentes métodos para resolver situaciones problemáticas de sistemas de ecuaciones lineales y función polinómica.',
      'Asume una actitud ética al interpretar situaciones referidas a álgebra de polinomios y teoría conjuntista.',
      'Emplea de manera responsable los conocimientos sobre ecuaciones e inecuaciones lineales con coeficientes racionales.',
      'Aplica con sentido ético modelos asociados a los sistemas de ecuaciones lineales y función polinómica.',
      'Identifica de manera adecuada herramientas tecnológicas para interpretar soluciones de situaciones diversas asociadas al álgebra de polinomios y teoría conjuntista.',
      'Usa aplicaciones tecnológicas convenientes para presentar los resultados de un proyecto de investigación en el que se integren los conocimientos de ecuaciones e inecuaciones lineales.',
      'Modela a partir del uso de herramientas científicas y tecnológicas situaciones referidas a sistemas de ecuaciones lineales y función polinómica.',
      'Elabora reportes de investigación en los que se apliquen los conocimientos de álgebra de polinomios y teoría conjuntista.',
      'Identifica por medio de los conocimientos sobre ecuaciones e inecuaciones lineales soluciones ante situaciones de salud que se presentan en la comunidad.',
      'Elabora proyectos comunitarios para dar soluciones particulares a situaciones del medio ambiente aplicando los conocimientos de sistemas de ecuaciones lineales y función polinómica.',
      'Resuelve respetando diferentes criterios de resolución procesos matemáticos asociados a polinomios y teoría conjuntista.',
      'Manifiesta en una puesta en común y manteniendo respeto para la convivencia pacífica los resultados de informes y estudios de casos empleando ecuaciones e inecuaciones lineales.',
      'Mantiene actitud de respeto personal y espiritual al momento de compartir diferentes criterios de interpretación de problemas relacionados con los sistemas de ecuaciones lineales y función polinómica.',
    ],
  },
  // ───────────────────────────── 4to ─────────────────────────────
  {
    code: 'SEC-4',
    name: '4to de Secundaria',
    cycle: 2,
    order: 4,
    focus: 'Pensamiento geométrico: ángulos, polígonos, triángulos, circunferencia y transformaciones.',
    specificCompetences: {
      COMUNICATIVA:
        'Interpreta a partir de sus conocimientos y haciendo uso del pensamiento geométrico situaciones del contexto.',
      PENSAMIENTO_LOGICO: 'Explica lógicamente situaciones de la comunidad sobre conocimientos básicos de la geometría.',
      RESOLUCION_PROBLEMAS:
        'Discrimina diferentes vías para resolver problemas de geometría a partir del análisis de situaciones de la vida diaria.',
      ETICA_CIUDADANA:
        'Muestra autonomía y apertura en la interpretación de situaciones y problemas de geometría respetando diferentes criterios de resolución.',
      CIENTIFICA_TECNOLOGICA:
        'Aplica herramientas tecnológicas en la resolución de problemas de geometría a fin de tomar decisiones en situaciones del contexto comunitario.',
      AMBIENTAL_SALUD:
        'Emplea el pensamiento geométrico conectando con otras áreas como forma de contribuir de manera responsable a la preservación de la salud y el medio ambiente.',
      DESARROLLO_PERSONAL:
        'Aporta soluciones en la interpretación de situaciones y problemas de geometría respetando diferentes criterios de resolución.',
    },
    contents: {
      concepts: [
        {
          block: 'Geometría',
          description:
            'Ángulos, sistemas de medidas, postulados, congruencia, paralelismo y perpendicularidad.',
        },
        {
          block: 'Geometría',
          description:
            'Polígonos, diagonales, ángulos internos y externos, perímetro. Triángulos: propiedades, congruencia, ángulos interiores y exteriores, relación entre lados y ángulos, postulados LLL, LAL y ALA.',
        },
        {
          block: 'Geometría',
          description:
            'Circunferencia: propiedades, elementos y tipos. Área y volumen de poliedros y de cuerpos truncados. Transformaciones geométricas.',
        },
      ],
      procedures: [
        'Construcción y medición de ángulos con transportadores, escuadras y compás físicos y virtuales.',
        'Construcción e interpretación de rectas paralelas, perpendiculares y transversales.',
        'Aplicación de postulados de las rectas en situaciones del contexto.',
        'Resolución de problemas que impliquen rectas y ángulos.',
        'Construcción y cálculo de los elementos y diagonales de los polígonos regulares.',
        'Cálculo de ángulos y perímetro de polígonos.',
        'Aplicación del teorema fundamental de los triángulos para ángulos interiores y exteriores.',
        'Aplicación de postulados (LLL, LAL y ALA) y de los teoremas de Thales, Menelao y Ceva.',
        'Resolución de problemas sobre la circunferencia y aplicación en situaciones de la vida cotidiana.',
        'Identificación y clasificación de las transformaciones geométricas en situaciones de la vida diaria.',
        'Cálculo de área y volumen de poliedros y cuerpos truncados.',
        'Resolución de problemas del contexto que se modelen a partir de las transformaciones geométricas.',
      ],
      attitudes: [
        'Curiosidad al aplicar los conceptos y principios de los ángulos en situaciones diversas.',
        'Perseverancia en la resolución de problemas sobre perímetro y polígonos.',
        'Disfrute al hacer indagaciones y descubrimientos sobre congruencia.',
        'Entusiasmo al emplear las aplicaciones de la circunferencia en la vida diaria.',
        'Interés en la identificación de los tipos de transformaciones geométricas en situaciones del contexto.',
        'Autonomía en el cálculo de áreas y volúmenes de poliedros y cuerpos truncados.',
      ],
    },
    indicators: [
      'Lee informaciones básicas asociadas a los ángulos y sus postulados.',
      'Interpreta datos y gráficos en reportes de investigación a partir de los postulados de congruencia de polígonos, triángulos y análisis de la circunferencia.',
      'Comunica informaciones relacionadas a proyectos en las que se apliquen los conocimientos de transformaciones geométricas, área y volumen de cuerpos truncados.',
      'Aplica lógicamente sus conocimientos asociados a los ángulos y sus postulados.',
      'Representa lógicamente informaciones del contexto a partir de los postulados de congruencia de polígonos, triángulos y análisis de la circunferencia.',
      'Toma decisiones adecuadas a partir de situaciones del entorno en las que se apliquen los conocimientos sobre transformaciones geométricas, área y volumen de cuerpos truncados.',
      'Resuelve problemas asociados a los ángulos y sus postulados.',
      'Resuelve a partir de métodos conocidos problemas del contexto sobre congruencia de polígonos, triángulos y análisis de la circunferencia.',
      'Emplea diferentes métodos para resolver situaciones problemáticas sobre transformaciones geométricas, área y volumen de cuerpos truncados.',
      'Asume una actitud ética al interpretar situaciones referidas a ángulos y sus postulados.',
      'Identifica de manera adecuada herramientas tecnológicas para interpretar soluciones de situaciones asociadas a ángulos y sus postulados.',
      'Usa aplicaciones tecnológicas convenientes para presentar los resultados de un proyecto de investigación sobre congruencia de polígonos, triángulos y circunferencia.',
      'Modela a partir del uso de herramientas científicas y tecnológicas situaciones referidas a transformaciones geométricas, área y volumen de cuerpos truncados.',
      'Elabora reportes de investigación en los que se apliquen los conocimientos de ángulos y sus postulados.',
      'Elabora proyectos comunitarios para dar soluciones a situaciones del medio ambiente aplicando transformaciones geométricas, área y volumen.',
      'Resuelve respetando diferentes criterios de resolución procesos matemáticos asociados a ángulos y sus postulados.',
      'Mantiene actitud de respeto personal y espiritual al compartir diferentes criterios de interpretación de problemas relacionados con transformaciones geométricas, área y volumen.',
    ],
  },
  // ───────────────────────────── 5to ─────────────────────────────
  {
    code: 'SEC-5',
    name: '5to de Secundaria',
    cycle: 2,
    order: 5,
    focus: 'Pensamiento algebraico y trigonométrico: cónicas, vectores, matrices y trigonometría.',
    specificCompetences: {
      COMUNICATIVA: 'Justifica sus ideas haciendo uso del pensamiento algebraico y trigonométrico.',
      PENSAMIENTO_LOGICO:
        'Razona y argumenta lógicamente sobre procesos implicados en situaciones relativas al álgebra y la trigonometría.',
      RESOLUCION_PROBLEMAS:
        'Emplea diferentes técnicas de resolución de problemas de la trigonometría auxiliado de los conocimientos algebraicos.',
      ETICA_CIUDADANA:
        'Justifica respetando el criterio de las demás personas soluciones frente a situaciones y problemas de álgebra y trigonometría.',
      CIENTIFICA_TECNOLOGICA:
        'Discrimina la pertinencia del uso de diferentes herramientas tecnológicas para la resolución de problemas algebraicos y trigonométricos a fin de tomar decisiones en situaciones del contexto comunitario.',
      AMBIENTAL_SALUD:
        'Aporta solución a partir del pensamiento algebraico y trigonométrico conectando con otras áreas como forma de contribuir a la preservación de la salud y el medio ambiente.',
      DESARROLLO_PERSONAL:
        'Evalúa con autonomía diferentes situaciones y problemas de álgebra y trigonometría respetando diferentes criterios de resolución.',
    },
    contents: {
      concepts: [
        {
          block: 'Cónicas',
          description: 'Ecuaciones de las cónicas: recta, circunferencia, parábola, elipse, hipérbola y sus elementos.',
        },
        {
          block: 'Vectores y matrices',
          description:
            'Diferencia entre un vector y una matriz, características y tipos de matrices, operaciones entre matrices. Determinantes. Matriz inversa.',
        },
        {
          block: 'Trigonometría',
          description:
            'Origen y desarrollo. Funciones trigonométricas. Ley de los senos y cosenos, resolución de triángulos rectángulos y oblicuángulos. Identidades trigonométricas pitagóricas.',
        },
      ],
      procedures: [
        'Análisis e interpretación de la ecuación de la recta.',
        'Resolución de problemas del contexto que impliquen las cónicas y sus elementos.',
        'Clasificación, notación y representación de vectores. Operaciones con vectores.',
        'Identificación de los tipos de matrices. Operaciones con matrices.',
        'Resolución de problemas del contexto que impliquen vectores y matrices.',
        'Aplicación de la ley del seno y ley del coseno a situaciones de la vida diaria.',
        'Resolución de triángulos rectángulos y oblicuángulos.',
        'Demostración de las funciones trigonométricas de ángulos notables y especiales.',
        'Representación gráfica de sinusoides, cosinusoides y tangentoides.',
        'Resolución de problemas que impliquen funciones trigonométricas.',
        'Comprobación de identidades trigonométricas pitagóricas.',
      ],
      attitudes: [
        'Disfrute y curiosidad en la resolución de problemas que impliquen la ecuación de la recta y análisis de las cónicas.',
        'Disfrute del trabajo en equipo con vectores y matrices.',
        'Valoración del conocimiento histórico de la trigonometría.',
        'Entusiasmo al aplicar las funciones trigonométricas en la resolución de problemas de la cotidianidad.',
        'Actitud crítica en la aplicación de sus conocimientos sobre la ley de senos y cosenos.',
      ],
    },
    indicators: [
      'Lee informaciones básicas asociadas a los conocimientos referidos a la recta y cónicas.',
      'Interpreta datos y gráficos en reportes de investigación a partir de los conocimientos de vectores y matrices.',
      'Comunica informaciones relacionadas a proyectos en las que se apliquen los conocimientos de trigonometría y función de costo.',
      'Aplica lógicamente sus conocimientos asociados a la recta y cónicas.',
      'Representa lógicamente informaciones del contexto a partir de los conocimientos de vectores y matrices.',
      'Toma decisiones adecuadas a partir de situaciones del entorno en las que se apliquen los conocimientos sobre trigonometría y función de costo.',
      'Resuelve problemas asociados a la recta y cónicas.',
      'Resuelve a partir de métodos conocidos problemas del contexto en los que se ponen en práctica los conocimientos de vectores y matrices.',
      'Emplea diferentes métodos para resolver situaciones problemáticas sobre trigonometría y función de costo.',
      'Asume una actitud ética al interpretar situaciones referidas a la recta y cónicas.',
      'Identifica de manera adecuada herramientas tecnológicas para interpretar soluciones de situaciones asociadas a la recta y cónicas.',
      'Usa aplicaciones tecnológicas convenientes para presentar los resultados de un proyecto sobre vectores y matrices.',
      'Modela a partir del uso de herramientas científicas y tecnológicas situaciones referidas a trigonometría y función de costo.',
      'Elabora reportes de investigación en los que se apliquen los conocimientos de la recta y cónicas.',
      'Elabora proyectos comunitarios para dar soluciones a situaciones del medio ambiente aplicando trigonometría y función de costo.',
      'Resuelve respetando diferentes criterios de resolución procesos matemáticos asociados a la recta y cónicas.',
      'Manifiesta en una puesta en común y con respeto los resultados de informes y estudios de casos empleando vectores y matrices.',
    ],
  },
  // ───────────────────────────── 6to ─────────────────────────────
  {
    code: 'SEC-6',
    name: '6to de Secundaria',
    cycle: 2,
    order: 6,
    focus: 'Cálculo y sus aplicaciones: teoría de ecuaciones, sucesiones y finanzas, complejos, límites, derivadas e integrales.',
    specificCompetences: {
      COMUNICATIVA: 'Comunica sus ideas haciendo uso del cálculo y sus aplicaciones.',
      PENSAMIENTO_LOGICO: 'Justifica con sentido lógico sobre procesos implicados en situaciones relativas al cálculo.',
      RESOLUCION_PROBLEMAS:
        'Resuelve problemas relativos a situaciones de la vida diaria a partir de los conocimientos obtenidos del cálculo.',
      ETICA_CIUDADANA:
        'Interpreta con rigurosidad situaciones y problemas del cálculo respetando diferentes criterios y puntos de vista.',
      CIENTIFICA_TECNOLOGICA:
        'Evalúa la aplicación de herramientas tecnológicas en la resolución de problemas del cálculo diferencial e integral.',
      AMBIENTAL_SALUD:
        'Evalúa la pertinencia en la aplicación de los conocimientos obtenidos del cálculo conectando con otras áreas para contribuir a la preservación del medio ambiente.',
      DESARROLLO_PERSONAL:
        'Aplica sus conocimientos en la interpretación de situaciones y problemas del cálculo respetando diferentes criterios y puntos de vista.',
    },
    contents: {
      concepts: [
        {
          block: 'Teoría de ecuaciones',
          description:
            'Teorema fundamental del álgebra. Ecuaciones exponenciales y logarítmicas. Inecuaciones cuadráticas. Sistemas de ecuaciones e inecuaciones cuadráticas en dos variables.',
        },
        {
          block: 'Sucesiones y finanzas',
          description:
            'Sucesiones aritméticas y geométricas, progresiones. Valor actual a interés simple y compuesto. Tarjeta de crédito: saldo absoluto y saldo insoluto.',
        },
        {
          block: 'Números complejos',
          description: 'Números complejos en forma de par ordenado, binómica, polar y trigonométrica.',
        },
        {
          block: 'Trigonometría',
          description: 'Fórmulas de suma y diferencia de ángulos. Ángulo doble, triple y mitad. Ecuaciones trigonométricas.',
        },
        {
          block: 'Cálculo',
          description:
            'Límite de funciones y sucesiones y sus propiedades. Derivada de funciones y reglas de derivación. Integrales definidas e indefinidas sencillas.',
        },
      ],
      procedures: [
        'Análisis de las raíces de una ecuación a partir del teorema fundamental del álgebra.',
        'Resolución de inecuaciones cuadráticas aplicando métodos analíticos y gráficos.',
        'Resolución de sistemas de ecuaciones e inecuaciones cuadráticas en dos variables.',
        'Uso de las ecuaciones exponenciales y logarítmicas en la resolución de problemas con y sin herramientas tecnológicas.',
        'Resolución de problemas referidos a préstamos bancarios aplicando sucesiones aritméticas y geométricas.',
        'Resolución de problemas que impliquen cálculo de interés simple y compuesto y del valor actual.',
        'Análisis del uso de tarjetas de crédito en función de intereses generados, descuentos y plazos de pago.',
        'Identificación y representación gráfica de números complejos en forma binómica, polar y trigonométrica.',
        'Demostración de las fórmulas de suma y diferencia de ángulos, ángulo doble, triple y mitad.',
        'Resolución de ecuaciones trigonométricas lineales y cuadráticas.',
        'Cálculo de diferentes tipos de límites y análisis de sus propiedades.',
        'Cálculo de derivadas usando el concepto de límite y las reglas de derivación.',
        'Cálculo de integrales definidas e indefinidas usando las reglas de integración.',
        'Resolución de problemas del contexto que involucren límites, derivadas e integrales.',
      ],
      attitudes: [
        'Entusiasmo al aplicar los sistemas de ecuaciones cuadráticas en la resolución de problemas.',
        'Interés en la aplicación de la tecnología al resolver problemas que involucran inecuaciones cuadráticas.',
        'Interés en la aplicación de sucesiones aritméticas y geométricas en situaciones de la vida diaria.',
        'Satisfacción al resolver situaciones que involucren números complejos.',
        'Valoración por el conocimiento de las identidades trigonométricas.',
        'Satisfacción al resolver problemas del contexto que impliquen derivadas.',
      ],
    },
    indicators: [
      'Lee informaciones básicas asociadas a la teoría de ecuaciones y sistemas de ecuaciones e inecuaciones cuadráticas.',
      'Interpreta datos y gráficos en reportes de investigación a partir de los conocimientos de sucesiones y números complejos.',
      'Comunica informaciones relacionadas a proyectos en las que se apliquen los conocimientos de límite, derivada e integrales de funciones.',
      'Aplica lógicamente sus conocimientos asociados a teoría de ecuaciones y sistemas de ecuaciones e inecuaciones cuadráticas.',
      'Representa lógicamente informaciones del contexto a partir de los conocimientos de sucesiones y números complejos.',
      'Toma decisiones adecuadas a partir de situaciones del entorno en las que se apliquen los conocimientos sobre límite, derivada e integrales.',
      'Resuelve problemas asociados a la teoría de ecuaciones y sistemas de ecuaciones e inecuaciones cuadráticas.',
      'Resuelve a partir de métodos conocidos problemas del contexto que ponen en práctica los conocimientos de sucesiones y números complejos.',
      'Emplea diferentes métodos para resolver situaciones problemáticas sobre límite, derivada e integrales de funciones.',
      'Asume una actitud ética al interpretar situaciones referidas a teoría de ecuaciones y sistemas de ecuaciones e inecuaciones cuadráticas.',
      'Identifica de manera adecuada herramientas tecnológicas para interpretar soluciones asociadas a teoría de ecuaciones.',
      'Usa aplicaciones tecnológicas convenientes para presentar los resultados de un proyecto sobre sucesiones y números complejos.',
      'Modela a partir del uso de herramientas científicas y tecnológicas situaciones referidas a límite, derivada e integrales de funciones.',
      'Elabora reportes de investigación en los que se apliquen los conocimientos de teoría de ecuaciones.',
      'Elabora proyectos comunitarios para dar soluciones a situaciones del medio ambiente aplicando límite, derivada e integrales.',
      'Resuelve respetando diferentes criterios de resolución procesos matemáticos asociados a teoría de ecuaciones.',
      'Mantiene actitud de respeto personal y espiritual al compartir criterios de interpretación de problemas relacionados con límite, derivada e integrales.',
    ],
  },
];

/** Días feriados nacionales de República Dominicana (mes-día). */
export const DR_HOLIDAYS: Array<{ monthDay: string; name: string }> = [
  { monthDay: '01-01', name: 'Año Nuevo' },
  { monthDay: '01-06', name: 'Día de los Santos Reyes' },
  { monthDay: '01-21', name: 'Día de la Altagracia' },
  { monthDay: '01-26', name: 'Día de Duarte' },
  { monthDay: '02-27', name: 'Día de la Independencia Nacional' },
  { monthDay: '05-01', name: 'Día del Trabajo' },
  { monthDay: '08-16', name: 'Día de la Restauración' },
  { monthDay: '09-24', name: 'Día de las Mercedes' },
  { monthDay: '11-06', name: 'Día de la Constitución' },
  { monthDay: '12-25', name: 'Navidad' },
];
