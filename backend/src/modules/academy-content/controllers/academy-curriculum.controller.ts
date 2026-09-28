// ──────────────────────────────────────────────
// Endpoints del currículo de la academia.
//   GET /academy/curriculum → niveles, cursos y clases con su contenido.
//                             Estudiante: lo publicado. Admin: todo.
//   GET /academy/catalog    → público (landing): la estructura del
//                             programa, sin el contenido de las clases.
// ──────────────────────────────────────────────

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { AcademyCurriculumService } from '../services/academy-curriculum.service';

type AuthRequest = { user?: { id?: number; sub?: number } };

function userId(request: AuthRequest): number | undefined {
  const id = Number(request?.user?.id ?? request?.user?.sub);
  return Number.isFinite(id) ? id : undefined;
}

@ApiTags('academy-curriculum')
@Controller('academy')
@UseGuards(JwtGuard)
export class AcademyCurriculumController {
  constructor(private readonly curriculum: AcademyCurriculumService) {}

  @Get('curriculum')
  @ApiOperation({
    summary: 'Currículo completo con el contenido de cada clase.',
  })
  findCurriculum(@Req() request: AuthRequest) {
    return this.curriculum.curriculum(userId(request));
  }

  @Public()
  @Get('catalog')
  @ApiOperation({
    summary: 'Estructura pública del programa, sin el contenido de las clases.',
  })
  findCatalog() {
    return this.curriculum.catalog();
  }
}
