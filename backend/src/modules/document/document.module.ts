import { Module } from '@nestjs/common';
import { AzureDocumentTextExtractorService } from './services/azure-document-text-extractor.service';

@Module({
  providers: [
    {
      provide: 'DocumentTextExtractorService',
      useClass: AzureDocumentTextExtractorService,
    },
  ],
  exports: ['DocumentTextExtractorService'],
})
export class DocumentModule {}
