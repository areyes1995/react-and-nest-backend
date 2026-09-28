import { ExtractedDocument } from 'modules/document/dtos/extracted-document.dto';

export interface DocumentTextExtractorService {
  extractText(file: Buffer, mimeType?: string): Promise<ExtractedDocument>;
}
