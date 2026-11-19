import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from 'prisma/prisma.service';
import { FileStorageService } from 'src/modules/storage/services/interfaces/file-storage.service';
import { StorageContainer } from 'src/modules/storage/enums/storage-container.enum';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { toDateOnly } from '../shared/dates.util';
import { summarizeStudent } from '../shared/grading.calculator';
import type { UploadedFileLike } from '../shared/uploaded-file';
import {
  CreateEvidenceDto,
  CreateObservationDto,
  CreateSectionDto,
  CreateStudentDto,
  UpdateObservationDto,
  UpdateSectionDto,
  UpdateStudentDto,
} from './dto/section.dto';
import { normalizeDocumentId, parseStudentCsv } from './student-csv.util';

const MAX_CSV_ROWS = 500;

export interface ImportRowError {
  row: number;
  documentId?: string;
  message: string;
}

export interface StudentImportResult {
  rows: number;
  imported: number;
  skipped: number;
  duplicates: number;
  errors: ImportRowError[];
}

const SECTION_INCLUDE = {
  grade: true,
  schoolYear: { select: { id: true, name: true, isActive: true } },
  schedules: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] },
  _count: {
    select: { students: { where: { deletedAt: null, isActive: true } } },
  },
} satisfies Prisma.SectionInclude;

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
    @Inject('FileStorageService') private readonly storage: FileStorageService,
  ) {}

  // ── Secciones ─────────────────────────────────────

  async list(teacherId: number, schoolYearId?: number) {
    const yearId =
      schoolYearId ?? (await this.scope.activeSchoolYear(teacherId))?.id;
    return this.prisma.section.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(yearId ? { schoolYearId: yearId } : {}),
      },
      include: SECTION_INCLUDE,
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    });
  }

  async get(teacherId: number, id: number) {
    await this.scope.section(teacherId, id);
    return this.prisma.section.findUniqueOrThrow({
      where: { id },
      include: {
        ...SECTION_INCLUDE,
        students: {
          where: { deletedAt: null },
          orderBy: [
            { listNumber: 'asc' },
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        },
      },
    });
  }

  async create(teacherId: number, dto: CreateSectionDto) {
    const year = await this.prisma.schoolYear.findFirst({
      where: { id: dto.schoolYearId, teacherId, deletedAt: null },
    });
    if (!year)
      throw new NotFoundException(
        `Año escolar ${dto.schoolYearId} no encontrado`,
      );
    return this.prisma.section.create({
      data: {
        teacherId,
        schoolYearId: dto.schoolYearId,
        gradeId: dto.gradeId,
        name: dto.name.trim(),
        subject: dto.subject ?? 'Matemática',
        color: dto.color ?? '#ec4899',
        room: dto.room,
        schedules: dto.schedules?.length
          ? { create: dto.schedules }
          : undefined,
      },
      include: SECTION_INCLUDE,
    });
  }

  async update(teacherId: number, id: number, dto: UpdateSectionDto) {
    await this.scope.section(teacherId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.schedules) {
        await tx.classSchedule.deleteMany({ where: { sectionId: id } });
        if (dto.schedules.length) {
          await tx.classSchedule.createMany({
            data: dto.schedules.map((s) => ({ ...s, sectionId: id })),
          });
        }
      }
      return tx.section.update({
        where: { id },
        data: {
          gradeId: dto.gradeId,
          name: dto.name?.trim(),
          subject: dto.subject,
          color: dto.color,
          room: dto.room,
        },
        include: SECTION_INCLUDE,
      });
    });
  }

  async remove(teacherId: number, id: number) {
    await this.scope.section(teacherId, id);
    await this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Estudiantes ───────────────────────────────────

  async listStudents(teacherId: number, sectionId?: number, q?: string) {
    const term = q?.trim();
    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        section: { teacherId, deletedAt: null },
        ...(sectionId ? { sectionId } : {}),
        ...(term
          ? {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { documentId: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        section: { select: { id: true, name: true, color: true, grade: true } },
      },
      orderBy: [
        { sectionId: 'asc' },
        { listNumber: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  async createStudent(
    teacherId: number,
    sectionId: number,
    dto: CreateStudentDto,
  ) {
    await this.scope.section(teacherId, sectionId);
    const listNumber = dto.listNumber ?? (await this.nextListNumber(sectionId));
    return this.prisma.student.create({
      data: this.studentData(dto, { sectionId, listNumber }),
    });
  }

  async importStudents(
    teacherId: number,
    sectionId: number,
    rows: CreateStudentDto[],
  ) {
    const result = await this.persistImport(
      teacherId,
      sectionId,
      rows.map((dto, index) => ({ row: index + 1, dto })),
    );
    return {
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    };
  }

  /** Importación directa de CSV: se valida fila a fila y se informa de cada error. */
  async importStudentsFile(
    teacherId: number,
    sectionId: number,
    file: UploadedFileLike,
  ): Promise<StudentImportResult> {
    await this.scope.section(teacherId, sectionId);
    const name = file.originalname.toLowerCase();
    const isCsv =
      /\.csv$/.test(name) || /text\/(csv|plain)/.test(file.mimetype);
    if (!isCsv) {
      if (/\.xlsx?$/.test(name) || /spreadsheet/.test(file.mimetype)) {
        throw new BadRequestException(
          'Los archivos .xlsx no se procesan en el servidor: conviértelos a CSV o usa la importación desde el navegador.',
        );
      }
      throw new BadRequestException(
        'Formato no soportado: sube un archivo .csv.',
      );
    }

    const rows = parseStudentCsv(file.buffer.toString('utf8'));
    if (!rows.length)
      throw new BadRequestException('El CSV no contiene filas de estudiantes');
    if (rows.length > MAX_CSV_ROWS) {
      throw new BadRequestException(
        `El CSV supera el máximo de ${MAX_CSV_ROWS} filas`,
      );
    }
    return this.persistImport(teacherId, sectionId, rows);
  }

  /** Valida, deduplica por documento y guarda las filas válidas en una sola transacción. */
  private async persistImport(
    teacherId: number,
    sectionId: number,
    entries: Array<{ row: number; dto: CreateStudentDto }>,
  ): Promise<StudentImportResult> {
    await this.scope.section(teacherId, sectionId);
    const errors: ImportRowError[] = [];
    const accepted: Array<{ row: number; dto: CreateStudentDto }> = [];

    for (const entry of entries) {
      const dto = plainToInstance(CreateStudentDto, entry.dto);
      const issues = validateSync(dto, { whitelist: true });
      const message = issues
        .flatMap((issue) => Object.values(issue.constraints ?? {}))
        .join('. ');
      if (message || !dto.firstName?.trim() || !dto.lastName?.trim()) {
        errors.push({
          row: entry.row,
          documentId: dto.documentId,
          message: message || 'Los apellidos y los nombres son obligatorios',
        });
        continue;
      }
      accepted.push({ row: entry.row, dto });
    }

    const existing = await this.prisma.student.findMany({
      where: { sectionId },
      select: { documentId: true },
    });
    const seen = new Set(
      existing
        .map((student) => normalizeDocumentId(student.documentId))
        .filter((key): key is string => Boolean(key)),
    );
    const unique: CreateStudentDto[] = [];
    let duplicates = 0;
    for (const entry of accepted) {
      const key = normalizeDocumentId(entry.dto.documentId);
      if (key && seen.has(key)) {
        duplicates++;
        errors.push({
          row: entry.row,
          documentId: entry.dto.documentId,
          message: 'Documento duplicado: fila omitida',
        });
        continue;
      }
      if (key) seen.add(key);
      unique.push(entry.dto);
    }

    let next = await this.nextListNumber(sectionId);
    const data = unique.map((dto) =>
      this.studentData(dto, {
        sectionId,
        listNumber: dto.listNumber ?? next++,
      }),
    );
    const imported = data.length
      ? (
          await this.prisma.$transaction((tx) =>
            tx.student.createMany({ data }),
          )
        ).count
      : 0;

    return {
      rows: entries.length,
      imported,
      skipped: entries.length - imported,
      duplicates,
      errors: errors.sort((a, b) => a.row - b.row),
    };
  }

  async getStudent(teacherId: number, id: number) {
    return this.scope.student(teacherId, id);
  }

  async updateStudent(teacherId: number, id: number, dto: UpdateStudentDto) {
    await this.scope.student(teacherId, id);
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    const { sectionId, isActive, ...rest } = dto;
    return this.prisma.student.update({
      where: { id },
      data: {
        ...this.studentPatch(rest),
        ...(sectionId ? { sectionId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
  }

  async removeStudent(teacherId: number, id: number) {
    await this.scope.student(teacherId, id);
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /** Reactiva un estudiante dado de baja (incluye los soft-delete). */
  async restoreStudent(teacherId: number, id: number) {
    const student = await this.prisma.student.findFirst({
      where: { id, section: { teacherId, deletedAt: null } },
    });
    if (!student) throw new NotFoundException(`Estudiante ${id} no encontrado`);
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  /**
   * Expediente digital: datos, asistencia, calificaciones, observaciones,
   * evidencias y enlaces de reportes compartidos.
   */
  async record(teacherId: number, id: number) {
    const student = await this.scope.student(teacherId, id);
    const [
      attendance,
      grades,
      final,
      observations,
      evidences,
      scores,
      reportLinks,
    ] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { studentId: id },
        orderBy: { date: 'desc' },
      }),
      this.prisma.competenceGrade.findMany({
        where: { studentId: id, sectionId: student.sectionId },
      }),
      this.prisma.finalGrade.findUnique({
        where: {
          studentId_sectionId: { studentId: id, sectionId: student.sectionId },
        },
      }),
      this.prisma.studentObservation.findMany({
        where: { studentId: id },
        orderBy: { date: 'desc' },
      }),
      this.prisma.evidence.findMany({
        where: { studentId: id },
        include: { assessment: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assessmentScore.findMany({
        where: { studentId: id, assessment: { deletedAt: null } },
        include: { assessment: true },
        orderBy: { assessment: { date: 'desc' } },
      }),
      this.prisma.parentReportLink.findMany({
        where: { studentId: id, revokedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      EXCUSED: 0,
    };
    for (const a of attendance) counts[a.status]++;
    const total = attendance.length;
    const passing = passingScore(student.section.schoolYear.gradingScale);

    return {
      student,
      attendance: {
        counts,
        total,
        rate: total
          ? Math.round(((counts.PRESENT + counts.LATE) / total) * 1000) / 10
          : null,
        recent: attendance.slice(0, 30),
      },
      grades: {
        entries: grades,
        final,
        summary: summarizeStudent(grades, final, passing),
      },
      activities: scores.map((s) => ({
        id: s.assessment.id,
        title: s.assessment.title,
        date: s.assessment.date,
        period: s.assessment.period,
        block: s.assessment.block,
        type: s.assessment.type,
        maxScore: s.assessment.maxScore,
        score: s.score,
        delivered: s.delivered,
        feedback: s.feedback,
      })),
      observations,
      evidences,
      reportLinks,
    };
  }

  // ── Observaciones ─────────────────────────────────

  async addObservation(
    teacherId: number,
    studentId: number,
    dto: CreateObservationDto,
  ) {
    await this.scope.student(teacherId, studentId);
    return this.prisma.studentObservation.create({
      data: {
        studentId,
        teacherId,
        type: dto.type,
        content: dto.content,
        date: dto.date ? toDateOnly(dto.date) : toDateOnly(new Date()),
        aiGenerated: dto.aiGenerated ?? false,
      },
    });
  }

  async updateObservation(
    teacherId: number,
    studentId: number,
    observationId: number,
    dto: UpdateObservationDto,
  ) {
    await this.scope.student(teacherId, studentId);
    const obs = await this.prisma.studentObservation.findFirst({
      where: { id: observationId, studentId, teacherId },
    });
    if (!obs)
      throw new NotFoundException(`Observación ${observationId} no encontrada`);
    return this.prisma.studentObservation.update({
      where: { id: observationId },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.date ? { date: toDateOnly(dto.date) } : {}),
        ...(dto.aiGenerated !== undefined
          ? { aiGenerated: dto.aiGenerated }
          : {}),
      },
    });
  }

  async removeObservation(teacherId: number, id: number) {
    const obs = await this.prisma.studentObservation.findFirst({
      where: { id, teacherId },
    });
    if (!obs) throw new NotFoundException(`Observación ${id} no encontrada`);
    await this.prisma.studentObservation.delete({ where: { id } });
  }

  // ── Evidencias ────────────────────────────────────

  async addEvidence(
    teacherId: number,
    studentId: number,
    dto: CreateEvidenceDto,
    file?: UploadedFileLike,
  ) {
    await this.scope.student(teacherId, studentId);
    if (dto.assessmentId)
      await this.scope.assessment(teacherId, dto.assessmentId);
    let storageKey: string | undefined;
    let mimeType: string | undefined;
    if (file) {
      const uploaded = await this.storage.upload(file.buffer, {
        containerName: StorageContainer.EVIDENCES,
        fileName: sanitizeFileName(file.originalname),
        contentType: file.mimetype,
        size: file.size,
        folder: `teacher-${teacherId}`,
      });
      storageKey = uploaded.storedFileName;
      mimeType = file.mimetype;
    }
    return this.prisma.evidence.create({
      data: {
        studentId,
        assessmentId: dto.assessmentId,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        storageKey,
        mimeType,
      },
    });
  }

  async evidenceFile(teacherId: number, id: number) {
    const evidence = await this.prisma.evidence.findFirst({
      where: { id, student: { section: { teacherId } } },
    });
    if (!evidence?.storageKey)
      throw new NotFoundException('La evidencia no tiene archivo');
    const file = await this.storage.download(
      StorageContainer.EVIDENCES,
      evidence.storageKey,
    );
    return { ...file, contentType: evidence.mimeType ?? file.contentType };
  }

  async removeEvidence(teacherId: number, id: number) {
    const evidence = await this.prisma.evidence.findFirst({
      where: { id, student: { section: { teacherId } } },
    });
    if (!evidence) throw new NotFoundException(`Evidencia ${id} no encontrada`);
    if (evidence.storageKey) {
      await this.storage
        .delete(StorageContainer.EVIDENCES, evidence.storageKey)
        .catch(() => undefined);
    }
    await this.prisma.evidence.delete({ where: { id } });
  }

  // ── Helpers ───────────────────────────────────────

  private async nextListNumber(sectionId: number) {
    const last = await this.prisma.student.aggregate({
      where: { sectionId, deletedAt: null },
      _max: { listNumber: true },
    });
    return (last._max.listNumber ?? 0) + 1;
  }

  private studentData(
    dto: CreateStudentDto,
    extra: { sectionId: number; listNumber: number },
  ) {
    return {
      ...this.studentPatch(dto),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      sectionId: extra.sectionId,
      listNumber: extra.listNumber,
    };
  }

  private studentPatch(dto: Partial<CreateStudentDto>) {
    return {
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      listNumber: dto.listNumber,
      documentId: dto.documentId,
      birthDate: dto.birthDate ? toDateOnly(dto.birthDate) : undefined,
      gender: dto.gender,
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      guardianEmail: dto.guardianEmail,
      notes: dto.notes,
    };
  }
}

export function passingScore(gradingScale: unknown): number {
  const value = (gradingScale as { passing?: unknown } | null)?.passing;
  return typeof value === 'number' ? value : 70;
}

export function sanitizeFileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[^\w.\-]+/g, '_')
      .slice(-120) || 'archivo'
  );
}
