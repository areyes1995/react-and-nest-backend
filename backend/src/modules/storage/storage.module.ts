import { Module } from '@nestjs/common';
import { LocalFileStorageService } from './services/local-file-storage.service';

@Module({
  providers: [
    { provide: 'FileStorageService', useClass: LocalFileStorageService },
  ],
  exports: ['FileStorageService'],
})
export class StorageModule {}
