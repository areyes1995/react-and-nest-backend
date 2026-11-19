import type { Readable } from 'stream';

export interface UploadFileOptions {
  containerName: string;
  fileName: string;
  contentType: string;
  size?: number;
  folder?: string;
}

export interface StoredFile {
  storedFileName: string;
  url?: string;
}

export interface DownloadedFile {
  stream: Readable;
  contentType: string;
  fileName: string;
  size?: number;
}

export interface FileStorageService {
  upload(buffer: Buffer, options: UploadFileOptions): Promise<StoredFile>;
  download(
    containerName: string,
    storedFileName: string,
  ): Promise<DownloadedFile>;
  delete(containerName: string, storedFileName: string): Promise<void>;
}
