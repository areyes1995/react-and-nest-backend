// =============================================================================
// 🎓 DEMO SEEDER — Docente de ejemplo con datos realistas
// =============================================================================
//
// Crea "Prof. Carlos Méndez" (docente@educraft.app / Educraft2025!) con un año
// escolar activo, tres secciones (3° A, 2° B, 5° A) como en el diseño del
// panel, estudiantes, horario, asistencia, actividades calificadas, planes de
// clase del día, eventos, recursos, instrumentos y notificaciones.
//
// Solo se ejecuta con SEED_DEMO=true. ✅ IDEMPOTENTE: si el docente de demo ya
// existe, no hace nada.
//
// =============================================================================

import * as bcrypt from 'bcrypt';
import { AttendanceStatus, PrismaClient } from '@prisma/client';
import { DR_HOLIDAYS } from './data/curriculum-matematica';
import { weightedActivityScore } from '../../src/modules/educraft/shared/grading.calculator';

export const DEMO_EMAIL = 'docente@educraft.app';
export const DEMO_PASSWORD = 'Educraft2025!';

const FIRST = ['Ana', 'Luis', 'María', 'José', 'Camila', 'Pedro', 'Rosa', 'Miguel', 'Laura', 'Andrés', 'Yarelis', 'Juan', 'Paola', 'Carlos', 'Daniela', 'Kevin', 'Nicole', 'Ángel', 'Valeria', 'Samuel', 'Genesis', 'Ronny', 'Estefany', 'Luis Miguel', 'Arianny', 'Wilson', 'Nathaly', 'Jean Carlos'];
const LAST = ['Pérez', 'Rodríguez', 'García', 'Martínez', 'Santos', 'Reyes', 'Díaz', 'Jiménez', 'Núñez', 'Castillo', 'Mejía', 'Batista', 'Peña', 'Almonte', 'Rosario', 'Tavárez', 'Guzmán', 'Polanco', 'Cabrera', 'Encarnación'];

let seed = 20250515;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

const utcDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const dateOnly = (d: Date) => utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const weekday = (d: Date) => (d.getUTCDay() === 0 ? 7 : d.getUTCDay());

