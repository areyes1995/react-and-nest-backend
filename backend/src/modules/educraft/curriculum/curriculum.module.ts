import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum.controller';
import { CurriculumManageController } from './curriculum-manage.controller';
import { CurriculumService } from './curriculum.service';

@Module({
  controllers: [CurriculumController, CurriculumManageController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
