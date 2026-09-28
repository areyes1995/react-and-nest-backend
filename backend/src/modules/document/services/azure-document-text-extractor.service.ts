import { Injectable } from '@nestjs/common';
import { DocumentTextExtractorService } from './interfaces/document-text-extractor.service';
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from '@azure/ai-form-recognizer';
import { ExtractedDocument } from '../dtos/extracted-document.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureDocumentTextExtractorService implements DocumentTextExtractorService {
  private client: DocumentAnalysisClient;

 constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('AZURE_DI_ENDPOINT');
    const key = this.configService.get<string>('AZURE_DI_KEY');

    if (!endpoint || !key) {
      // No configuration – client will be used only in doc extraction if configured.
      this.client = null as unknown as DocumentAnalysisClient;
    } else {
      this.client = new DocumentAnalysisClient(
        endpoint,
        new AzureKeyCredential(key),
      );
    }

    // client is already configured above; this line was duplicate and removed.
  }

  async extractText(
    file: Buffer,
    mimeType?: string,
  ): Promise<ExtractedDocument> {
    if (!this.client) {
      throw new Error('Azure DI client is not configured.');
    }
    const poller = await this.client.beginAnalyzeDocument(
      'prebuilt-layout',
      file,
    );

    const result = await poller.pollUntilDone();

    if (!result || !result.pages) {
      throw new Error('Failed to extract text from document.');
    }

    const pages = result.pages.map((page) => ({
      pageNumber: page.pageNumber,
      content: page.lines?.map((l) => l.content).join(' ') ?? '',
    }));

    const fullText = pages.map((p) => p.content).join('\n');

    return {
      text: fullText,
      pages,
      raw: result,
    };
  }
}