export async function seedDemo(prisma: PrismaClient): Promise<void> {
  console.log('🎓  Seed de datos de demostración…');
  const existing = await prisma.systemUser.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`  ℹ️  ${DEMO_EMAIL} ya existe. Omitido.\n`);
    return;
  }
  const role = await prisma.role.findUnique({ where: { name: 'DOCENTE' } });
  if (!role) throw new Error('Rol DOCENTE inexistente: ejecuta primero el seeder de roles.');

  const grades = new Map((await prisma.curriculumGrade.findMany()).map((g) => [g.code, g]));
  const fundamentals = await prisma.fundamentalCompetence.findMany({ orderBy: { order: 'asc' } });

  const teacher = await prisma.systemUser.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Méndez',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      emailVerified: true,
      mustChangePassword: false,
      roles: { create: { roleId: role.id } },
      teacherProfile: {
        create: {
          displayTitle: 'Prof.',
          specialty: 'Docente de Matemática',
          institution: 'Liceo Juan Pablo Duarte',
          district: '10-01',
        },
      },
    },
  });

  // ── Año escolar vigente (agosto → junio) ───────────────────────
  const today = dateOnly(new Date());
  const startYear = today.getUTCMonth() >= 7 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  const start = utcDate(startYear, 7, 18);
  const end = utcDate(startYear + 1, 5, 19);
  const bounds = [
    [start, utcDate(startYear, 9, 31)],
    [utcDate(startYear, 10, 3), utcDate(startYear + 1, 0, 23)],
    [utcDate(startYear + 1, 0, 26), utcDate(startYear + 1, 3, 3)],
    [utcDate(startYear + 1, 3, 6), end],
  ];
  const year = await prisma.schoolYear.create({
    data: {
      teacherId: teacher.id,
      name: `${startYear}-${startYear + 1}`,
      startDate: start,
      endDate: end,
      isActive: true,
      teachingWeeks: 40,
      periods: {
        create: bounds.map(([s, e], i) => ({ number: i + 1, name: `Periodo ${i + 1}`, startDate: s, endDate: e })),
      },
      holidays: {
        create: [startYear, startYear + 1].flatMap((y) =>
          DR_HOLIDAYS.map((h) => {
            const [m, d] = h.monthDay.split('-').map(Number);
            return { name: h.name, date: utcDate(y, m - 1, d), isNational: true };
          }).filter((h) => h.date >= start && h.date <= end),
        ),
      },
    },
    include: { periods: true, holidays: true },
  });
  const holidays = new Set(year.holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const currentPeriod =
    year.periods.find((p) => p.startDate <= today && p.endDate >= today)?.number ??
    (today > end ? 4 : 1);

  // ── Secciones como en el diseño ────────────────────────────────
  const sectionDefs = [
    { code: 'SEC-3', name: 'A', color: '#ec4899', start: '08:00', end: '09:30', topic: 'Función cuadrática', weak: 5 },
    { code: 'SEC-2', name: 'B', color: '#8b5cf6', start: '09:45', end: '11:15', topic: 'Sistemas de ecuaciones', weak: 2 },
    { code: 'SEC-5', name: 'A', color: '#3b82f6', start: '13:00', end: '14:30', topic: 'Probabilidad', weak: 1 },
  ];

  for (const def of sectionDefs) {
    const grade = grades.get(def.code)!;
    const section = await prisma.section.create({
      data: {
        teacherId: teacher.id,
        schoolYearId: year.id,
        gradeId: grade.id,
        name: def.name,
        color: def.color,
        room: `Aula ${between(101, 212)}`,
        schedules: {
          create: [1, 2, 3, 4, 5].map((wd) => ({
            weekday: wd,
            startTime: def.start,
            endTime: def.end,
            topic: def.topic,
          })),
        },
      },
    });

    const count = between(24, 30);
    const students: Array<{ id: number }> = [];
    for (let i = 0; i < count; i++) {
      const firstName = FIRST[(i * 7 + def.color.length) % FIRST.length];
      const lastName = `${LAST[(i * 3 + 1) % LAST.length]} ${LAST[(i * 5 + 4) % LAST.length]}`;
      students.push(
        await prisma.student.create({
          data: {
            sectionId: section.id,
            listNumber: i + 1,
            firstName,
            lastName,
            gender: i % 2 ? 'M' : 'F',
            guardianName: `${FIRST[(i + 5) % FIRST.length]} ${lastName.split(' ')[0]}`,
            guardianPhone: `809-${between(200, 999)}-${between(1000, 9999)}`,
          },
        }),
      );
    }
    // Perfil de cada estudiante: los primeros `weak` tienen bajo rendimiento.
    const ability = students.map((_, i) => (i < def.weak ? between(45, 64) : between(72, 97)));

    // Asistencia de los últimos 25 días lectivos.
    const days: Date[] = [];
    for (let d = addDays(today, -1); days.length < 25 && d > start; d = addDays(d, -1)) {
      if (weekday(d) <= 5 && !holidays.has(d.toISOString().slice(0, 10))) days.push(d);
    }
    const attendance: Array<{ studentId: number; sectionId: number; date: Date; status: AttendanceStatus }> = [];
    for (const day of days) {
      students.forEach((s, i) => {
        const r = rand();
        const lowAttendance = i === 1 || i === count - 1;
        const status: AttendanceStatus =
          r < (lowAttendance ? 0.28 : 0.04) ? 'ABSENT' : r < (lowAttendance ? 0.34 : 0.08) ? 'LATE' : r < 0.1 ? 'EXCUSED' : 'PRESENT';
        attendance.push({ studentId: s.id, sectionId: section.id, date: day, status });
      });
    }
    await prisma.attendance.createMany({ data: attendance });

    // Actividades calificadas por periodo y bloque (hasta el periodo actual).
    for (let period = 1; period <= currentPeriod; period++) {
      const p = year.periods.find((x) => x.number === period)!;
      for (let block = 1; block <= 4; block++) {
        const fundamental = fundamentals.find((f) => f.gradingBlock === block);
        for (let k = 0; k < 2; k++) {
          const date = addDays(p.startDate, 10 + block * 7 + k * 3);
          if (date > today) continue;
          const assessment = await prisma.assessment.create({
            data: {
              teacherId: teacher.id,
              sectionId: section.id,
              title: `${k === 0 ? 'Práctica' : 'Prueba'} ${block}.${period} — ${def.topic}`,
              type: k === 0 ? 'FORMATIVE' : 'SUMMATIVE',
              period,
              block,
              fundamentalId: fundamental?.id,
              date,
              maxScore: 100,
              weight: k === 0 ? 1 : 2,
            },
          });
          await prisma.assessmentScore.createMany({
            data: students.map((s, i) => ({
              assessmentId: assessment.id,
              studentId: s.id,
              score: Math.max(20, Math.min(100, ability[i] + between(-10, 8))),
              delivered: true,
              gradedAt: date,
            })),
          });
        }
      }
    }

    // Registro oficial calculado a partir de las actividades.
    const assessments = await prisma.assessment.findMany({
      where: { sectionId: section.id },
      include: { scores: true },
    });
    const register: Array<{ studentId: number; sectionId: number; period: number; block: number; score: number | null }> = [];
    for (let period = 1; period <= currentPeriod; period++) {
      for (let block = 1; block <= 4; block++) {
        const list = assessments.filter((a) => a.period === period && a.block === block);
        if (!list.length) continue;
        for (const s of students) {
          register.push({
            studentId: s.id,
            sectionId: section.id,
            period,
            block,
            score: weightedActivityScore(
              list.map((a) => ({
                score: a.scores.find((x) => x.studentId === s.id)?.score ?? null,
                maxScore: a.maxScore,
                weight: a.weight,
              })),
            ),
          });
        }
      }
    }
    await prisma.competenceGrade.createMany({ data: register });

    // Entrega pendiente (para las alertas) y otra de hoy.
    const due = await prisma.assessment.create({
      data: {
        teacherId: teacher.id,
        sectionId: section.id,
        title: `Tarea: ejercicios de ${def.topic.toLowerCase()}`,
        type: 'FORMATIVE',
        period: currentPeriod,
        block: 2,
        date: addDays(today, -6),
        dueDate: addDays(today, -2),
        requiresDelivery: true,
      },
    });
    await prisma.assessmentScore.createMany({
      data: students.slice(def.weak).map((s) => ({ assessmentId: due.id, studentId: s.id, delivered: true })),
    });
    await prisma.calendarEvent.create({
      data: {
        teacherId: teacher.id,
        sectionId: section.id,
        assessmentId: due.id,
        type: 'DELIVERY',
        title: `Entrega: ${due.title}`,
        startAt: due.dueDate!,
        allDay: true,
      },
    });

    // Plan de clase del día (plantilla oficial).
    await prisma.lessonPlan.create({
      data: {
        teacherId: teacher.id,
        gradeId: grade.id,
        sectionId: section.id,
        title: def.topic,
        topic: def.topic,
        date: today,
        durationMinutes: 90,
        purpose: `Que los estudiantes comprendan y apliquen ${def.topic.toLowerCase()} en situaciones de su entorno.`,
        strategies: ['Recuperación de saberes previos.', 'Descubrimiento guiado.', 'Trabajo colaborativo.', 'Uso de TIC.'],
        status: 'READY',
        moments: [
          {
            moment: 'INICIO',
            minutes: 15,
            activities: ['Leer y socializar la frase del día.', `Activación de saberes previos sobre ${def.topic.toLowerCase()}.`],
            metacognition: `¿Qué sabes sobre ${def.topic.toLowerCase()}?`,
            evidences: ['Participación oral.'],
            techniques: ['Observación directa.'],
            resources: ['Proyector'],
          },
          {
            moment: 'DESARROLLO',
            minutes: 55,
            activities: ['Presentación interactiva con ejemplos paso a paso.', 'Resolución de problemas en equipos.'],
            metacognition: '¿Qué estrategia usaste?',
            evidences: ['Ejercicios resueltos.'],
            techniques: ['Lista de cotejo.'],
            resources: ['Calculadora graficadora'],
          },
          {
            moment: 'CIERRE',
            minutes: 20,
            activities: ['Exit ticket.', 'Retroalimentación y asignación.'],
            metacognition: '¿Qué aprendiste hoy?',
            evidences: ['Reto final.'],
            techniques: ['Rueda de metacognición.'],
            resources: ['Tarjetas de salida'],
          },
        ],
      },
    });
  }

  // ── Agenda, biblioteca, instrumentos y notificaciones ──────────
  const at = (d: Date, hh: number, mm = 0) => new Date(d.getTime() + (hh + 4) * 3_600_000 + mm * 60_000); // hora RD → UTC
  await prisma.calendarEvent.createMany({
    data: [
      { teacherId: teacher.id, type: 'MEETING', title: 'Reunión de área', startAt: at(today, 11), endAt: at(today, 12), allDay: false },
      { teacherId: teacher.id, type: 'DELIVERY', title: 'Entrega de actividades', startAt: at(today, 15), endAt: at(today, 16), allDay: false },
      { teacherId: teacher.id, type: 'EXAM', title: 'Evaluación del periodo', startAt: addDays(today, 5), allDay: true },
      { teacherId: teacher.id, type: 'INSTITUTIONAL', title: 'Entrega de boletines', startAt: addDays(today, 12), allDay: true },
    ],
  });

  await prisma.libraryResource.createMany({
    data: [
      { teacherId: teacher.id, title: 'Función cuadrática — GeoGebra', category: 'CHART', tags: ['funciones', 'cuadrática'], url: 'https://www.geogebra.org/m/ptj2yzn7' },
      { teacherId: teacher.id, title: 'Sistemas de ecuaciones (video)', category: 'VIDEO', tags: ['sistemas', 'ecuaciones'], url: 'https://www.youtube.com/results?search_query=sistemas+de+ecuaciones' },
      { teacherId: teacher.id, title: 'Cuerpos geométricos para imprimir', category: 'GEOMETRY', tags: ['geometría', 'volumen'], url: 'https://www.geogebra.org/3d' },
      { teacherId: teacher.id, title: 'Adecuación Curricular — Matemática', category: 'PDF', tags: ['currículo', 'minerd'], url: 'https://www.minerd.gob.do' },
    ],
  });

  await prisma.evaluationInstrument.createMany({
    data: [
      {
        teacherId: teacher.id,
        type: 'RUBRIC',
        title: 'Rúbrica de polinomios',
        gradeId: grades.get('SEC-3')!.id,
        content: {
          levels: ['Excelente', 'Logrado', 'En proceso', 'Inicio'],
          scores: [4, 3, 2, 1],
          criteria: [
            { criterion: 'Operaciones con polinomios', weight: 40, descriptors: ['Opera sin errores y justifica.', 'Opera correctamente.', 'Comete errores de signo.', 'No logra operar.'] },
            { criterion: 'Factorización', weight: 35, descriptors: ['Elige el caso óptimo.', 'Factoriza correctamente.', 'Factoriza parcialmente.', 'No identifica el caso.'] },
            { criterion: 'Comunicación', weight: 25, descriptors: ['Explica con precisión.', 'Explica con claridad.', 'Explicación incompleta.', 'No explica.'] },
          ],
        },
      },
      {
        teacherId: teacher.id,
        type: 'CHECKLIST',
        title: 'Lista de cotejo: resolución de problemas',
        content: { items: [{ text: 'Representa datos' }, { text: 'Resuelve correctamente' }, { text: 'Argumenta procedimientos' }, { text: 'Comunica resultados' }] },
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: teacher.id, type: 'ERROR', title: '5 estudiantes de 3° Secundaria A presentan riesgo de bajo rendimiento', message: 'Revisa el módulo de seguimiento para ver el detalle.', link: '/app/seguimiento' },
      { userId: teacher.id, type: 'INFO', title: '3 actividades de Sistemas de Ecuaciones listas para calificar', message: '2° Secundaria B.', link: '/app/evaluacion' },
      { userId: teacher.id, type: 'INFO', title: 'Mañana es feriado', message: 'La IA puede reprogramar la distribución de contenidos automáticamente.', link: '/app/calendario' },
    ],
  });

  console.log(`  ✅  Docente de demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}
