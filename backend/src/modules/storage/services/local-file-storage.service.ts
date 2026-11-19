import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { mkdir, stat, unlink, writeFile } from 'fs/promises';
import { basename, extname, join, resolve, sep } from 'path';
import { randomUUID } from 'crypto';
import type {
  DownloadedFile,
  FileStorageService,
  StoredFile,
  UploadFileOptions,
} from './interfaces/file-storage.service';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
};

@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly root = resolve(process.cwd(), 'storage', 'uploads');

  async upload(
    buffer: Buffer,
    options: UploadFileOptions,
  ): Promise<StoredFile> {
    const container = this.safeSegment(options.containerName);
    const folder = this.safeSegment(options.folder ?? 'general');
    const fileName = `${Date.now()}-${randomUUID()}-${basename(options.fileName)}`;
    const target = join(this.root, container, folder, fileName);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, buffer);
    return { storedFileName: join(folder, fileName) };
  }

  async download(
    containerName: string,
    storedFileName: string,
  ): Promise<DownloadedFile> {
    const target = this.resolveKey(containerName, storedFileName);
    try {
      await stat(target);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    const info = await stat(target);
    return {
      stream: createReadStream(target),
      contentType:
        MIME_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
      fileName: basename(storedFileName),
      size: info.size,
    };
  }

  async delete(containerName: string, storedFileName: string): Promise<void> {
    await unlink(this.resolveKey(containerName, storedFileName));
  }

  private resolveKey(containerName: string, storedFileName: string): string {
    const target = resolve(
      this.root,
      this.safeSegment(containerName),
      storedFileName,
    );
    if (!target.startsWith(`${this.root}${sep}`)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return target;
  }

  private safeSegment(value: string): string {
    return basename(value).replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';
  }
}
