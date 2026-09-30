// ──────────────────────────────────────────────
// IA pedagógica de Educraft XYZ (módulo 4).
//
// Cada generador intenta primero el proveedor de IA
// configurado (OPENAI_API_URL + OPENAI_API_KEY, API
// compatible con OpenAI) con un prompt alineado a la
// Adecuación Curricular de Matemática del MINERD. Si
// no hay proveedor o la respuesta no es válida, usa
// los generadores deterministas que siguen las
// plantillas oficiales, de modo que la plataforma
// funciona siempre. Toda llamada al proveedor queda
// registrada en AiAnalysis (trazabilidad y costos).
// ──────────────────────────────────────────────

import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiAnalysisStatus, AiAnalysisType, Difficulty, Prisma, QuestionType } from '@prisma/client';
import { z, ZodType } from 'zod';
import { PrismaService } from 'prisma/prisma.service';
import type { AiProviderService } from 'src/modules/ai-analysis/providers/interfaces/ai-provider.service';
import { CurriculumService } from '../curriculum/curriculum.service';
import { PlanningService } from '../planning/planning.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ReportService } from '../report/report.service';
import { passingScore, SectionService } from '../section/section.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { buildPresentationFromPlan } from '../planning/presentation.builder';
import { GRADING_BLOCKS } from '../shared/grading.calculator';
import { formatDateOnly } from '../shared/dates.util';
import { sectionLabel } from '../shared/zoned.util';
import { solveStepByStep, type StepSolution } from './math/step-solver';
import { generateProblems, supportedFamilies, type DifficultyLevel } from './generators/problem-generator';
import {
  activityTemplate,
  checklistTemplate,
  examTemplate,
  lessonPlanTemplate,
  observationTemplate,
  programTemplate,
  ratingScaleTemplate,
  reinforcementStrategies,
  rubricTemplate,
  tutorFallback,
  type ExamQuestionType,
  type LessonPlanDraft,
} from './generators/pedagogy-templates';
import {
  DocumentToSessionDto,
  GenerateActivityDto,
  GenerateExamDto,
  GenerateInstrumentDto,
  GenerateLessonPlanDto,
  GenerateObservationDto,
  GenerateProblemsDto,
  GenerateProgramDto,
  GenerateStrategiesDto,
  QuickCommandDto,
} from './dto/ai-pedagogy.dto';

export type AiSource = 'ai' | 'template';

const SYSTEM_BASE = `Eres el asistente pedagógico de Educraft XYZ, plataforma para docentes de Matemática del Nivel Secundario de la República Dominicana.
Te alineas estrictamente a la Adecuación Curricular de Matemática del MINERD: competencias fundamentales (Comunicativa; Pensamiento Lógico, Creativo y Crítico; Resolución de Problemas; Ética y Ciudadana; Científica y Tecnológica; Ambiental y de la Salud; Desarrollo Personal y Espiritual), competencias específicas por grado, contenidos (conceptos, procedimientos, actitudes y valores) e indicadores de logro.
Usa contextos dominicanos (RD$, provincias, colmados, cooperativas), lenguaje claro y rigor matemático. Escribe en español.
Responde ÚNICAMENTE con un objeto JSON válido que siga exactamente el esquema pedido, sin texto adicional.`;

const MomentSchema = z.object({
  moment: z.enum(['INICIO', 'DESARROLLO', 'CIERRE']),
  minutes: z.number(),
  activities: z.array(z.string()).min(1),
  metacognition: z.string().default(''),
  evidences: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
  resources: z.array(z.string()).default([]),
});

const LessonPlanSchema = z.object({
  title: z.string(),
  purpose: z.string(),
  strategies: z.array(z.string()).default([]),
  moments: z.array(MomentSchema).length(3),
  assignment: z.string().default(''),
  evaluation: z
    .object({
      type: z.string().default('FORMATIVE'),
      instruments: z.array(z.string()).default([]),
      evidences: z.array(z.string()).default([]),
    })
    .partial()
    .optional(),
});

const VariantSchema = z.object({ statement: z.string(), answer: z.string() });
const ProblemsSchema = z.object({
  problems: z
    .array(
      z.object({
        statement: z.string(),
        procedure: z.array(z.string()),
        solution: z.string().default(''),
        answer: z.string(),
        easierVariant: VariantSchema,
        harderVariant: VariantSchema,
      }),
    )
    .min(1),
});

const RubricSchema = z.object({
  criteria: z
    .array(z.object({ criterion: z.string(), weight: z.number(), descriptors: z.array(z.string()).length(4) }))
    .min(2),
});

const QuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'DEVELOPMENT', 'MATCHING', 'COMPLETE', 'PROBLEM']),
        statement: z.string(),
        options: z.unknown().optional(),
        answer: z.unknown().optional(),
        solution: z.string().optional(),
        points: z.number().optional(),
      }),
    )
    .min(1),
});

const TutorSchema = z.object({ reply: z.string().min(1) });

const StrategiesSchema = z.object({
  summary: z.string(),
  strategies: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  plan: z.array(z.string()).default([]),
});

const StepsSchema = z.object({
  steps: z.array(z.object({ title: z.string(), explanation: z.string(), latex: z.string() })).min(1),
  answer: z.string(),
  answerLatex: z.string().default(''),
});

const TextSchema = z.object({ text: z.string().min(1) });

const levelName = (d?: Difficulty | DifficultyLevel) =>
  d === 'EASY' ? 'fácil' : d === 'HARD' ? 'difícil' : 'intermedia';

@Injectable()
export class PedagogicalAiService {
  private readonly logger = new Logger(PedagogicalAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculum: CurriculumService,
    private readonly planning: PlanningService,
    private readonly evaluation: EvaluationService,
    private readonly reports: ReportService,
    private readonly sections: SectionService,
    private readonly scope: TeacherScopeService,
    @Inject('AiProviderService') private readonly provider: AiProviderService,
  ) {}

  get providerEnabled(): boolean {
    return Boolean(process.env.OPENAI_API_URL && process.env.OPENAI_API_KEY);
  }

  status() {
    return {
      providerEnabled: this.providerEnabled,
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      problemFamilies: supportedFamilies(),
    };
  }

  // ── Núcleo: proveedor con respaldo ─────────────────

