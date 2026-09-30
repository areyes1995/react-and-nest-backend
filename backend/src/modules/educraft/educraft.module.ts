// ──────────────────────────────────────────────
// Educraft XYZ — plataforma integral del docente de
// Matemática. Agrupa todos los módulos académicos.
// ──────────────────────────────────────────────

import { Module } from '@nestjs/common';
import { EducraftSharedModule } from './shared/educraft-shared.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { TeacherModule } from './teacher/teacher.module';
import { SchoolYearModule } from './school-year/school-year.module';
import { SectionModule } from './section/section.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradingModule } from './grading/grading.module';
import { PlanningModule } from './planning/planning.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { CalendarModule } from './calendar/calendar.module';
import { LibraryModule } from './library/library.module';
import { ReportModule } from './report/report.module';
import { AiPedagogyModule } from './ai-pedagogy/ai-pedagogy.module';

@Module({
  imports: [
    EducraftSharedModule,
    CurriculumModule,
    TeacherModule,
    SchoolYearModule,
    SectionModule,
    AttendanceModule,
    GradingModule,
    PlanningModule,
    EvaluationModule,
    CalendarModule,
    LibraryModule,
    ReportModule,
    AiPedagogyModule,
  ],
})
export class EducraftModule {}
