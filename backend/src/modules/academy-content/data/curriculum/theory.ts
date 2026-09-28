// ──────────────────────────────────────────────
// Datos semilla — Nivel 4 — Teoría avanzada.
// GTO, MDF, overbets, polarización, capped/uncapped,
// nut/range advantage, mixed strategies y
// check-raise avanzado.
// Los carga `prisma/seeders/academy-curriculum.seeder.ts`.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';

export const THEORY_LEVEL: LevelSeed = {
  id: 'theory',
  title: 'Teoría avanzada',
  subtitle: 'Polarización y equilibrio',
  description:
    'GTO, MDF, overbets, rangos capados y estrategias mixtas. La teoría que sostiene tus exploits sin dejarte explotable.',
  color: '#8b5cf6',
  icon: 'Scale',
  courses: [
    {
      id: 'c-gto',
      slug: 'fundamentos-gto',
      title: 'Fundamentos de teoría de juego',
      summary: 'Qué significa realmente jugar equilibrado y cuándo vale la pena.',
      level: 'theory',
      icon: 'Scale',
      outcomes: [
        'Entender el equilibrio y sus frecuencias',
        'Aplicar la defensa mínima (MDF) con pot odds, equity y blockers',
        'Saber cuándo alejarse del equilibrio a propósito',
      ],
      lessons: [
        {
          id: 'l-gto-balance',
          slug: 'equilibrio-y-frecuencias',
          title: 'Equilibrio y frecuencias',
          summary: 'Una estrategia equilibrada no se puede explotar, aunque el rival la conozca.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Jugar en equilibrio significa mezclar valor y faroles en proporciones tales que al rival le da igual pagar o retirarse: ninguna de las dos decisiones le hace ganar dinero contra ti. No es la estrategia que más gana; es la que menos puede perder.',
            },
            {
              type: 'table',
              headers: ['Tamaño de apuesta', 'Faroles por cada mano de valor', 'Proporción'],
              rows: [
                ['½ bote', '0,33', '3 valor : 1 farol'],
                ['¾ bote', '0,43', '7 valor : 3 faroles'],
                ['Bote', '0,50', '2 valor : 1 farol'],
                ['2× bote', '0,67', '3 valor : 2 faroles'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La lectura correcta',
              text: 'Cuanto más grande apuestas, más faroles puedes permitirte, porque le estás ofreciendo peores odds al rival. Esa es la razón matemática por la que los rangos polarizados usan tamaños grandes.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El equilibrio no es el objetivo',
              text: 'Contra rivales que cometen errores sistemáticos, jugar equilibrado deja dinero sobre la mesa. El equilibrio es tu punto de partida y tu refugio, no tu meta.',
            },
            {
              type: 'spot',
              hole: 'Qs Qd',
              board: 'Qh 7s 2c 4s 9h',
              question: 'River en bote 100. Tienes trío de damas y apuestas 75 (¾ de bote). ¿Cuántos faroles con blocker necesitas en tu rango para ser inexplotable?',
              answer:
                'Con ¾ de bote tu apuesta necesita funcionar el 43% como farol. En equilibrio llevas ~7 manos de valor por cada 3 faroles. Aquí el trío es valor claro; tus faroles deben ser proyectos fallidos que bloqueen sus pagos (por ejemplo, el as del color fallido), no manos medias con showdown.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 25 manos mezclando valor y faroles con blocker según tu tamaño de apuesta',
              hands: 25,
            },
          ],
        },
        {
          id: 'l-gto-mdf',
          slug: 'defensa-minima',
          title: 'Defensa mínima (MDF)',
          summary: 'Cuánto de tu rango tienes que defender para que el farol del rival no sea gratis.',
          kind: 'lesson',
          minutes: 13,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Si te retiras demasiado a menudo, cualquier rival puede apostar con todas sus manos y ganar sin enseñar cartas. La MDF es el porcentaje mínimo de tu rango que debes seguir jugando para impedirlo.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La fórmula',
              text: 'MDF = bote ÷ (bote + apuesta). Frente a una apuesta del tamaño del bote, debes defender el 50% de tu rango. Frente a media apuesta, el 67%.',
            },
            {
              type: 'table',
              headers: ['Apuesta del rival', 'MDF', 'Te puedes retirar con'],
              rows: [
                ['⅓ del bote', '75%', '25% de tu rango'],
                ['½ del bote', '67%', '33%'],
                ['¾ del bote', '57%', '43%'],
                ['Bote completo', '50%', '50%'],
              ],
            },
            {
              type: 'heading',
              text: 'MDF no es una regla automática',
            },
            {
              type: 'paragraph',
              text: 'La MDF es herramienta teórica, no orden. La defensa real combina: pot odds que te dan, tu equity real contra su rango, ventaja de rango y de nuts, blockers y distribución de combos. Un rival que nunca farolea river te permite retirarte muy por debajo de MDF sin ser explotado.',
            },
            {
              type: 'table',
              headers: ['Herramienta', 'Pregunta que responde', 'Ejemplo'],
              rows: [
                ['Pot odds', '¿Qué equity mínima necesito para pagar?', 'Bote 100 + apuesta 50 → 25%'],
                ['MDF', '¿Cuánto debo defender para que su farol no sea gratis?', 'Vs 50% bote → 67%'],
                ['Equity real', '¿Cuánta tengo vs su rango de value+bluff?', 'AQ vs sets+draws fallidos: 31% real'],
                ['Range/nut advantage', '¿Quién llega con más nuts aquí?', 'Si él tiene ventaja, tu MDF baja'],
                ['Blockers + combos', '¿Cuántos combos de bluffs le quedan?', 'Si bloqueas sus nuts, tu call sube valor'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'La lectura profesional de MDF',
              text: 'No memorices "vs 75% defiendo X%". Usa MDF como espejo: si te retiras más que MDF durante 1000 manos, algún rival ya puede farolearte con cualquier carta y ganar. Si pagas más que MDF contra quien no farolea, financias su value.',
            },
            {
              type: 'spot',
              hole: 'Jh Tc',
              board: 'As Ad Kh Kc Qs 9h',
              question: 'River, bote 100, el rival apuesta 50 (½ bote). Tienes J-T: escalera con la mesa emparejada. MDF pide defender 67%. ¿Pagas?',
              answer:
                'No. MDF es el punto de partida, no la orden. Con la mesa emparejada tu escalera pierde contra cualquier full, y un rival que apuesta ½ bote en este river casi siempre lleva valor. Tu equity real está muy por debajo de las pot odds (25%) y no bloqueas sus nuts. Retírate aunque MDF "pida" defender.',
            },
            {
              type: 'drill',
              mode: 'bluff-catch',
              seats: 6,
              goal: 'Juega 25 rivers defendiendo por MDF ajustada: paga con blockers, retira tu rango medio vs quien no farolea',
              hands: 25,
            },
          ],
        },
        {
          id: 'l-gto-math',
          slug: 'ev-pot-odds-implied-y-rake',
          title: 'EV, pot odds, implied y rake',
          summary: 'Pot odds vs equity vs implied vs reverse implied: el cálculo completo y cómo el rake rompe empates.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Las pot odds miran el bote actual. Las implied añaden lo que cobrarás si ligas. Las reverse implied lo que perderás si ligas segunda mejor. El EV suma las tres, y el rake (comisión) desplaza el umbral de rentabilidad.',
            },
            {
              type: 'table',
              headers: ['Concepto', 'Fórmula', 'Cuándo manda'],
              rows: [
                ['Pot odds', 'Lo que pagas / bote final si pagas', 'Decisión inmediata: ¿tengo precio?'],
                ['Equity', 'Outs ×2 por carta; ×4 solo si ves dos cartas sin más apuestas', 'Probabilidad de mejorar'],
                ['Implied odds', 'Pot odds + fichas futuras que cobrarás', 'Proyectos disimulados (escalera) vs rival que paga'],
                ['Reverse implied', 'Lo que pierdes cuando ligas y aún vas detrás', 'Draw al color bajo vs posible color superior'],
                ['Break-even %', 'Riesgo / (riesgo+recompensa)', 'Farol: ¿cuánto debe retirarse para ser rentable?'],
                ['Fold equity', 'Prob. rival se retire × bote', 'Semibluff: tu apuesta gana también sin ligar'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El rake importa',
              text: 'Una mano marginalmente rentable sin rake (ej. call con 26% equity necesitando 25%) pasa a ser fold con rake 5% cap 3. En micros y zoom, el rake convierte muchos calls de "precio justo" en perdedores. Ajusta tu defensa 2-3% más estricta en rake alto.',
            },
            {
              type: 'spot',
              hole: '7s 6h',
              board: '9c 8d 2s',
              question: 'Tienes escalera abierta (8 outs) y te apuestan 50 en bote 100 (necesitas 25%). ¿Pagas?',
              answer:
                'Cuidado con el 32% de la regla del 4: es hasta el river y solo lo cobras si no hay más apuestas. Pagando esta apuesta ves una carta: 8/47 ≈ 17%, por debajo del 25%. El call depende de las odds implícitas. En posición y contra un rival que paga cuando ligas, es call. Fuera de posición, con rake alto y con el extremo bajo del proyecto (si sale el 10, Q-J y J-7 tienen una escalera mayor: odds implícitas inversas), se vuelve marginal o fold.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Necesitas 25% para pagar y estimas que realizarás un 26% de equity. Juegas micros con rake alto y fuera de posición. ¿Qué haces?',
                  options: ['Pagas: 26% es más que 25%', 'Foldeas: el rake y la posición se comen ese margen', 'Vas all-in', 'Da igual'],
                  answerIndex: 1,
                  explanation:
                    'Con un margen del 1%, el rake (el bote que cobras es menor) y la peor realización fuera de posición convierten el call en perdedor. Pide 2-3% extra de margen en rake alto. Ojo: esto es para calls marginales; un proyecto fuerte como el color al as tiene mucho más margen y sigue siendo call.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-gto-mixed',
          slug: 'estrategias-mixtas',
          title: 'Estrategias mixtas (mixed strategies)',
          summary: 'Por qué la misma mano a veces apuesta y a veces pasa: frecuencia, EV y protección.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'En equilibrio, manos como top pair medio o proyecto de color no siempre hacen lo mismo: a veces apuestan pequeño, a veces pasan. Mezclar protege ambos rangos y deja indiferente al rival. Sin mezcla, tu apuesta cuenta tu mano.',
            },
            {
              type: 'table',
              headers: ['Mano en flop A-7-2', 'Frecuencia GTO', 'Por qué mixta', 'Error si siempre haces una'],
              rows: [
                ['AK (top pair top kicker)', '70% bet 33%, 30% check', 'Proteges tu rango de check con valor', 'Si siempre bet, tu check es siempre débil'],
                ['A-J (kicker medio)', '40% bet, 60% check', 'Control de bote y protección', 'Si siempre check, pierdes valor fino'],
                ['8-9s (backdoor)', '30% bet, 70% check', 'Semibluff selectivo con equity', 'Si siempre bet, tu bet es siempre aire'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'EV igualado',
              text: 'Cuando una mano se juega mixta en solver, ambas líneas tienen el mismo EV. No busques "la mejor": alterna. Usa segundo reloj o randomizador mental (ej. mirar segundo segundero) para no ser predecible.',
            },
            {
              type: 'spot',
              hole: 'Ac Jd',
              board: 'Ah 7s 2c',
              question: 'Flop A-7-2 arcoíris como agresor preflop con A-J. El solver hace bet 33% el 40% y check el 60%. ¿Qué haces en la mesa?',
              answer:
                'Cualquiera de las dos es correcta: tienen el mismo EV. Si tu rango de check suele quedar débil, apuesta este A-J para protegerlo; si ya pasaste varias manos fuertes, apuesta para no perder valor fino. Lo importante es no hacer siempre lo mismo.',
            },
            {
              type: 'drill',
              mode: 'cbet',
              seats: 6,
              goal: 'Juega 25 flops A-7-2 alternando c-bet pequeña y check con tus A-x medios',
              hands: 25,
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Tu solver dice que con ATo en K-7-2 debes hacer check 60% y bet 40%. ¿Qué significa?',
                  options: [
                    'Que check es mejor y el solver se equivoca 40%',
                    'Que ambas líneas rinden igual a largo plazo; mezclar te hace inexplotable',
                    'Que siempre debes apostar',
                    'Que debes retirarte',
                  ],
                  answerIndex: 1,
                  explanation:
                    'EV igualado: si siempre eliges una, tu frecuencia queda sesgada y el rival explota tu rango de check o de bet. Mezclar es parte del equilibrio.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'c-polarization',
      slug: 'polarizacion-y-estructura-avanzada',
      title: 'Polarización, capped y nut advantage',
      summary: 'Rangos polarizados vs lineales, capped/uncapped y quién llega con más nuts.',
      level: 'theory',
      icon: 'Layers',
      outcomes: [
        'Distinguir rango polarizado, lineal y condensado',
        'Reconocer rango capado y explotarlo',
        'Usar nut y range advantage para elegir tamaño',
      ],
      lessons: [
        {
          id: 'l-pol-structure',
          slug: 'estructura-de-rangos-avanzada',
          title: 'Polarizado, lineal y condensado',
          summary: 'De dónde viene cada estructura y qué tamaño pide.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un rango polarizado son nuts y aire sin nada medio: pide overbet. Uno lineal es "lo mejor hacia abajo continuo": pide apuesta pequeña-mediana. Uno condensado es sin nuts: solo puede pasar o apostar fino.',
            },
            {
              type: 'table',
              headers: ['Estructura', 'Composición', 'Tamaño típico', 'Ejemplo'],
              rows: [
                ['Polarizado', 'Sets/nuts + faroles con blocker', '66-150% bote', 'River: overbet con color nuts + farol A♠'],
                ['Lineal', 'Top pair → segunda pareja continuo', '33-50% bote', 'Flop A-7-2: bet pequeño con todo tu rango de A-x'],
                ['Condensado/capped', 'Sin nuts, techo limitado', 'Check o 25% fino', 'Tras pasar flop/turn: no tienes sets'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'No polarices sin nuts',
              text: 'Overbet sin ventaja de nuts es regalar fichas: el rival paga con manos fuertes y se retira con todo lo que querías que pagara pequeño. Tu estructura debe respaldar tu tamaño.',
            },
            {
              type: 'spot',
              hole: 'As 5s',
              board: 'Ks 7d 2c 4s 9h',
              question: 'River K-7-2-4-9 con tres picas. Tienes el as de picas sin pareja. Tu rango aún tiene colores máximos y el rival está capado. ¿Check o overbet de farol?',
              answer:
                'Overbet de farol (125% del bote). Tu mano es el farol perfecto: bloquea su mejor pago (el color al as) y no tiene showdown. Con ventaja de nuts y rival capado, polarizar grande es la línea de máximo EV.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 25 rivers: overbet polarizado con nuts y faroles con blocker, valor fino con lo lineal',
              hands: 25,
            },
          ],
        },
        {
          id: 'l-pol-nuts',
          slug: 'ventaja-de-nuts-y-rango',
          title: 'Ventaja de nuts y de rango',
          summary: 'Quién llega con más combinaciones imbatibles dicta quién puede apostar grande.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Ventaja de rango = quién tiene más manos que conectan. Ventaja de nuts = quién tiene más combos nuts. Cuando ambas coinciden, puedes apostar con casi todo tu rango. Cuando se separan, tu rango se divide y el grande solo es con polarizados.',
            },
            {
              type: 'table',
              headers: ['Board', 'Rango ventajoso', 'Nuts ventajoso', 'Línea correcta'],
              rows: [
                ['A♥K♦4♣', 'Agresor', 'Agresor', 'C-bet 33% con rango completo'],
                ['7♣6♦5♥', 'Defensor', 'Defensor', 'Check mucho OOP; si eres agresor, menos c-bet'],
                ['K♠K♦8♣', 'Agresor', 'Repartida', 'C-bet pequeña con casi todo el rango'],
                ['Q♥J♦T♠K♣', 'Agresor (más escaleras altas)', 'Agresor', 'Overbet polarizado'],
              ],
            },
            {
              type: 'spot',
              hole: 'As Kd',
              board: 'Ah 8c 3h',
              question: 'UTG abre, BB paga. Flop A-8-3. ¿Quién tiene ventaja y qué tamaño IP?',
              answer:
                'UTG tiene ambas ventajas: más A-x y más sets. IP c-bet de un tercio con todo tu rango (AQ, AK y bluffs con backdoor). OOP con A-8, check/call protege tu rango de check con valor.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Board 9♥8♥7♠, agresor vs defensor. ¿Quién tiene ventaja de nuts?',
                  options: ['Agresor', 'Defensor', 'Ninguno', 'Depende del turn'],
                  answerIndex: 1,
                  explanation:
                    'Board bajo y conectado favorece al defensor (tiene más 6-7, 5-6, sets). El agresor tiene más overpairs pero no nuts.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pol-capped',
          slug: 'rangos-capados',
          title: 'Rangos capados y uncapped',
          summary: 'Cómo reconocer un techo y castigarlo con overbets.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un rango capado no puede tener las mejores manos por su línea (ej. pagar preflop y pasar flop/turn: ya no tiene sets). Uno uncapped aún puede tener todo. Capado vs uncapped es la base del overbet.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Castigo del capado',
              text: 'Si tu rival está capado y tú no, overbet al 125-150% con tu rango polarizado. Su rango medio no puede pagar y su falta de nuts lo hace retirarse más que MDF.',
            },
            {
              type: 'spot',
              hole: 'Kd Qd',
              board: 'Ks 7d 2c 4s 9h',
              question: 'Rival pagó flop y turn pasivo, llega capado. Tienes KQ. ¿Overbet?',
              answer:
                'No. Tu mano es lineal (top pair) no polarizada. Overbet polariza; con KQ tu valor es fino (33-50%). Reserva overbet para cuando tu rango aún tiene sets/nuts.',
            },
            {
              type: 'drill',
              mode: 'bluff-catch',
              seats: 6,
              goal: 'Juega 25 manos castigando rangos capados con overbet y defendiendo tus propios caps con check',
              hands: 25,
            },
          ],
        },
      ],
    },
    {
      id: 'c-adv-river',
      slug: 'river-avanzado',
      title: 'River avanzado y líneas de valor',
      summary: 'Del thin value al overbet: elegir tamaño según ventaja y estructura.',
      level: 'theory',
      icon: 'Waves',
      outcomes: [
        'Elegir entre check, value fino y overbet según ventaja',
        'Defender vs overbet rival sin pagar de más',
      ],
      lessons: [
        {
          id: 'l-adv-river-sizing',
          slug: 'sizing-de-river-avanzado',
          title: 'Sizing de river según ventaja',
          summary: '33% lineal vs 150% polarizado: quién puede qué.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'River no hay cartas por venir: tu sizing cuenta tu historia. Pequeño = lineal (valor fino continuo). Grande/polar = nuts o aire. Elige según quién tiene la ventaja de nuts y si tu rango está capado.',
            },
            {
              type: 'table',
              headers: ['Tu rango y ventaja', 'Sizing', 'Composición'],
              rows: [
                ['Ventaja nuts clara + uncapped', '125-200% overbet', 'Nuts + faroles con blocker/unblocker'],
                ['Ventaja rango pero no nuts', '33-50% fino', 'Top pair, segunda pareja que aún paga peor'],
                ['Rango capado', 'Check', 'Tu mano media no puede polarizar'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Defensa vs overbet',
              text: 'Vs overbet, tu defensa baja (vs 150% → 40% MDF). Paga solo con nuts o con bluff-catcher que bloquea sus nuts y no bloquea sus faroles.',
            },
          ],
        },
        {
          id: 'l-adv-river-drill',
          slug: 'practica-river-avanzado',
          title: 'Práctica: river avanzado',
          summary: 'Elige sizing de river según ventaja, cap y blocker.',
          kind: 'drill',
          minutes: 20,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Cada river te da: tu mano, board, quién tiene ventaja de nuts y si tu rango está capado. Decide entre check atrás, value fino 33%, value grande 66% y overbet polarizado.',
            },
            {
              type: 'drill',
              mode: 'bluff-catch',
              seats: 6,
              goal: 'Juega 30 rivers eligiendo sizing y defensa vs overbet',
              hands: 30,
            },
          ],
        },
      ],
    },
  ],
};
