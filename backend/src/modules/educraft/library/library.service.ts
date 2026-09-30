import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ResourceCategory } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FileStorageService } from 'src/modules/storage/services/interfaces/file-storage.service';
import { StorageContainer } from 'src/modules/storage/enums/storage-container.enum';
import { sanitizeFileName } from '../section/section.service';
import type { UploadedFileLike } from '../shared/uploaded-file';
import { CreateResourceDto, UpdateResourceDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('FileStorageService') private readonly storage: FileStorageService,
  ) {}

  list(teacherId: number, filter: { category?: ResourceCategory; q?: string; tag?: string }) {
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

  async create(teacherId: number, dto: CreateResourceDto, file?: UploadedFileLike) {
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

  async update(teacherId: number, id: number, dto: UpdateResourceDto) {
    await this.find(teacherId, id);
    return this.prisma.libraryResource.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        tags: dto.tags,
        url: dto.url,
      },
    });
  }

  async remove(teacherId: number, id: number) {
    const resource = await this.find(teacherId, id);
    if (resource.storageKey) {
      await this.storage.delete(StorageContainer.LIBRARY, resource.storageKey).catch(() => undefined);
    }
    await this.prisma.libraryResource.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async file(teacherId: number, id: number) {
    const resource = await this.find(teacherId, id);
    if (!resource.storageKey) throw new NotFoundException('El recurso es un enlace externo');
    const file = await this.storage.download(StorageContainer.LIBRARY, resource.storageKey);
    return {
      ...file,
      fileName: resource.fileName ?? file.fileName,
      contentType: resource.mimeType ?? file.contentType,
    };
  }

  private async find(teacherId: number, id: number) {
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id, teacherId, deletedAt: null },
    });
    if (!resource) throw new NotFoundException(`Recurso ${id} no encontrado`);
    return resource;
  }
}
