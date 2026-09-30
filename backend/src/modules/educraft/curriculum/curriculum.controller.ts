import { Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { CurriculumService } from './curriculum.service';

@EducraftController('curriculum', 'Currículo', 'curriculum:read')
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get('grades')
  @ApiResponse({ status: 200, description: 'Grados del Nivel Secundario.' })
  grades() {
    return this.curriculum.grades();
  }

  @Get('fundamentals')
  @ApiResponse({ status: 200, description: 'Competencias fundamentales y su bloque de calificación.' })
  fundamentals() {
    return this.curriculum.fundamentals();
  }

  @Get('grades/:id')
  @ApiResponse({
    status: 200,
    description: 'Malla curricular del grado: competencias específicas, indicadores, contenidos y criterios.',
  })
  grade(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.grade(id);
  }
}
