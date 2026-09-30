import { Module } from '@nestjs/common';
import { StorageModule } from 'src/modules/storage/storage.module';
import { SectionController, StudentController } from './section.controller';
import { SectionService } from './section.service';

@Module({
  imports: [StorageModule],
  controllers: [SectionController, StudentController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}
