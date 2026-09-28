// ──────────────────────────────────────────────
// Endpoints de publicación del currículo (administración).
//   GET    /academy/content            → lo que ve el estudiante
//   GET    /academy/content/admin      → todo, con notas internas
//   PUT    /academy/content/lessons/:lessonId
//   PUT    /academy/content/courses/:courseSlug
//   DELETE /academy/content/lessons/:lessonId  → volver al defecto
// ──────────────────────────────────────────────

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { AcademyContentService } from '../services/academy-content.service';
import {
  UpdateCourseSettingDto,
  UpdateLessonSettingDto,
} from '../dtos/academy-content.dto';

@ApiTags('academy-content')
@Controller('academy/content')
@UseGuards(JwtGuard)
export class AcademyContentController {
  constructor(private readonly content: AcademyContentService) {}

  @Get()
  @ApiOperation({ summary: 'Publicación y videos de las clases (vista del estudiante).' })
  findPublic() {
    return this.content.findPublic();
  }

  @Get('admin')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Configuración completa, para el panel de administración.' })
  findAll() {
    return this.content.findAll();
  }

  @Put('lessons/:lessonId')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Publica/despublica una clase y configura su video.' })
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonSettingDto,
    @Req() request: any,
  ) {
    const userId = Number(request?.user?.id ?? request?.user?.sub);
    return this.content.updateLesson(
      lessonId,
      dto,
      Number.isFinite(userId) ? userId : undefined,
    );
  }

  @Put('courses/:courseSlug')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Publica o despublica un curso completo.' })
  updateCourse(
    @Param('courseSlug') courseSlug: string,
    @Body() dto: UpdateCourseSettingDto,
    @Req() request: any,
  ) {
    const userId = Number(request?.user?.id ?? request?.user?.sub);
    return this.content.updateCourse(
      courseSlug,
      dto,
      Number.isFinite(userId) ? userId : undefined,
    );
  }

  @Delete('lessons/:lessonId')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Devuelve la clase a su estado por defecto: publicada y sin video.' })
  resetLesson(@Param('lessonId') lessonId: string) {
    return this.content.resetLesson(lessonId);
  }
}