  private async run<T>(opts: {
    userId: number;
    type: AiAnalysisType;
    prompt: string;
    schema: ZodType<T>;
    fallback: () => T;
    temperature?: number;
  }): Promise<{ data: T; source: AiSource }> {
    if (!this.providerEnabled) return { data: opts.fallback(), source: 'template' };

    const started = new Date();
    const model = process.env.OPENAI_MODEL || undefined;
    try {
      const result = await this.provider.analyze(
        { systemInstructions: SYSTEM_BASE, userPrompt: opts.prompt, model, temperature: opts.temperature ?? 0.7 },
        opts.schema,
      );
      await this.trace(opts.userId, opts.type, opts.prompt, result.data, {
        status: 'COMPLETED',
        started,
        model: result.metadata.model,
        tokens: result.metadata.tokens,
        processingTimeMs: result.metadata.processingTimeMs,
      });
      return { data: result.data, source: 'ai' };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`Proveedor IA falló (${opts.type}): ${message}. Se usa la plantilla.`);
      await this.trace(opts.userId, opts.type, opts.prompt, null, { status: 'FAILED', started, error: message });
      return { data: opts.fallback(), source: 'template' };
    }
  }

  private async trace(
    userId: number,
    type: AiAnalysisType,
    prompt: string,
    response: unknown,
    meta: {
      status: AiAnalysisStatus;
      started: Date;
      model?: string;
      error?: string;
      processingTimeMs?: number;
      tokens?: { prompt: number; completion: number; total: number };
    },
  ) {
    await this.prisma.aiAnalysis
      .create({
        data: {
          analysisType: type,
          analyzedById: userId,
          provider: 'OpenAI',
          model: (meta.model ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini').slice(0, 50),
          promptVersion: 'educraft-1',
          prompt: { system: SYSTEM_BASE, user: prompt } as Prisma.InputJsonValue,
          response: (response ?? {}) as Prisma.InputJsonValue,
          promptTokens: meta.tokens?.prompt,
          completionTokens: meta.tokens?.completion,
          totalTokens: meta.tokens?.total,
          processingTimeMs: meta.processingTimeMs,
          status: meta.status,
          errorMessage: meta.error,
          startedAt: meta.started,
          completedAt: new Date(),
        },
      })
      .catch((err: Error) => this.logger.warn(`No se pudo registrar AiAnalysis: ${err.message}`));
  }

  private async gradeContext(gradeId?: number | null) {
    if (!gradeId) return { name: 'Nivel Secundario', text: '' };
    const grade = await this.curriculum.grade(gradeId);
    const competences = grade.specificCompetences
      .map((c) => `- ${c.fundamental.name}: ${c.description}`)
      .join('\n');
    return {
      name: grade.name,
      grade,
      text: `Grado: ${grade.name} (${grade.cycle === 1 ? 'Primer' : 'Segundo'} Ciclo). Énfasis: ${grade.focus}\nCompetencias específicas del grado:\n${competences}`,
    };
  }

  // ── 4.2 Generador de sesiones ──────────────────────

  async lessonPlan(userId: number, dto: GenerateLessonPlanDto) {
    if (dto.sectionId) await this.scope.section(userId, dto.sectionId);
    const ctx = await this.gradeContext(dto.gradeId);
    const resolved = await this.curriculum.resolve(dto);
    const indicators = resolved.indicators.map((i) => i.description);
    const competences = resolved.competences.map((c) => `${c.fundamental.name}: ${c.description}`);
    const contents = resolved.contents.map((c) => c.description);
    const duration = dto.durationMinutes ?? 45;

    const prompt = `Diseña un plan de clase de ${duration} minutos sobre "${dto.topic}".
${ctx.text}
${competences.length ? `Competencias seleccionadas:\n- ${competences.join('\n- ')}` : ''}
${indicators.length ? `Indicadores de logro:\n- ${indicators.join('\n- ')}` : ''}
${contents.length ? `Contenidos:\n- ${contents.join('\n- ')}` : ''}
${dto.strategies?.length ? `Estrategias preferidas: ${dto.strategies.join(', ')}` : ''}
${dto.context ? `Contexto de los problemas: ${dto.context}` : ''}
Sigue la plantilla oficial "Esquema plan de clase": tres momentos INICIO, DESARROLLO y CIERRE; en cada uno: minutes (la suma debe ser ${duration}), activities (lista), metacognition (pregunta), evidences, techniques (técnicas e instrumentos de evaluación) y resources.
Esquema JSON: {"title":string,"purpose":string,"strategies":string[],"moments":[{"moment":"INICIO"|"DESARROLLO"|"CIERRE","minutes":number,"activities":string[],"metacognition":string,"evidences":string[],"techniques":string[],"resources":string[]}],"assignment":string,"evaluation":{"type":"FORMATIVE","instruments":string[],"evidences":string[]}}`;

    const fallback = (): z.infer<typeof LessonPlanSchema> => {
      const draft = lessonPlanTemplate({
        topic: dto.topic,
        gradeName: ctx.name,
        durationMinutes: duration,
        indicators,
        competences,
        strategies: dto.strategies,
        context: dto.context,
      });
      return draft;
    };

    const { data, source } = await this.run({
      userId,
      type: 'LESSON_PLAN',
      prompt,
      schema: LessonPlanSchema,
      fallback,
    });

    const draft = {
      gradeId: dto.gradeId,
      sectionId: dto.sectionId,
      unitId: dto.unitId,
      date: dto.date,
      title: data.title,
      topic: dto.topic,
      durationMinutes: duration,
      purpose: data.purpose,
      strategies: data.strategies,
      specificCompetenceIds: dto.specificCompetenceIds ?? [],
      indicatorIds: dto.indicatorIds ?? [],
      contentIds: dto.contentIds ?? [],
      moments: data.moments,
      evaluation: { ...(data.evaluation ?? {}), indicators },
      assignment: data.assignment,
      aiGenerated: true,
    };

    if (dto.save) {
      const plan = await this.planning.createPlan(userId, draft);
      return { source, plan, saved: true };
    }
    return { source, plan: draft, saved: false };
  }

  /** Convertir un PDF/texto en un borrador de sesión. */
  async documentToSession(userId: number, dto: DocumentToSessionDto, text: string) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length < 20) throw new BadRequestException('El documento no tiene texto suficiente');
    const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 3) ?? 'Sesión';
    const topic = firstLine.slice(0, 120);
    const excerpt = clean.slice(0, 6000);
    const ctx = await this.gradeContext(dto.gradeId);
    const duration = dto.durationMinutes ?? 45;

    const prompt = `Convierte el siguiente material en un plan de clase de ${duration} minutos para ${ctx.name}.
${ctx.text}
Material:
"""${excerpt}"""
Esquema JSON: {"title":string,"purpose":string,"strategies":string[],"moments":[{"moment":"INICIO"|"DESARROLLO"|"CIERRE","minutes":number,"activities":string[],"metacognition":string,"evidences":string[],"techniques":string[],"resources":string[]}],"assignment":string,"evaluation":{"type":"FORMATIVE","instruments":string[],"evidences":string[]}}`;

    const fallback = () => {
      const draft = lessonPlanTemplate({ topic, gradeName: ctx.name, durationMinutes: duration });
      const sentences = excerpt
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.length > 30)
        .slice(0, 3)
        .map((s) => `Análisis del material: "${s.slice(0, 180)}"`);
      draft.moments[1].activities.splice(1, 0, ...sentences);
      return draft;
    };

    const { data, source } = await this.run({ userId, type: 'LESSON_PLAN', prompt, schema: LessonPlanSchema, fallback });
    return {
      source,
      saved: false,
      plan: {
        gradeId: dto.gradeId,
        title: data.title,
        topic,
        durationMinutes: duration,
        purpose: data.purpose,
        strategies: data.strategies,
        specificCompetenceIds: [],
        indicatorIds: [],
        contentIds: [],
        moments: data.moments,
        evaluation: data.evaluation ?? {},
        assignment: data.assignment,
        aiGenerated: true,
      },
    };
  }

  // ── 4.1 Generador de problemas ─────────────────────

  async problems(userId: number, dto: GenerateProblemsDto) {
    const ctx = await this.gradeContext(dto.gradeId);
    const count = dto.count ?? 3;
    const prompt = `Genera ${count} problema(s) contextualizado(s) de dificultad ${levelName(dto.difficulty)} sobre "${dto.topic}".
${ctx.text}
${dto.context ? `Contexto: ${dto.context}.` : ''}
Para cada problema incluye el enunciado, el procedimiento paso a paso, la solución explicada, la respuesta final, una variante más fácil y una más difícil (cada variante con su respuesta).
Esquema JSON: {"problems":[{"statement":string,"procedure":string[],"solution":string,"answer":string,"easierVariant":{"statement":string,"answer":string},"harderVariant":{"statement":string,"answer":string}}]}`;

    const fallback = () => ({
      problems: generateProblems({
        topic: dto.topic,
        context: dto.context,
        difficulty: dto.difficulty,
        count,
      }).map((p) => ({
        statement: p.statement,
        procedure: p.procedure,
        solution: p.solution,
        answer: p.answer,
        latex: p.latex,
        easierVariant: { statement: p.easierVariant.statement, answer: p.easierVariant.answer },
        harderVariant: { statement: p.harderVariant.statement, answer: p.harderVariant.answer },
      })),
    });
    const { data, source } = await this.run({ userId, type: 'PROBLEM_SET', prompt, schema: ProblemsSchema, fallback });
    return { source, topic: dto.topic, difficulty: dto.difficulty ?? 'MEDIUM', ...data };
  }

  // ── 4.3 Ejemplos paso a paso ───────────────────────

  async stepByStep(userId: number, expression: string): Promise<StepSolution & { source: AiSource }> {
    try {
      return { ...solveStepByStep(expression), source: 'template' };
    } catch (err) {
      if (!this.providerEnabled) {
        throw new BadRequestException(
          `${(err as Error).message}. Ejemplos admitidos: "2x + 5 = 13", "x^2 - 5x + 6 = 0", "2x + y = 7; x - y = 2".`,
        );
      }
      const prompt = `Explica paso a paso, para proyectar en clase, cómo resolver: ${expression}
Esquema JSON: {"steps":[{"title":"Paso 1","explanation":string,"latex":string}],"answer":string,"answerLatex":string}`;
      const { data } = await this.run({
        userId,
        type: 'STEP_BY_STEP',
        prompt,
        schema: StepsSchema,
        fallback: () => {
          throw new BadRequestException((err as Error).message);
        },
        temperature: 0.2,
      });
      return {
        kind: 'simplify',
        input: expression,
        inputLatex: expression,
        steps: data.steps,
        answer: data.answer,
        answerLatex: data.answerLatex || data.answer,
        source: 'ai',
      };
    }
  }

  // ── Rúbricas, listas de cotejo, escalas ────────────

  async rubric(userId: number, dto: GenerateInstrumentDto) {
    const ctx = await this.gradeContext(dto.gradeId);
    const fundamental = dto.fundamentalId
      ? await this.prisma.fundamentalCompetence.findUnique({ where: { id: dto.fundamentalId } })
      : null;
    const n = dto.criteriaCount ?? 4;
    const base = rubricTemplate(dto.topic, fundamental?.name, n);
    const prompt = `Crea una rúbrica analítica sobre "${dto.topic}" con ${n} criterios.
${ctx.text}
${fundamental ? `Competencia fundamental evaluada: ${fundamental.name}.` : ''}
Cada criterio tiene un peso (la suma es 100) y 4 descriptores en este orden: Excelente, Logrado, En proceso, Inicio.
Esquema JSON: {"criteria":[{"criterion":string,"weight":number,"descriptors":[string,string,string,string]}]}`;
    const { data, source } = await this.run({
      userId,
      type: 'RUBRIC',
      prompt,
      schema: RubricSchema,
      fallback: () => ({ criteria: base.content.criteria }),
    });
    const instrument = {
      type: 'RUBRIC' as const,
      title: base.title,
      description: base.description,
      gradeId: dto.gradeId,
      fundamentalId: dto.fundamentalId,
      content: { levels: base.content.levels, scores: base.content.scores, criteria: data.criteria },
      aiGenerated: true,
    };
    return this.maybeSaveInstrument(userId, instrument, source, dto.save);
  }

  async checklist(userId: number, dto: GenerateInstrumentDto) {
    const indicators = dto.gradeId
      ? (await this.curriculum.grade(dto.gradeId)).indicators.slice(0, 20).map((i) => i.description)
      : [];
    const related = indicators.filter((i) =>
      dto.topic
        .toLowerCase()
        .split(/\s+/)
        .some((w) => w.length > 4 && i.toLowerCase().includes(w)),
    );
    const base = checklistTemplate(dto.topic, related);
    const prompt = `Crea una lista de cotejo (6 a 8 ítems observables, redactados en tercera persona) sobre "${dto.topic}".
${related.length ? `Indicadores relacionados:\n- ${related.join('\n- ')}` : ''}
Esquema JSON: {"text": "ítem 1|ítem 2|…"} (ítems separados por |)`;
    const { data, source } = await this.run({
      userId,
      type: 'CHECKLIST',
      prompt,
      schema: TextSchema,
      fallback: () => ({ text: base.content.items.map((i) => i.text).join('|') }),
    });
    const items = data.text
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
    return this.maybeSaveInstrument(
      userId,
      { type: 'CHECKLIST' as const, title: base.title, gradeId: dto.gradeId, content: { items }, aiGenerated: true },
      source,
      dto.save,
    );
  }

  async ratingScale(userId: number, dto: GenerateInstrumentDto) {
    const base = ratingScaleTemplate(dto.topic, dto.scale ?? '1-4');
    return this.maybeSaveInstrument(
      userId,
      { type: 'RATING_SCALE' as const, title: base.title, gradeId: dto.gradeId, content: base.content, aiGenerated: true },
      'template',
      dto.save,
    );
  }

  private async maybeSaveInstrument(
    userId: number,
    instrument: {
      type: 'RUBRIC' | 'CHECKLIST' | 'RATING_SCALE';
      title: string;
      description?: string;
      gradeId?: number;
      fundamentalId?: number;
      content: Record<string, unknown>;
      aiGenerated: boolean;
    },
    source: AiSource,
    save?: boolean,
  ) {
    if (save) {
      const saved = await this.evaluation.createInstrument(userId, instrument);
      return { source, saved: true, instrument: saved };
    }
    return { source, saved: false, instrument };
  }

  // ── Evaluaciones ───────────────────────────────────

  async exam(userId: number, dto: GenerateExamDto) {
    const ctx = await this.gradeContext(dto.gradeId);
    const types = (dto.types?.length ? dto.types : ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROBLEM']).filter(
      (t) => t !== 'GRAPH',
    ) as ExamQuestionType[];
    const prompt = `Crea una evaluación ${dto.evaluationType === 'DIAGNOSTIC' ? 'diagnóstica' : dto.evaluationType === 'FORMATIVE' ? 'formativa' : 'sumativa'} de ${dto.count} preguntas sobre "${dto.topic}", dificultad ${levelName(dto.difficulty)}.
${ctx.text}
Tipos de pregunta a usar (alternando): ${types.join(', ')}.
Reglas: MULTIPLE_CHOICE → "options" con 4 opciones y "answer" = índice (0-3) correcto; TRUE_FALSE → "answer" booleano; MATCHING → "options": {"left":string[],"right":string[]} y "answer": pares [[izq,der]]; COMPLETE/SHORT_ANSWER/PROBLEM/DEVELOPMENT → "answer" texto. Incluye "solution" con el procedimiento y "points".
Esquema JSON: {"questions":[{"type":string,"statement":string,"options":any,"answer":any,"solution":string,"points":number}]}`;
    const { data, source } = await this.run({
      userId,
      type: 'EXAM',
      prompt,
      schema: QuestionsSchema,
      fallback: () => ({
        questions: examTemplate({
          topic: dto.topic,
          count: dto.count,
          types,
          difficulty: dto.difficulty,
        }),
      }),
    });

    const questions = data.questions.slice(0, dto.count).map((q) => ({
      topic: dto.topic,
      type: q.type as QuestionType,
      difficulty: (dto.difficulty ?? 'MEDIUM') as Difficulty,
      statement: q.statement,
      options: q.options,
      answer: q.answer,
      solution: q.solution,
      points: q.points ?? 1,
      gradeId: dto.gradeId,
      fundamentalId: dto.fundamentalId,
      aiGenerated: true,
      tags: [dto.topic.toLowerCase()],
    }));

    if (!dto.save) return { source, saved: false, questions };

    const created = await this.evaluation.createQuestions(userId, { questions });
    const exam = await this.evaluation.createExam(userId, {
      title: dto.title ?? `Evaluación: ${dto.topic}`,
      gradeId: dto.gradeId,
      fundamentalId: dto.fundamentalId,
      evaluationType: dto.evaluationType ?? 'SUMMATIVE',
      questions: created.map((q) => ({ questionId: q.id })),
      aiGenerated: true,
    });
    return { source, saved: true, exam, questions: created };
  }

  // ── Actividades interactivas ───────────────────────

  async activity(userId: number, dto: GenerateActivityDto) {
    const content = activityTemplate(dto.type, dto.topic, dto.difficulty ?? 'MEDIUM');
    const activity = {
      type: dto.type,
      title: `${dto.topic} — ${ACTIVITY_LABELS[dto.type] ?? dto.type}`,
      topic: dto.topic,
      gradeId: dto.gradeId,
      instructions: ACTIVITY_INSTRUCTIONS[dto.type] ?? 'Resuelve cada reto.',
      content: content as Record<string, unknown>,
      aiGenerated: true,
    };
    if (dto.save) {
      return { source: 'template' as AiSource, saved: true, activity: await this.planning.createActivity(userId, activity) };
    }
    return { source: 'template' as AiSource, saved: false, activity };
  }

  // ── Observaciones y estrategias ────────────────────

  async observation(userId: number, dto: GenerateObservationDto) {
    const record = await this.sections.record(userId, dto.studentId);
    const passing = passingScore(record.student.section.schoolYear.gradingScale);
    const blockName = (b: number) => GRADING_BLOCKS.find((x) => x.block === b)?.name ?? `PC${b}`;
    const blocks = Object.entries(record.grades.summary.blockAverages).filter(([, v]) => v != null) as Array<[string, number]>;
    const snapshot = {
      firstName: record.student.firstName,
      average: record.grades.summary.finalScore,
      attendanceRate: record.attendance.rate,
      weakBlocks: blocks.filter(([, v]) => v < passing).map(([b]) => blockName(Number(b))),
      strongBlocks: blocks.filter(([, v]) => v >= 85).map(([b]) => blockName(Number(b))),
      passing,
    };
    const typeName = { CONDUCT: 'conducta', PARTICIPATION: 'participación', SITUATION: 'situación particular' }[dto.type];
    const prompt = `Redacta una observación breve (2-3 oraciones), objetiva y en tono constructivo sobre la ${typeName} del estudiante ${snapshot.firstName}.
Datos: promedio ${snapshot.average ?? 'sin datos'}, asistencia ${snapshot.attendanceRate ?? 'sin datos'}%, fortalezas: ${snapshot.strongBlocks.join('; ') || 'ninguna registrada'}, a mejorar: ${snapshot.weakBlocks.join('; ') || 'ninguna registrada'}.
Esquema JSON: {"text": string}`;
    const { data, source } = await this.run({
      userId,
      type: 'OBSERVATION',
      prompt,
      schema: TextSchema,
      fallback: () => ({ text: observationTemplate(dto.type, snapshot) }),
    });
    if (dto.save) {
      const saved = await this.sections.addObservation(userId, dto.studentId, {
        type: dto.type,
        content: data.text,
        aiGenerated: true,
      });
      return { source, saved: true, observation: saved };
    }
    return { source, saved: false, text: data.text };
  }

  async strategies(userId: number, dto: GenerateStrategiesDto) {
    const perf = await this.reports.sectionPerformance(userId, dto.sectionId);
    const passing = perf.section.passing;
    const rows = dto.studentIds?.length
      ? perf.rows.filter((r) => dto.studentIds!.includes(r.student.id))
      : perf.rows.filter((r) => r.score != null && r.score < passing);
    const weakBlocks = perf.blocks
      .filter((b) => b.average != null && b.average < passing + 5)
      .map((b) => ({ name: b.name, average: b.average }));
    const label = sectionLabel(perf.section.grade, perf.section.name);
    const atRisk = rows.map((r) => `${r.student.firstName} ${r.student.lastName}`);
    const prompt = `Sugiere estrategias de refuerzo para ${label} en Matemática.
Promedio del grupo: ${perf.summary.average ?? 'sin datos'}. Asistencia: ${perf.summary.attendanceRate ?? 'sin datos'}%.
Bloques de competencias débiles: ${weakBlocks.map((b) => `${b.name} (${b.average})`).join('; ') || 'ninguno'}.
Estudiantes en riesgo: ${atRisk.length}.${dto.topic ? ` Tema actual: ${dto.topic}.` : ''}
Esquema JSON: {"summary":string,"strategies":[{"title":string,"description":string}],"plan":string[]}`;
    const { data, source } = await this.run({
      userId,
      type: 'STRATEGY',
      prompt,
      schema: StrategiesSchema,
      fallback: () => reinforcementStrategies({ sectionLabel: label, weakBlocks, atRisk, topic: dto.topic }),
    });
    return { source, section: perf.section, students: atRisk, ...data };
  }

  // ── Presentaciones y programación ──────────────────

  async presentation(userId: number, lessonPlanId: number) {
    const plan = await this.planning.getPlan(userId, lessonPlanId);
    const examples: Array<{ title: string; latex?: string; steps?: string[] }> = [];
    const problems = generateProblems({ topic: plan.topic, count: 3 });
    const withLatex = problems.find((p) => p.latex && /=/.test(p.latex) && !/\\/.test(p.latex));
    if (withLatex?.latex) {
      try {
        const solved = solveStepByStep(withLatex.latex);
        examples.push({
          title: `Ejemplo resuelto: ${solved.inputLatex}`,
          latex: solved.inputLatex,
          steps: solved.steps.map((s) => `${s.explanation} → ${s.latex}`),
        });
      } catch {
        // sin ejemplo algebraico
      }
    }
    examples.push({ title: 'Ejemplo contextualizado', steps: [problems[0].statement, ...problems[0].procedure] });

    const slides = buildPresentationFromPlan({
      title: plan.title,
      topic: plan.topic,
      purpose: plan.purpose,
      assignment: plan.assignment,
      gradeName: plan.grade.name,
      moments: plan.moments as Array<{ moment: string; activities: string[]; metacognition?: string }>,
      contents: plan.curriculum.contents.filter((c) => c.kind === 'CONCEPT').map((c) => c.description),
      examples,
      exercises: problems.slice(1).map((p) => ({ statement: p.statement, answer: p.answer })),
    });
    const presentation = await this.planning.createPresentation(userId, {
      title: plan.title,
      subtitle: plan.topic,
      lessonPlanId: plan.id,
      slides: slides as unknown as Record<string, unknown>[],
      aiGenerated: true,
    });
    return { source: 'template' as AiSource, presentation };
  }

  async program(userId: number, dto: GenerateProgramDto) {
    const grade = await this.curriculum.grade(dto.gradeId);
    const year = dto.schoolYearId
      ? await this.prisma.schoolYear.findFirst({
          where: { id: dto.schoolYearId, teacherId: userId, deletedAt: null },
          include: { periods: { orderBy: { number: 'asc' } } },
        })
      : await this.scope.activeSchoolYear(userId);
    if (dto.schoolYearId && !year) throw new NotFoundException('Año escolar no encontrado');
    const concepts = grade.contents.filter((c) => c.kind === 'CONCEPT');
    const draft = programTemplate({
      gradeName: grade.name,
      concepts,
      periods: (year?.periods ?? []).map((p) => ({
        number: p.number,
        startDate: formatDateOnly(p.startDate),
        endDate: formatDateOnly(p.endDate),
      })),
    });
    const competenceIds = grade.specificCompetences.map((c) => c.id);
    const units = draft.units.map((u, i) => ({
      gradeId: grade.id,
      schoolYearId: year?.id,
      sectionId: dto.sectionId,
      kind: 'UNIT' as const,
      order: i + 1,
      title: u.title,
      description: u.description,
      startDate: u.startDate ?? undefined,
      endDate: u.endDate ?? undefined,
      specificCompetenceIds: competenceIds,
      indicatorIds: grade.indicators
        .filter((_, k) => k % Math.max(1, draft.units.length) === i % Math.max(1, draft.units.length))
        .map((x) => x.id),
      contentIds: u.contentIds,
      evaluationCriteria: u.evaluationCriteria,
      evidences: u.evidences,
      aiGenerated: true,
    }));
    if (dto.save) {
      const saved: Awaited<ReturnType<PlanningService['createUnit']>>[] = [];
      for (const u of units) saved.push(await this.planning.createUnit(userId, u));
      return { source: 'template' as AiSource, saved: true, title: draft.title, units: saved };
    }
    return { source: 'template' as AiSource, saved: false, title: draft.title, units };
  }

  // ── Comandos rápidos (menú del robot) ──────────────

  async quick(userId: number, dto: QuickCommandDto) {
    const topic = dto.topic || 'ecuaciones lineales';
    if (dto.command === 'ACTIVE_BREAK') {
      const breaks = [
        'Pausa activa "Cuenta y muévete" (3 min): de pie, cuenten de 3 en 3 hasta 30; en cada múltiplo de 9 den un aplauso y un salto.',
        'Pausa activa "Ángulos con el cuerpo" (3 min): formen con los brazos ángulos de 90°, 45° y 180° cuando el docente los nombre.',
        'Pausa activa "Recta numérica humana" (4 min): cada estudiante recibe un número entero y el grupo se ordena de menor a mayor sin hablar.',
      ];
      return { source: 'template' as AiSource, title: 'Pausa activa', text: breaks[Math.floor(Math.random() * breaks.length)] };
    }
    const p = generateProblems({ topic, count: 1 })[0];
    if (dto.command === 'EXIT_TICKET') {
      return {
        source: 'template' as AiSource,
        title: 'Exit ticket',
        text: `1. ${p.statement}\n2. ¿Qué paso te resultó más difícil y por qué?\n3. Escribe una situación de tu vida donde uses ${topic}.`,
        answer: p.answer,
      };
    }
    return { source: 'template' as AiSource, title: 'Problema del día', text: p.statement, answer: p.answer, procedure: p.procedure };
  }

  // ── 4.4 Tutor virtual docente ──────────────────────

  history(userId: number) {
    return this.prisma.tutorMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async clearHistory(userId: number) {
    await this.prisma.tutorMessage.deleteMany({ where: { userId } });
  }

  async tutor(userId: number, message: string) {
    const [user, previous, sections] = await Promise.all([
      this.prisma.systemUser.findUnique({ where: { id: userId }, select: { firstName: true } }),
      this.prisma.tutorMessage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
      this.prisma.section.findMany({
        where: { teacherId: userId, deletedAt: null, schoolYear: { isActive: true } },
        include: { grade: true },
      }),
    ]);
    await this.prisma.tutorMessage.create({ data: { userId, role: 'user', content: message } });

    const history = previous
      .reverse()
      .map((m) => `${m.role === 'user' ? 'Docente' : 'Tutor'}: ${m.content}`)
      .join('\n');
    const prompt = `Actúa como Tutor Virtual Docente: responde con sugerencias pedagógicas prácticas, ejemplos y, si aplica, pasos concretos para el aula.
Docente: ${user?.firstName ?? ''}. Secciones a su cargo: ${sections.map((s) => `${s.grade.name} ${s.name}`).join(', ') || 'no registradas'}.
${history ? `Conversación previa:\n${history}\n` : ''}Mensaje del docente: ${message}
Esquema JSON: {"reply": string} (puedes usar saltos de línea y viñetas "•" dentro de reply).`;
    const { data, source } = await this.run({
      userId,
      type: 'TUTOR',
      prompt,
      schema: TutorSchema,
      fallback: () => ({
        reply: tutorFallback(message, {
          teacherName: user?.firstName,
          sections: sections.map((s) => `${s.grade.name} ${s.name}`),
        }),
      }),
    });
    const saved = await this.prisma.tutorMessage.create({
      data: { userId, role: 'assistant', content: data.reply },
    });
    return { source, message: saved };
  }
}

