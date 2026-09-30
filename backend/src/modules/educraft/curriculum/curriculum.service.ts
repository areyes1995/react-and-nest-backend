import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

/** Catálogo de la Adecuación Curricular (solo lectura para docentes). */
@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  grades() {
    return this.prisma.curriculumGrade.findMany({ orderBy: { order: 'asc' } });
  }

  fundamentals() {
    return this.prisma.fundamentalCompetence.findMany({ orderBy: { order: 'asc' } });
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
      },
    });
    if (!grade) throw new NotFoundException(`Grado ${id} no encontrado`);
    const criteria = await this.prisma.evaluationCriterion.findMany({
      where: { cycle: grade.cycle },
      orderBy: { id: 'asc' },
    });
    return { ...grade, criteria };
  }

  /** Textos de competencias, indicadores y contenidos a partir de sus ids. */
  async resolve(ids: {
    specificCompetenceIds?: number[];
    indicatorIds?: number[];
    contentIds?: number[];
  }) {
    const [competences, indicators, contents] = await Promise.all([
      this.prisma.specificCompetence.findMany({
        where: { id: { in: ids.specificCompetenceIds ?? [] } },
        include: { fundamental: true },
      }),
      this.prisma.achievementIndicator.findMany({ where: { id: { in: ids.indicatorIds ?? [] } } }),
      this.prisma.curriculumContent.findMany({
        where: { id: { in: ids.contentIds ?? [] } },
        orderBy: { order: 'asc' },
      }),
    ]);
    return { competences, indicators, contents };
  }
}
