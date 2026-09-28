import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthEvent } from '@prisma/client';

@Injectable()
export class AuthLogService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: {
    userId?: number;
    email?: string;
    event: AuthEvent;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.authLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        event: data.event,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findAll() {
    return this.prisma.authLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
}