import { Module } from '@nestjs/common';
import { StorageModule } from 'src/modules/storage/storage.module';
import {
  LibraryController,
  PublicLibraryShareController,
} from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [StorageModule],
  controllers: [LibraryController, PublicLibraryShareController],
  providers: [LibraryService],
})
export class LibraryModule {}
