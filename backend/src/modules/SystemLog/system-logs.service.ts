import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { UpdateSystemLogDto } from './dto/update-system-log.dto';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateSystemLogDto) {
    return this.prisma.systemLog.create({ data });
  }

  findAll() {
    return this.prisma.systemLog.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roles: { select: { role: { select: { name: true } } } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.systemLog.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  update(id: number, data: UpdateSystemLogDto) {
    return this.prisma.systemLog.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.systemLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
