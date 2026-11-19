import { Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { CurriculumService } from './curriculum.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('curriculum', 'Currículo', 'curriculum:read')
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get('grades')
  @ApiResponse({ status: 200, description: 'Grados del Nivel Secundario.' })
  grades() {
    return this.curriculum.grades();
  }

  @Get('fundamentals')
  @ApiResponse({
    status: 200,
    description: 'Competencias fundamentales y su bloque de calificación.',
  })
  fundamentals() {
    return this.curriculum.fundamentals();
  }

  @Get('axes')
  @ApiQuery({ name: 'cycle', required: false })
  @ApiResponse({ status: 200, description: 'Ejes transversales por ciclo.' })
  axes(@Query('cycle') cycle?: string) {
    return this.curriculum.axes(optionalInt(cycle));
  }

  @Get('capacities')
  @ApiQuery({ name: 'gradeId', required: false })
  @ApiQuery({ name: 'specificCompetenceId', required: false })
  @ApiResponse({ status: 200, description: 'Capacidades del catálogo.' })
  capacities(
    @Query('gradeId') gradeId?: string,
    @Query('specificCompetenceId') specificCompetenceId?: string,
  ) {
    return this.curriculum.capacities({
      gradeId: optionalInt(gradeId),
      specificCompetenceId: optionalInt(specificCompetenceId),
    });
  }

  @Get('performances')
  @ApiQuery({ name: 'gradeId', required: false })
  @ApiQuery({ name: 'capacityId', required: false })
  @ApiResponse({ status: 200, description: 'Desempeños del catálogo.' })
  performances(
    @Query('gradeId') gradeId?: string,
    @Query('capacityId') capacityId?: string,
  ) {
    return this.curriculum.performances({
      gradeId: optionalInt(gradeId),
      capacityId: optionalInt(capacityId),
    });
  }

  @Get('grades/:id')
  @ApiResponse({
    status: 200,
    description:
      'Malla curricular del grado: ejes, competencias, capacidades, desempeños, indicadores, contenidos y criterios.',
  })
  grade(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.grade(id);
  }
}
