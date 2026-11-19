import { createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResourceCategory } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FileStorageService } from 'src/modules/storage/services/interfaces/file-storage.service';
import { StorageContainer } from 'src/modules/storage/enums/storage-container.enum';
import { addDays } from '../shared/dates.util';
import { sanitizeFileName } from '../section/section.service';
import type { UploadedFileLike } from '../shared/uploaded-file';
import {
  BulkTagsDto,
  CreateResourceDto,
  ShareResourceDto,
  UpdateResourceDto,
} from './dto/library.dto';

interface SharePayload {
  r: number;
  t: number;
  e: number;
}

export interface LibraryShare {
  token: string;
  url: string;
  expiresAt: string;
  resourceId: number;
}

@Injectable()
export class LibraryService {
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('FileStorageService') private readonly storage: FileStorageService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>('SECRET_PASSPORT');
  }

  list(
    teacherId: number,
    filter: { category?: ResourceCategory; q?: string; tag?: string },
  ) {
    const q = filter.q?.trim();
    return this.prisma.libraryResource.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.tag ? { tags: { has: filter.tag.toLowerCase() } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tags: { has: q.toLowerCase() } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async summary(teacherId: number) {
    const groups = await this.prisma.libraryResource.groupBy({
      by: ['category'],
      where: { teacherId, deletedAt: null },
      _count: { _all: true },
    });
    return Object.fromEntries(groups.map((g) => [g.category, g._count._all]));
  }

  async get(teacherId: number, id: number) {
    return this.find(teacherId, id);
  }

  async create(
    teacherId: number,
    dto: CreateResourceDto,
    file?: UploadedFileLike,
  ) {
    if (!file && !dto.url) {
      throw new BadRequestException('Sube un archivo o indica un enlace');
    }
    let upload: { storedFileName: string } | undefined;
    if (file) {
      upload = await this.storage.upload(file.buffer, {
        containerName: StorageContainer.LIBRARY,
        fileName: sanitizeFileName(file.originalname),
        contentType: file.mimetype,
        size: file.size,
        folder: `teacher-${teacherId}`,
      });
    }
    return this.prisma.libraryResource.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        tags: dto.tags ?? [],
        url: dto.url,
        storageKey: upload?.storedFileName,
        fileName: file?.originalname,
        mimeType: file?.mimetype,
        sizeBytes: file?.size,
      },
    });
  }

  /** Actualiza los metadatos y, si llega un archivo, lo reemplaza y borra el anterior. */
  async update(
    teacherId: number,
    id: number,
    dto: UpdateResourceDto,
    file?: UploadedFileLike,
  ) {
    const current = await this.find(teacherId, id);
    let upload: { storedFileName: string } | undefined;
    if (file) {
      upload = await this.storage.upload(file.buffer, {
        containerName: StorageContainer.LIBRARY,
        fileName: sanitizeFileName(file.originalname),
        contentType: file.mimetype,
        size: file.size,
        folder: `teacher-${teacherId}`,
      });
    }

    const updated = await this.prisma.libraryResource.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        tags: dto.tags,
        url: dto.url,
        ...(upload && file
          ? {
              storageKey: upload.storedFileName,
              fileName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: file.size,
            }
          : {}),
      },
    });

    if (
      upload &&
      current.storageKey &&
      current.storageKey !== upload.storedFileName
    ) {
      await this.storage
        .delete(StorageContainer.LIBRARY, current.storageKey)
        .catch(() => undefined);
    }
    return updated;
  }

  /** Atajo multipart para reemplazar solo el archivo de un recurso. */
  async replaceFile(teacherId: number, id: number, file: UploadedFileLike) {
    return this.update(teacherId, id, {}, file);
  }

  async bulkTags(teacherId: number, id: number, dto: BulkTagsDto) {
    const resource = await this.find(teacherId, id);
    const tags = new Set(resource.tags.map((tag) => tag.toLowerCase()));
    for (const tag of dto.add ?? []) tags.add(tag.toLowerCase());
    for (const tag of dto.remove ?? []) tags.delete(tag.toLowerCase());
    return this.prisma.libraryResource.update({
      where: { id },
      data: { tags: [...tags] },
    });
  }

  /** Token HMAC sin estado: no requiere columnas nuevas en LibraryResource. */
  async share(teacherId: number, id: number, days = 30): Promise<LibraryShare> {
    const resource = await this.find(teacherId, id);
    const expiresAt = addDays(new Date(), Math.min(Math.max(days, 1), 180));
    const payload: SharePayload = {
      r: resource.id,
      t: teacherId,
      e: expiresAt.getTime(),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret)
      .update(body)
      .digest('base64url');
    const token = `${body}.${signature}`;
    return {
      token,
      url: `/public/library/share/${token}`,
      expiresAt: expiresAt.toISOString(),
      resourceId: resource.id,
    };
  }

  /** Descarga pública de solo lectura: valida firma, vigencia y propiedad. */
  async publicSharedFile(token: string) {
    const payload = this.verifyShareToken(token);
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id: payload.r, teacherId: payload.t, deletedAt: null },
    });
    if (!resource?.storageKey)
      throw new NotFoundException(
        'El enlace no es válido o el recurso ya no está disponible',
      );
    const file = await this.storage.download(
      StorageContainer.LIBRARY,
      resource.storageKey,
    );
    return {
      ...file,
      fileName: resource.fileName ?? file.fileName,
      contentType: resource.mimeType ?? file.contentType,
    };
  }

  async remove(teacherId: number, id: number) {
    const resource = await this.find(teacherId, id);
    if (resource.storageKey) {
      await this.storage
        .delete(StorageContainer.LIBRARY, resource.storageKey)
        .catch(() => undefined);
    }
    await this.prisma.libraryResource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async file(teacherId: number, id: number) {
    const resource = await this.find(teacherId, id);
    if (!resource.storageKey)
      throw new NotFoundException('El recurso es un enlace externo');
    const file = await this.storage.download(
      StorageContainer.LIBRARY,
      resource.storageKey,
    );
    return {
      ...file,
      fileName: resource.fileName ?? file.fileName,
      contentType: resource.mimeType ?? file.contentType,
    };
  }

  private verifyShareToken(token: string): SharePayload {
    const [body, signature] = token.split('.');
    if (!body || !signature) throw new NotFoundException('Enlace no válido');
    const expected = createHmac('sha256', this.secret)
      .update(body)
      .digest('base64url');
    const received = Buffer.from(signature);
    const computed = Buffer.from(expected);
    if (
      received.length !== computed.length ||
      !timingSafeEqual(received, computed)
    ) {
      throw new NotFoundException('Enlace no válido');
    }
    let payload: SharePayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      ) as SharePayload;
    } catch {
      throw new NotFoundException('Enlace no válido');
    }
    if (
      !Number.isInteger(payload?.r) ||
      !Number.isInteger(payload?.t) ||
      typeof payload?.e !== 'number' ||
      payload.e < Date.now()
    ) {
      throw new NotFoundException('El enlace no es válido o ha expirado');
    }
    return payload;
  }

  private async find(teacherId: number, id: number) {
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id, teacherId, deletedAt: null },
    });
    if (!resource) throw new NotFoundException(`Recurso ${id} no encontrado`);
    return resource;
  }
}
