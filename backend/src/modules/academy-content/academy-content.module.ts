import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { AcademyContentController } from './controllers/academy-content.controller';
import { AcademyCurriculumController } from './controllers/academy-curriculum.controller';
import { AcademyContentService } from './services/academy-content.service';
import { AcademyCurriculumService } from './services/academy-curriculum.service';

/**
 * La academia: el currículo (niveles, cursos, clases y sus bloques) y las
 * decisiones de publicación del administrador sobre él.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AcademyCurriculumController, AcademyContentController],
  providers: [AcademyCurriculumService, AcademyContentService],
  exports: [AcademyCurriculumService, AcademyContentService],
})
export class AcademyContentModule {}
