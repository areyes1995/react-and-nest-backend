import {
  BadRequestException,
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  MAX_UPLOAD_BYTES,
  type UploadedFileLike,
} from '../shared/uploaded-file';
import {
  CreateEvidenceDto,
  CreateObservationDto,
  CreateSectionDto,
  CreateStudentDto,
  ImportStudentsDto,
  UpdateObservationDto,
  UpdateSectionDto,
  UpdateStudentDto,
} from './dto/section.dto';
import { SectionService } from './section.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('sections', 'Secciones', 'academic:manage')
export class SectionController {
  constructor(private readonly sections: SectionService) {}

  @Get()
  @ApiQuery({
    name: 'schoolYearId',
    required: false,
    description: 'Por defecto, el año activo',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.sections.list(user.id, optionalInt(schoolYearId));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Sección con horario y lista de estudiantes.',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.get(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sections.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sections.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.remove(user.id, id);
  }

  @Post(':id/students')
  createStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStudentDto,
  ) {
    return this.sections.createStudent(user.id, id, dto);
  }

  @Post(':id/students/import')
  @ApiResponse({
    status: 201,
    description: 'Importación masiva (filas leídas de Excel/CSV).',
  })
  importStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImportStudentsDto,
  ) {
    return this.sections.importStudents(user.id, id, dto.students);
  }

  @Post(':id/students/import-file')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description:
      'Importa un CSV: total de filas, importados, omitidos y errores por fila.',
  })
  @ApiResponse({
    status: 400,
    description: 'CSV inválido o .xlsx (usar el parser del navegador).',
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  importStudentsFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    if (!file) throw new BadRequestException('Selecciona un archivo .csv');
    return this.sections.importStudentsFile(user.id, id, file);
  }
}

@EducraftController('students', 'Estudiantes', 'academic:manage')
export class StudentController {
  constructor(private readonly sections: SectionService) {}

  @Get()
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'q', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId') sectionId?: string,
    @Query('q') q?: string,
  ) {
    return this.sections.listStudents(user.id, optionalInt(sectionId), q);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Datos del estudiante y su sección.',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.getStudent(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.sections.updateStudent(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.removeStudent(user.id, id);
  }

  @Post(':id/restore')
  @ApiResponse({
    status: 201,
    description: 'Reactiva un estudiante dado de baja.',
  })
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.restoreStudent(user.id, id);
  }

  @Get(':id/record')
  @ApiResponse({
    status: 200,
    description: 'Expediente digital del estudiante.',
  })
  record(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sections.record(user.id, id);
  }

  @Post(':id/observations')
  addObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateObservationDto,
  ) {
    return this.sections.addObservation(user.id, id, dto);
  }

  @Patch(':id/observations/:observationId')
  updateObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('observationId', ParseIntPipe) observationId: number,
    @Body() dto: UpdateObservationDto,
  ) {
    return this.sections.updateObservation(user.id, id, observationId, dto);
  }

  @Delete('observations/:observationId')
  @HttpCode(204)
  removeObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('observationId', ParseIntPipe) observationId: number,
  ) {
    return this.sections.removeObservation(user.id, observationId);
  }

  @Post(':id/evidences')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  addEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEvidenceDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.sections.addEvidence(user.id, id, dto, file);
  }

  @Get('evidences/:evidenceId/file')
  async evidenceFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('evidenceId', ParseIntPipe) evidenceId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.sections.evidenceFile(user.id, evidenceId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    return new StreamableFile(file.stream);
  }

  @Delete('evidences/:evidenceId')
  @HttpCode(204)
  removeEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('evidenceId', ParseIntPipe) evidenceId: number,
  ) {
    return this.sections.removeEvidence(user.id, evidenceId);
  }
}
