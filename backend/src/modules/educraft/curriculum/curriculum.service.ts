import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateAxisDto,
  CreateCapacityDto,
  CreatePerformanceDto,
  ImportCurriculumDto,
  UpdateAxisDto,
  UpdateCapacityDto,
  UpdatePerformanceDto,
} from './dto/curriculum.dto';

/** Catálogo de la Adecuación Curricular: lectura para docentes, gestión para RBAC. */
@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  grades() {
    return this.prisma.curriculumGrade.findMany({ orderBy: { order: 'asc' } });
  }

  fundamentals() {
    return this.prisma.fundamentalCompetence.findMany({
      orderBy: { order: 'asc' },
    });
  }

  axes(cycle?: number) {
    return this.prisma.crossCuttingAxis.findMany({
      where: cycle ? { cycle } : undefined,
      orderBy: [{ cycle: 'asc' }, { order: 'asc' }],
    });
  }

  capacities(filter: { gradeId?: number; specificCompetenceId?: number } = {}) {
    return this.prisma.capacity.findMany({
      where: {
        gradeId: filter.gradeId,
        specificCompetenceId: filter.specificCompetenceId,
      },
      orderBy: [{ gradeId: 'asc' }, { order: 'asc' }],
    });
  }

  performances(filter: { gradeId?: number; capacityId?: number } = {}) {
    return this.prisma.performance.findMany({
      where: { gradeId: filter.gradeId, capacityId: filter.capacityId },
      orderBy: [{ gradeId: 'asc' }, { order: 'asc' }],
    });
  }

  async grade(id: number) {
    const grade = await this.prisma.curriculumGrade.findUnique({
      where: { id },
      include: {
        specificCompetences: {
          include: { fundamental: true },
          orderBy: { fundamental: { order: 'asc' } },
        },
        indicators: { orderBy: { order: 'asc' } },
        contents: { orderBy: { order: 'asc' } },
        capacities: { orderBy: { order: 'asc' } },
        performances: { orderBy: { order: 'asc' } },
      },
    });
    if (!grade) throw new NotFoundException(`Grado ${id} no encontrado`);
    const [criteria, axes] = await Promise.all([
      this.prisma.evaluationCriterion.findMany({
        where: { cycle: grade.cycle },
        orderBy: { id: 'asc' },
      }),
      this.axes(grade.cycle),
    ]);
    return { ...grade, criteria, axes };
  }

  /** Textos de las entidades curriculares seleccionadas por el docente. */
  async resolve(ids: {
    specificCompetenceIds?: number[];
    indicatorIds?: number[];
    contentIds?: number[];
    axisIds?: number[];
    capacityIds?: number[];
    performanceIds?: number[];
  }) {
    const [competences, indicators, contents, axes, capacities, performances] =
      await Promise.all([
        this.prisma.specificCompetence.findMany({
          where: { id: { in: ids.specificCompetenceIds ?? [] } },
          include: { fundamental: true },
        }),
        this.prisma.achievementIndicator.findMany({
          where: { id: { in: ids.indicatorIds ?? [] } },
        }),
        this.prisma.curriculumContent.findMany({
          where: { id: { in: ids.contentIds ?? [] } },
          orderBy: { order: 'asc' },
        }),
        this.prisma.crossCuttingAxis.findMany({
          where: { id: { in: ids.axisIds ?? [] } },
        }),
        this.prisma.capacity.findMany({
          where: { id: { in: ids.capacityIds ?? [] } },
          orderBy: { order: 'asc' },
        }),
        this.prisma.performance.findMany({
          where: { id: { in: ids.performanceIds ?? [] } },
          orderBy: { order: 'asc' },
        }),
      ]);
    return {
      competences,
      indicators,
      contents,
      axes,
      capacities,
      performances,
    };
  }

  // ── Ejes transversales ──────────────────────────────────────────

  async axis(id: number) {
    const axis = await this.prisma.crossCuttingAxis.findUnique({
      where: { id },
    });
    if (!axis) throw new NotFoundException(`Eje ${id} no encontrado`);
    return axis;
  }

  createAxis(dto: CreateAxisDto) {
    return this.prisma.crossCuttingAxis.create({ data: dto });
  }

  updateAxis(id: number, dto: UpdateAxisDto) {
    return this.prisma.crossCuttingAxis.update({ where: { id }, data: dto });
  }

  removeAxis(id: number) {
    return this.prisma.crossCuttingAxis.delete({ where: { id } });
  }

  // ── Capacidades ─────────────────────────────────────────────────

  async capacity(id: number) {
    const capacity = await this.prisma.capacity.findUnique({
      where: { id },
      include: { performances: true },
    });
    if (!capacity) throw new NotFoundException(`Capacidad ${id} no encontrada`);
    return capacity;
  }

  createCapacity(dto: CreateCapacityDto) {
    return this.prisma.capacity.create({ data: dto });
  }

  updateCapacity(id: number, dto: UpdateCapacityDto) {
    return this.prisma.capacity.update({ where: { id }, data: dto });
  }

  removeCapacity(id: number) {
    return this.prisma.capacity.delete({ where: { id } });
  }

  // ── Desempeños ──────────────────────────────────────────────────

  async performance(id: number) {
    const performance = await this.prisma.performance.findUnique({
      where: { id },
    });
    if (!performance)
      throw new NotFoundException(`Desempeño ${id} no encontrado`);
    return performance;
  }

  createPerformance(dto: CreatePerformanceDto) {
    return this.prisma.performance.create({ data: dto });
  }

  updatePerformance(id: number, dto: UpdatePerformanceDto) {
    return this.prisma.performance.update({ where: { id }, data: dto });
  }

  removePerformance(id: number) {
    return this.prisma.performance.delete({ where: { id } });
  }

  /** Upsert transaccional de catálogos con clave estable (idempotente). */
  import(dto: ImportCurriculumDto) {
    return this.prisma.$transaction(async (tx) => {
      for (const axis of dto.axes ?? []) {
        await tx.crossCuttingAxis.upsert({
          where: { code_cycle: { code: axis.code, cycle: axis.cycle } },
          update: {
            name: axis.name,
            description: axis.description,
            gradeDetails: axis.gradeDetails ?? [],
            order: axis.order ?? 0,
          },
          create: {
            ...axis,
            gradeDetails: axis.gradeDetails ?? [],
            order: axis.order ?? 0,
          },
        });
      }
      for (const capacity of dto.capacities ?? []) {
        await tx.capacity.upsert({
          where: { code: capacity.code },
          update: { ...capacity, order: capacity.order ?? 0 },
          create: { ...capacity, order: capacity.order ?? 0 },
        });
      }
      for (const performance of dto.performances ?? []) {
        await tx.performance.upsert({
          where: { code: performance.code },
          update: { ...performance, order: performance.order ?? 0 },
          create: { ...performance, order: performance.order ?? 0 },
        });
      }
      return {
        axes: (dto.axes ?? []).length,
        capacities: (dto.capacities ?? []).length,
        performances: (dto.performances ?? []).length,
      };
    });
  }
}
