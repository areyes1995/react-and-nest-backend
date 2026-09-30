import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { toDateOnly } from '../shared/dates.util';
import { CurriculumService } from '../curriculum/curriculum.service';
import { buildPresentationFromPlan } from './presentation.builder';
import {
  CreateActivityDto,
  CreateLessonPlanDto,
  CreatePresentationDto,
  CreateUnitDto,
  UpdateActivityDto,
  UpdateLessonPlanDto,
  UpdatePresentationDto,
  UpdateUnitDto,
} from './dto/planning.dto';

const json = (value: unknown) => value as Prisma.InputJsonValue;
const PLAN_INCLUDE = {
  grade: true,
  section: { select: { id: true, name: true, color: true } },
  unit: { select: { id: true, title: true, kind: true } },
  _count: { select: { presentations: { where: { deletedAt: null } } } },
} satisfies Prisma.LessonPlanInclude;

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
    private readonly curriculum: CurriculumService,
  ) {}

  // ── Programaciones / unidades ─────────────────────

  listUnits(teacherId: number, filter: { gradeId?: number; schoolYearId?: number }) {
    return this.prisma.learningUnit.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(filter.gradeId ? { gradeId: filter.gradeId } : {}),
        ...(filter.schoolYearId ? { schoolYearId: filter.schoolYearId } : {}),
      },
      include: {
        grade: true,
        section: { select: { id: true, name: true } },
        _count: { select: { lessonPlans: { where: { deletedAt: null } } } },
      },
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }, { id: 'asc' }],
    });
  }

  async getUnit(teacherId: number, id: number) {
    const unit = await this.prisma.learningUnit.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: {
        grade: true,
        section: { select: { id: true, name: true } },
        lessonPlans: {
          where: { deletedAt: null },
          orderBy: [{ date: 'asc' }, { id: 'asc' }],
          select: { id: true, title: true, topic: true, date: true, status: true },
        },
      },
    });
    if (!unit) throw new NotFoundException(`Unidad ${id} no encontrada`);
    return { ...unit, curriculum: await this.curriculum.resolve(unit) };
  }

  async createUnit(teacherId: number, dto: CreateUnitDto) {
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    return this.prisma.learningUnit.create({ data: this.unitData(teacherId, dto) as Prisma.LearningUnitUncheckedCreateInput });
  }

  async updateUnit(teacherId: number, id: number, dto: UpdateUnitDto) {
    await this.getUnit(teacherId, id);
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    return this.prisma.learningUnit.update({ where: { id }, data: this.unitData(teacherId, dto) });
  }

  async removeUnit(teacherId: number, id: number) {
    await this.getUnit(teacherId, id);
    await this.prisma.learningUnit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private unitData(teacherId: number, dto: UpdateUnitDto) {
    return {
      teacherId,
      gradeId: dto.gradeId,
      schoolYearId: dto.schoolYearId,
      sectionId: dto.sectionId,
      kind: dto.kind,
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate ? toDateOnly(dto.startDate) : undefined,
      endDate: dto.endDate ? toDateOnly(dto.endDate) : undefined,
      order: dto.order,
      color: dto.color,
      specificCompetenceIds: dto.specificCompetenceIds,
      indicatorIds: dto.indicatorIds,
      contentIds: dto.contentIds,
      evaluationCriteria: dto.evaluationCriteria,
      evidences: dto.evidences,
      aiGenerated: dto.aiGenerated,
    };
  }

  // ── Planes de clase ───────────────────────────────

  listPlans(
    teacherId: number,
    filter: { sectionId?: number; unitId?: number; from?: string; to?: string; q?: string },
  ) {
    const q = filter.q?.trim();
    return this.prisma.lessonPlan.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(filter.sectionId ? { sectionId: filter.sectionId } : {}),
        ...(filter.unitId ? { unitId: filter.unitId } : {}),
        ...(filter.from || filter.to
          ? {
              date: {
                ...(filter.from ? { gte: toDateOnly(filter.from) } : {}),
                ...(filter.to ? { lte: toDateOnly(filter.to) } : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { topic: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: PLAN_INCLUDE,
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getPlan(teacherId: number, id: number) {
    const plan = await this.prisma.lessonPlan.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: PLAN_INCLUDE,
    });
    if (!plan) throw new NotFoundException(`Plan de clase ${id} no encontrado`);
    return { ...plan, curriculum: await this.curriculum.resolve(plan) };
  }

  async createPlan(teacherId: number, dto: CreateLessonPlanDto) {
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    const plan = await this.prisma.lessonPlan.create({
      data: {
        teacherId,
        gradeId: dto.gradeId,
        sectionId: dto.sectionId,
        unitId: dto.unitId,
        title: dto.title,
        topic: dto.topic,
        date: dto.date ? toDateOnly(dto.date) : null,
        durationMinutes: dto.durationMinutes ?? 45,
        purpose: dto.purpose,
        strategies: dto.strategies ?? [],
        status: dto.status,
        specificCompetenceIds: dto.specificCompetenceIds ?? [],
        indicatorIds: dto.indicatorIds ?? [],
        contentIds: dto.contentIds ?? [],
        moments: json(dto.moments),
        evaluation: dto.evaluation ? json(dto.evaluation) : undefined,
        assignment: dto.assignment,
        aiGenerated: dto.aiGenerated ?? false,
      },
      include: PLAN_INCLUDE,
    });
    await this.syncPlanEvent(teacherId, plan);
    return plan;
  }

  async updatePlan(teacherId: number, id: number, dto: UpdateLessonPlanDto) {
    await this.getPlan(teacherId, id);
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    const plan = await this.prisma.lessonPlan.update({
      where: { id },
      data: {
        gradeId: dto.gradeId,
        sectionId: dto.sectionId,
        unitId: dto.unitId,
        title: dto.title,
        topic: dto.topic,
        date: dto.date ? toDateOnly(dto.date) : undefined,
        durationMinutes: dto.durationMinutes,
        purpose: dto.purpose,
        strategies: dto.strategies,
        status: dto.status,
        specificCompetenceIds: dto.specificCompetenceIds,
        indicatorIds: dto.indicatorIds,
        contentIds: dto.contentIds,
        moments: dto.moments ? json(dto.moments) : undefined,
        evaluation: dto.evaluation ? json(dto.evaluation) : undefined,
        assignment: dto.assignment,
        aiGenerated: dto.aiGenerated,
      },
      include: PLAN_INCLUDE,
    });
    await this.syncPlanEvent(teacherId, plan);
    return plan;
  }

  async duplicatePlan(teacherId: number, id: number) {
    const plan = await this.getPlan(teacherId, id);
    return this.prisma.lessonPlan.create({
      data: {
        teacherId,
        gradeId: plan.gradeId,
        sectionId: plan.sectionId,
        unitId: plan.unitId,
        title: `${plan.title} (copia)`,
        topic: plan.topic,
        durationMinutes: plan.durationMinutes,
        purpose: plan.purpose,
        strategies: plan.strategies,
        specificCompetenceIds: plan.specificCompetenceIds,
        indicatorIds: plan.indicatorIds,
        contentIds: plan.contentIds,
        moments: json(plan.moments),
        evaluation: plan.evaluation ? json(plan.evaluation) : undefined,
        assignment: plan.assignment,
      },
      include: PLAN_INCLUDE,
    });
  }

  async removePlan(teacherId: number, id: number) {
    await this.getPlan(teacherId, id);
    await this.prisma.lessonPlan.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.calendarEvent.updateMany({
      where: { lessonPlanId: id },
      data: { deletedAt: new Date() },
    });
  }

  /** Una clase planificada con fecha aparece como evento en la agenda. */
  private async syncPlanEvent(
    teacherId: number,
    plan: { id: number; title: string; date: Date | null; sectionId: number | null },
  ) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { lessonPlanId: plan.id, deletedAt: null },
    });
    if (!plan.date) {
      if (existing) {
        await this.prisma.calendarEvent.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
      }
      return;
    }
    const data = {
      title: plan.title,
      startAt: plan.date,
      sectionId: plan.sectionId,
      allDay: true,
    };
    if (existing) {
      await this.prisma.calendarEvent.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.calendarEvent.create({
        data: { ...data, teacherId, type: 'CLASS', lessonPlanId: plan.id },
      });
    }
  }

  // ── Presentaciones ────────────────────────────────

  listPresentations(teacherId: number) {
    return this.prisma.presentation.findMany({
      where: { teacherId, deletedAt: null },
      include: { lessonPlan: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPresentation(teacherId: number, id: number) {
    const presentation = await this.prisma.presentation.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: { lessonPlan: { select: { id: true, title: true } } },
    });
    if (!presentation) throw new NotFoundException(`Presentación ${id} no encontrada`);
    return presentation;
  }

  createPresentation(teacherId: number, dto: CreatePresentationDto) {
    return this.prisma.presentation.create({
      data: {
        teacherId,
        title: dto.title,
        subtitle: dto.subtitle,
        lessonPlanId: dto.lessonPlanId,
        theme: dto.theme ?? 'pastel',
        slides: json(dto.slides),
        aiGenerated: dto.aiGenerated ?? false,
      },
    });
  }

  async updatePresentation(teacherId: number, id: number, dto: UpdatePresentationDto) {
    await this.getPresentation(teacherId, id);
    return this.prisma.presentation.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        lessonPlanId: dto.lessonPlanId,
        theme: dto.theme,
        slides: dto.slides ? json(dto.slides) : undefined,
      },
    });
  }

  async removePresentation(teacherId: number, id: number) {
    await this.getPresentation(teacherId, id);
    await this.prisma.presentation.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Genera la presentación de la plantilla oficial a partir de un plan de clase. */
  async presentationFromPlan(teacherId: number, planId: number) {
    const plan = await this.getPlan(teacherId, planId);
    const slides = buildPresentationFromPlan({
      title: plan.title,
      topic: plan.topic,
      purpose: plan.purpose,
      assignment: plan.assignment,
      gradeName: plan.grade.name,
      moments: plan.moments as Array<{ moment: string; activities: string[]; metacognition?: string }>,
      contents: plan.curriculum.contents
        .filter((c) => c.kind === 'CONCEPT')
        .map((c) => c.description),
    });
    return this.createPresentation(teacherId, {
      title: plan.title,
      subtitle: plan.topic,
      lessonPlanId: plan.id,
      slides: slides as unknown as Record<string, unknown>[],
    });
  }

  // ── Actividades interactivas ──────────────────────

  listActivities(teacherId: number, type?: ActivityType) {
    return this.prisma.interactiveActivity.findMany({
      where: { teacherId, deletedAt: null, ...(type ? { type } : {}) },
      include: { grade: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getActivity(teacherId: number, id: number) {
    const activity = await this.prisma.interactiveActivity.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: { grade: true },
    });
    if (!activity) throw new NotFoundException(`Actividad ${id} no encontrada`);
    return activity;
  }

  createActivity(teacherId: number, dto: CreateActivityDto) {
    return this.prisma.interactiveActivity.create({
      data: {
        teacherId,
        type: dto.type,
        title: dto.title,
        topic: dto.topic,
        gradeId: dto.gradeId,
        instructions: dto.instructions,
        content: json(dto.content),
        aiGenerated: dto.aiGenerated ?? false,
      },
    });
  }

  async updateActivity(teacherId: number, id: number, dto: UpdateActivityDto) {
    await this.getActivity(teacherId, id);
    return this.prisma.interactiveActivity.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        topic: dto.topic,
        gradeId: dto.gradeId,
        instructions: dto.instructions,
        content: dto.content ? json(dto.content) : undefined,
      },
    });
  }

  async removeActivity(teacherId: number, id: number) {
    await this.getActivity(teacherId, id);
    await this.prisma.interactiveActivity.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