const ACTIVITY_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Selección múltiple',
  TRUE_FALSE: 'Verdadero o falso',
  MATCHING: 'Relacionar columnas',
  COMPLETE: 'Completar espacios',
  ORDER_STEPS: 'Ordenar pasos',
  DRAG_DROP: 'Arrastrar y soltar',
  SOLVE_OPERATIONS: 'Resolver operaciones',
  CARTESIAN_POINTS: 'Plano cartesiano',
  ROULETTE: 'Ruleta',
  MEMORY: 'Memorama',
  ESCAPE_ROOM: 'Escape room',
  QUIZ_GAME: 'Juego tipo quiz',
};

const ACTIVITY_INSTRUCTIONS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Elige la opción correcta en cada pregunta.',
  TRUE_FALSE: 'Indica si cada afirmación es verdadera o falsa.',
  MATCHING: 'Relaciona cada elemento de la izquierda con su resultado.',
  COMPLETE: 'Completa los espacios en blanco.',
  ORDER_STEPS: 'Ordena los pasos del procedimiento.',
  DRAG_DROP: 'Arrastra cada expresión a su categoría.',
  SOLVE_OPERATIONS: 'Resuelve cada operación.',
  CARTESIAN_POINTS: 'Ubica cada punto en el plano cartesiano.',
  ROULETTE: 'Gira la ruleta y resuelve el reto que salga.',
  MEMORY: 'Encuentra las parejas: planteamiento y resultado.',
  ESCAPE_ROOM: 'Resuelve cada sala para descubrir el código de salida.',
  QUIZ_GAME: 'Responde antes de que se acabe el tiempo.',
};
