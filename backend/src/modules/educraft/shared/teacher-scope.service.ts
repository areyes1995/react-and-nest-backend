// ──────────────────────────────────────────────
// TeacherScopeService — aislamiento por docente.
// Cada docente solo accede a sus propios registros:
// estas comprobaciones se usan antes de leer o
// modificar datos que cuelgan de una sección.
// ──────────────────────────────────────────────

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TeacherScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async section(teacherId: number, sectionId: number) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, teacherId, deletedAt: null },
      include: { grade: true, schoolYear: true },
    });
    if (!section) {
      throw new NotFoundException(`Sección ${sectionId} no encontrada`);
    }
    return section;
  }

  async student(teacherId: number, studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        section: { teacherId, deletedAt: null },
      },
      include: { section: { include: { grade: true, schoolYear: true } } },
    });
    if (!student) {
      throw new NotFoundException(`Estudiante ${studentId} no encontrado`);
    }
    return student;
  }

  async assessment(teacherId: number, assessmentId: number) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, teacherId, deletedAt: null },
    });
    if (!assessment) {
      throw new NotFoundException(`Actividad ${assessmentId} no encontrada`);
    }
    return assessment;
  }

  /** Año escolar activo del docente (el más reciente si hay varios). */
  async activeSchoolYear(teacherId: number) {
    return this.prisma.schoolYear.findFirst({
      where: { teacherId, deletedAt: null, isActive: true },
      orderBy: { startDate: 'desc' },
      include: { periods: { orderBy: { number: 'asc' } } },
    });
  }
}
